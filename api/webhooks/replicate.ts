/**
 * Replicate prediction webhook.
 * Saves successful output URLs as soon as Replicate finishes — even if our
 * queue worker timed out while polling.
 *
 * Registered per prediction via webhook + webhook_events_filter: ["completed"].
 * Auth: shared secret in ?token= (REPLICATE_WEBHOOK_SECRET).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { query } from '../_utils/db';
import {
  applyReplicatePredictionToJob,
  type JobSyncRow,
} from '../_utils/replicate-sync';
import { setSecurityHeaders, safeErrorResponse } from '../_utils/security';

const REPLICATE_WEBHOOK_SECRET = (process.env.REPLICATE_WEBHOOK_SECRET || '').trim();

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyWebhookToken(token: unknown): boolean {
  if (!REPLICATE_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[replicate-webhook] REPLICATE_WEBHOOK_SECRET not set — allowing in development');
      return true;
    }
    return false;
  }
  if (typeof token !== 'string' || !token) return false;
  return safeEquals(token.trim(), REPLICATE_WEBHOOK_SECRET);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'replicate-webhook' });
  }

  if (req.method !== 'POST') {
    return safeErrorResponse(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST allowed');
  }

  if (!verifyWebhookToken(req.query.token)) {
    return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Invalid webhook token');
  }

  let body: Record<string, unknown> = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return safeErrorResponse(res, 400, 'INVALID_JSON', 'Invalid JSON body');
  }

  const predictionId = typeof body.id === 'string' ? body.id : null;
  const status = String(body.status || '');
  const jobIdHint =
    typeof req.query.jobId === 'string' && req.query.jobId.trim()
      ? req.query.jobId.trim()
      : null;

  if (!predictionId && !jobIdHint) {
    return safeErrorResponse(res, 400, 'MISSING_PREDICTION_ID', 'Prediction id is required');
  }

  console.log('[replicate-webhook] Received', { predictionId, status, jobIdHint });

  try {
    let job: (JobSyncRow & { style_id: string }) | null = null;

    if (jobIdHint) {
      const byId = await query<JobSyncRow & { style_id: string }>(
        `SELECT id, user_id, style_id, status, replicate_prediction_id, output_image_url,
                error_message, started_at, completed_at, created_at
         FROM jobs WHERE id = $1`,
        [jobIdHint]
      );
      job = byId.rows[0] ?? null;
    }

    if (!job && predictionId) {
      const byPrediction = await query<JobSyncRow & { style_id: string }>(
        `SELECT id, user_id, style_id, status, replicate_prediction_id, output_image_url,
                error_message, started_at, completed_at, created_at
         FROM jobs
         WHERE replicate_prediction_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [predictionId]
      );
      job = byPrediction.rows[0] ?? null;
    }

    if (!job) {
      // Prediction may finish before we persist the id, or belongs to another env.
      console.warn('[replicate-webhook] No job for prediction', { predictionId, jobIdHint });
      return res.status(200).json({ ok: true, ignored: true, reason: 'job_not_found' });
    }

    if (predictionId && !job.replicate_prediction_id) {
      await query(
        `UPDATE jobs SET replicate_prediction_id = $1
         WHERE id = $2 AND replicate_prediction_id IS NULL`,
        [predictionId, job.id]
      );
      job = { ...job, replicate_prediction_id: predictionId };
    }

    if (job.status === 'completed' && job.output_image_url) {
      return res.status(200).json({ ok: true, alreadyCompleted: true, jobId: job.id });
    }

    const updated = await applyReplicatePredictionToJob(job, body);
    return res.status(200).json({
      ok: true,
      jobId: job.id,
      status: updated?.status || job.status,
      hasOutput: Boolean(updated?.output_image_url),
    });
  } catch (err: unknown) {
    console.error('[replicate-webhook] Failed to apply prediction:', err);
    return safeErrorResponse(res, 500, 'WEBHOOK_FAILED', 'Failed to process webhook');
  }
}
