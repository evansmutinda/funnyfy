/**
 * Replicate prediction polling + job DB sync.
 * Predictions are removed from the Replicate API ~1 hour after creation —
 * persist output_image_url to Postgres as soon as we have it.
 */

import { query } from './db';
import { creditUsageForJob } from './usage';
import { finalizeJobCost } from './job-cost';
import {
  handleContentPolicyViolation,
  isReplicateContentPolicyError,
} from './sightengine-moderation';
import {
  blankOutputErrorMessage,
  validateOutputImageUrl,
} from './output-validation';

const targetApiKey = process.env.TARGET_API_KEY;
const REPLICATE_PREDICTIONS_URL = 'https://api.replicate.com/v1/predictions';

/** Stop relying on Replicate API slightly before the 1h deletion window. */
export const REPLICATE_PREDICTION_MAX_AGE_MS = 55 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Pull the first usable image URL from Replicate's varied output shapes. */
export function getImageUrlFromOutput(output: unknown): string | null {
  if (!output) return null;

  if (typeof output === 'string') {
    const trimmed = output.trim();
    return isHttpUrl(trimmed) ? trimmed : null;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = getImageUrlFromOutput(item);
      if (url) return url;
    }
    return null;
  }

  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    for (const key of ['url', 'uri', 'href', 'image', 'image_url', 'output']) {
      const url = getImageUrlFromOutput(obj[key]);
      if (url) return url;
    }

    // Some File-like payloads stringify to the delivery URL.
    if (typeof (obj as { toString?: () => string }).toString === 'function') {
      const asString = String(obj).trim();
      if (asString && asString !== '[object Object]' && isHttpUrl(asString)) {
        return asString;
      }
    }
  }

  return null;
}

function replicateHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(targetApiKey ? { Authorization: `Token ${targetApiKey}` } : {}),
  };
}

export async function fetchReplicatePrediction(predictionId: string): Promise<{
  ok: boolean;
  notFound?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  if (!targetApiKey) {
    return { ok: false, error: 'TARGET_API_KEY not configured' };
  }

  const res = await fetch(`${REPLICATE_PREDICTIONS_URL}/${predictionId}`, {
    headers: replicateHeaders(),
  });

  if (res.status === 404) {
    return { ok: false, notFound: true, error: 'Prediction not found (expired or invalid)' };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data === 'object' ? JSON.stringify(data) : String(data),
    };
  }

  return { ok: true, data: data as Record<string, unknown> };
}

export async function pollReplicatePrediction(
  initial: Record<string, unknown>,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<Record<string, unknown>> {
  const terminalStatuses = new Set(['succeeded', 'failed', 'canceled']);
  let prediction = initial;

  if (!prediction?.urls || typeof (prediction.urls as { get?: string }).get !== 'string') {
    return prediction;
  }

  const statusUrl = (prediction.urls as { get: string }).get;
  let pollErrors = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (terminalStatuses.has(String(prediction.status))) {
      break;
    }

    await sleep(intervalMs);

    try {
      const statusRes = await fetch(statusUrl, { headers: replicateHeaders() });
      const statusData = await statusRes.json().catch(() => ({}));

      if (!statusRes.ok) {
        pollErrors += 1;
        console.warn('[replicate-sync] Poll HTTP error:', statusRes.status, statusData);
        if (pollErrors >= 3) break;
        continue;
      }

      pollErrors = 0;
      prediction = statusData as Record<string, unknown>;
    } catch (err) {
      pollErrors += 1;
      console.warn('[replicate-sync] Poll network error:', err);
      if (pollErrors >= 3) break;
    }
  }

  return prediction;
}

export interface JobSyncRow {
  id: string;
  user_id: string | null;
  status: string;
  replicate_prediction_id: string | null;
  output_image_url: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  style_id?: string;
  input_image_url?: string | null;
}

async function loadJobById(jobId: string): Promise<JobSyncRow | null> {
  const result = await query<JobSyncRow & { style_id: string }>(
    `SELECT id, user_id, style_id, status, replicate_prediction_id, output_image_url,
            error_message, started_at, completed_at, created_at
     FROM jobs WHERE id = $1`,
    [jobId]
  );
  return result.rows[0] ?? null;
}

