import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';
import { applyMiddleware } from './_utils/middleware';
import { requireAuth } from './_utils/auth';
import { safeErrorResponse } from './_utils/security';
import { getEstimatedWaitTime } from './_utils/queue-stats';
import { humanizeJobError } from './_utils/job-messages';
import { syncJobWithReplicate, type JobSyncRow } from './_utils/replicate-sync';
import { getContentPolicySource, isContentPolicyError } from './_utils/sightengine-moderation';
import { revokeUsageForJob } from './_utils/usage';
import {
  BLANK_OUTPUT_CODE,
  BLANK_OUTPUT_MESSAGE,
  blankOutputErrorMessage,
} from './_utils/output-validation';

type JobPostBody = {
  action?: string;
  jobId?: string;
  reason?: string;
};

function parseJobPostBody(req: VercelRequest): JobPostBody | null {
  try {
    if (typeof req.body === 'string') {
      return req.body ? (JSON.parse(req.body) as JobPostBody) : {};
    }
    return (req.body || {}) as JobPostBody;
  } catch {
    return null;
  }
}

function resolveJobAction(req: VercelRequest, body: JobPostBody): string {
  const queryAction = req.query?.action;
  const fromQuery = Array.isArray(queryAction) ? queryAction[0] : queryAction;
  return String(fromQuery || body.action || '').trim();
}

async function handleReportBadOutput(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  body: JobPostBody,
) {

  const jobId = body.jobId || (req.query.id as string) || (req.query.jobId as string);
  if (!jobId || typeof jobId !== 'string') {
    return safeErrorResponse(res, 400, 'MISSING_JOB_ID', 'jobId is required');
  }

  const jobResult = await query<{
    id: string;
    user_id: string | null;
    status: string;
    output_image_url: string | null;
  }>(
    `SELECT id, user_id, status, output_image_url FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    return safeErrorResponse(res, 404, 'JOB_NOT_FOUND', 'Job not found');
  }

  const job = jobResult.rows[0];
  if (job.user_id && job.user_id !== userId) {
    return safeErrorResponse(res, 403, 'FORBIDDEN', 'Forbidden');
  }

  if (job.status !== 'completed') {
    return res.status(200).json({
      ok: true,
      alreadyHandled: true,
      message: 'Job is not in completed state',
      status: job.status,
    });
  }

  const reason = String(body.reason || 'client_unloadable').slice(0, 120);
  await query(
    `
      UPDATE jobs
      SET status = 'failed',
          error_message = $1,
          completed_at = COALESCE(completed_at, NOW())
      WHERE id = $2 AND status = 'completed'
    `,
    [blankOutputErrorMessage(reason), jobId]
  );

  let revoked = false;
  if (job.user_id) {
    revoked = await revokeUsageForJob(jobId, job.user_id);
  }

  console.warn('[job] Reported blank/unloadable output', { jobId, reason, revoked });

  return res.status(200).json({
    ok: true,
    revoked,
    message: BLANK_OUTPUT_MESSAGE,
    error: BLANK_OUTPUT_CODE,
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyMiddleware(req, res, ['GET', 'POST', 'OPTIONS'])) return;

  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === 'POST') {
    const body = parseJobPostBody(req);
    if (!body) {
      return safeErrorResponse(res, 400, 'INVALID_JSON', 'Invalid JSON body');
    }
    const action = resolveJobAction(req, body);
    if (action === 'report-bad-output') {
      try {
        return await handleReportBadOutput(req, res, userId, body);
      } catch (err) {
        console.error('[job] report-bad-output failed:', err);
        return safeErrorResponse(res, 500, 'REPORT_FAILED', 'Failed to report bad output');
      }
    }
    return safeErrorResponse(res, 400, 'UNKNOWN_ACTION', 'Unknown action');
  }

  const jobId = (req.query.id || req.query.jobId) as string | undefined;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'jobId (or id) query parameter is required',
    });
  }

  try {
    const jobResult = await query<
      JobSyncRow & { priority: number; style_id: string; input_image_url: string | null }
    >(
      `
        SELECT
          id,
          user_id,
          style_id,
          status,
          priority,
          replicate_prediction_id,
          input_image_url,
          output_image_url,
          error_message,
          created_at,
          started_at,
          completed_at
        FROM jobs
        WHERE id = $1
      `,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Job not found' });
    }

    let job = jobResult.rows[0];

    if (job.user_id && job.user_id !== userId) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    if (
      job.status === 'processing' ||
      job.status === 'pending' ||
      (job.status === 'failed' &&
        job.replicate_prediction_id &&
        !job.output_image_url &&
        job.error_message &&
        (job.error_message.includes('JOB_STUCK') ||
          job.error_message.includes('Worker interrupted')))
    ) {
      const synced = await syncJobWithReplicate(job);
      if (synced) {
        job = { ...job, ...synced };
      }
    }

    let queuePosition: number | null = null;
    let estimatedWaitTime: number | null = null;

    if (job.status === 'pending') {
      try {
        const queueResult = await query<{ count: number }>(
          `
            SELECT COUNT(*)::int AS count
            FROM jobs
            WHERE status = 'pending'
              AND (
                priority > $1
                OR (priority = $1 AND created_at < $2)
              )
          `,
          [job.priority, job.created_at]
        );
        queuePosition = queueResult.rows[0]?.count ?? 0;
        estimatedWaitTime = await getEstimatedWaitTime(queuePosition ?? 0);
      } catch (queueErr) {
        console.error('[job] Failed to compute queue position:', queueErr);
        queuePosition = null;
        estimatedWaitTime = null;
      }
    }

    const userMessage = humanizeJobError(job.error_message);
    const contentPolicyBlocked =
      job.status === 'failed' && isContentPolicyError(job.error_message);
    const contentPolicySource = contentPolicyBlocked
      ? getContentPolicySource(job.error_message)
      : null;

    let infringementCount: number | null = null;
    if (contentPolicyBlocked) {
      try {
        const infResult = await query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM infringements WHERE user_id = $1`,
          [userId]
        );
        infringementCount = infResult.rows[0]?.count ?? 0;
      } catch (infErr) {
        console.error('[job] Failed to fetch infringement count:', infErr);
      }
    }

    const recoverable =
      job.status === 'processing' ||
      job.status === 'pending' ||
      (job.status === 'failed' &&
        Boolean(
          job.error_message &&
            (job.error_message.includes('JOB_STUCK') ||
              job.error_message.includes('Worker interrupted'))
        ));

    return res.status(200).json({
      ok: true,
      job: {
        id: job.id,
        styleId: job.style_id,
        status: job.status,
        priority: job.priority,
        inputImageUrl: job.input_image_url,
        outputImageUrl: job.output_image_url,
        errorMessage: job.error_message,
        userMessage,
        contentPolicyBlocked,
        contentPolicySource,
        infringementCount,
        recoverable,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        queuePosition,
        estimatedWaitTime,
      },
    });
  } catch (err: unknown) {
    console.error('[job] Failed to fetch job status:', err);
    return safeErrorResponse(res, 500, 'JOB_FETCH_FAILED', 'Failed to fetch job status');
  }
}