function predictionAgeMs(job: JobSyncRow): number {
  const anchor = job.started_at || job.created_at;
  return Date.now() - new Date(anchor).getTime();
}

export async function markJobCompleted(jobId: string, outputUrl: string, replicateId: string | null) {
  const validation = await validateOutputImageUrl(outputUrl);
  if (!validation.ok) {
    console.warn('[replicate-sync] Output failed validation:', validation);
    await markJobFailed(
      jobId,
      blankOutputErrorMessage(validation.reason),
      replicateId
    );
    return;
  }

  const updated = await query<{ id: string }>(
    `UPDATE jobs SET status = 'completed', output_image_url = $1,
     replicate_prediction_id = COALESCE($2, replicate_prediction_id),
     error_message = NULL, completed_at = NOW()
     WHERE id = $3
       AND (status IS DISTINCT FROM 'completed' OR output_image_url IS NULL)
     RETURNING id`,
    [outputUrl, replicateId, jobId]
  );
  if (updated.rows.length === 0) {
    return;
  }

  const jobRow = await query<{ user_id: string | null; style_id: string }>(
    `SELECT user_id, style_id FROM jobs WHERE id = $1`,
    [jobId]
  );
  const userId = jobRow.rows[0]?.user_id;
  const styleId = jobRow.rows[0]?.style_id ?? null;
  if (userId) {
    try {
      await creditUsageForJob(jobId, userId);
    } catch (creditErr) {
      console.error('[replicate-sync] creditUsageForJob failed:', creditErr);
    }
  }
  await finalizeJobCost(jobId, styleId, 'completed');
}

export async function markJobFailed(jobId: string, errorMessage: string, replicateId: string | null) {
  const updated = await query<{ id: string; style_id: string }>(
    `UPDATE jobs SET status = 'failed', error_message = $1,
     replicate_prediction_id = COALESCE($2, replicate_prediction_id),
     completed_at = NOW()
     WHERE id = $3
       AND status IN ('pending', 'processing')
     RETURNING id, style_id`,
    [errorMessage.slice(0, 1000), replicateId, jobId]
  );
  if (updated.rows.length === 0) {
    return;
  }
  await finalizeJobCost(jobId, updated.rows[0]?.style_id ?? null, 'failed');
}

/**
 * Apply a terminal Replicate prediction payload to the matching job.
 * Used by polling sync and the Replicate webhook.
 */
export async function applyReplicatePredictionToJob(
  job: JobSyncRow,
  data: Record<string, unknown>
): Promise<JobSyncRow | null> {
  const status = String(data.status || '');
  const outputUrl = getImageUrlFromOutput(data.output);
  const replicateId = String(data.id || job.replicate_prediction_id || '');

  if (status === 'succeeded') {
    if (outputUrl) {
      await markJobCompleted(job.id, outputUrl, replicateId || null);
      return loadJobById(job.id);
    }
    // Generation succeeded on Replicate but no image URL — fail fast (no limbo until expiry).
    await markJobFailed(job.id, 'Replicate did not return an image', replicateId || null);
    return loadJobById(job.id);
  }

  if (status === 'failed' || status === 'canceled') {
    const detail = data.error ?? data.logs ?? 'No details';
    const rawError = `Replicate ${status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    if (isReplicateContentPolicyError(rawError)) {
      await handleContentPolicyViolation(job.id, job.user_id, {
        source: 'replicate',
        error: rawError.slice(0, 500),
      });
      return loadJobById(job.id);
    }
    await markJobFailed(job.id, rawError, replicateId || null);
    return loadJobById(job.id);
  }

  return job;
}

/** Stable public base URL for Replicate to call back into. */
export function getPublicApiBaseUrl(): string | null {
  const candidates = [
    process.env.PUBLIC_API_URL,
    process.env.WEBHOOK_BASE_URL,
    process.env.ALLOWED_ORIGIN,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, '')}`
      : null,
  ];

  for (const raw of candidates) {
    const value = String(raw || '')
      .trim()
      .replace(/\/$/, '');
    if (value.startsWith('https://') && value !== 'https://*') {
      return value;
    }
  }
  return null;
}

/** Webhook URL registered on each prediction create (null = polling-only fallback). */
export function buildReplicateWebhookUrl(jobId?: string): string | null {
  const base = getPublicApiBaseUrl();
  const secret = (process.env.REPLICATE_WEBHOOK_SECRET || '').trim();
  if (!base || !secret) return null;
  const url = new URL('/api/webhooks/replicate', base);
  url.searchParams.set('token', secret);
  if (jobId) {
    url.searchParams.set('jobId', jobId);
  }
  return url.toString();
}

/**
 * Refresh job state from Replicate when still in-flight or stuck.
 * Safe to call from GET /api/job and the queue worker.
 */
export async function syncJobWithReplicate(job: JobSyncRow): Promise<JobSyncRow | null> {
  if (job.status === 'completed' && job.output_image_url) {
    return job;
  }

  if (job.status === 'failed') {
    const retryable =
      !job.output_image_url &&
      Boolean(job.replicate_prediction_id) &&
      Boolean(
        job.error_message &&
          (job.error_message.includes('JOB_STUCK') ||
            job.error_message.includes('Worker interrupted'))
      );
    if (!retryable) {
      return job;
    }
  }

  // Worker saved output but didn't flip status (crash mid-update)
  if (job.output_image_url) {
    await markJobCompleted(job.id, job.output_image_url, job.replicate_prediction_id);
    return loadJobById(job.id);
  }

  const ageMs = predictionAgeMs(job);

  if (job.replicate_prediction_id) {
    const fetched = await fetchReplicatePrediction(job.replicate_prediction_id);

    if (fetched.notFound) {
      if (job.output_image_url) {
        await markJobCompleted(job.id, job.output_image_url, job.replicate_prediction_id);
      } else if (ageMs >= REPLICATE_PREDICTION_MAX_AGE_MS) {
        await markJobFailed(
          job.id,
          'JOB_OUTPUT_EXPIRED: Replicate prediction expired before the image could be saved',
          job.replicate_prediction_id
        );
      }
      return loadJobById(job.id);
    }

    if (!fetched.ok || !fetched.data) {
      return job;
    }

    const data = fetched.data;
    const replicateId = String(data.id || job.replicate_prediction_id || '');
    const status = String(data.status || '');

    if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
      return applyReplicatePredictionToJob(job, data);
    }

    // Still processing on Replicate — persist id if missing
    if (replicateId && !job.replicate_prediction_id) {
      await query(
        `UPDATE jobs SET replicate_prediction_id = $1 WHERE id = $2`,
        [replicateId, job.id]
      );
    }

    return loadJobById(job.id);
  }

  // Processing but no prediction id — worker likely timed out before Replicate POST returned
  if (job.status === 'processing' && ageMs > 12 * 60 * 1000) {
    await markJobFailed(
      job.id,
      'JOB_STUCK: Worker interrupted before generation started. Tap Try again in the app.',
      null
    );
    return loadJobById(job.id);
  }

  return job;
}

/** Recover a few stale in-flight jobs (called at start of queue worker). */
export async function recoverStaleProcessingJobs(limit = 2): Promise<number> {
  const stale = await query<{ id: string }>(
    `SELECT id FROM jobs
     WHERE status = 'processing'
       AND started_at < NOW() - INTERVAL '2 minutes'
     ORDER BY started_at ASC
     LIMIT $1`,
    [limit]
  );

  let recovered = 0;
  for (const row of stale.rows) {
    const job = await loadJobById(row.id);
    if (!job) continue;
    const before = job.status;
    const after = await syncJobWithReplicate(job);
    if (after && after.status !== before) {
      recovered += 1;
    }
  }
  return recovered;
}

export async function saveReplicatePredictionId(jobId: string, predictionId: string) {
  await query(
    `UPDATE jobs SET replicate_prediction_id = $1 WHERE id = $2 AND replicate_prediction_id IS NULL`,
    [predictionId, jobId]
  );
}
