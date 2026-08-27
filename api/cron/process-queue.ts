import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_utils/db';
import { processJob, type JobRow } from '../_utils/process-job';
import { checkDailySpendingCap, shouldPauseQueue, getEstimatedCost } from '../_utils/cost-protection';
import { finalizeJobCost } from '../_utils/job-cost';
import { getStyleById } from '../_utils/styles-config';
import { verifyJWT } from '../_utils/security';
import { creditUsageForJob } from '../_utils/usage';
import { recoverStaleProcessingJobs } from '../_utils/replicate-sync';
import { checkQueueKickRateLimit, purgeStaleRateLimits } from '../_utils/ratelimit';
import {
  GENERATION_UNAVAILABLE_CODE,
  isReplicateBillingError,
  pauseQueueForReplicateBilling,
} from '../_utils/queue-pause';

const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS || 10);

type QueueAuth =
  | { kind: 'cron' }
  | { kind: 'user'; userId: string }
  | { kind: 'none' };

function authorizeQueue(req: VercelRequest): QueueAuth {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}`) {
      return { kind: 'cron' };
    }
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
      if (decoded?.userId) {
        return { kind: 'user', userId: decoded.userId };
      }
    }
    return { kind: 'none' };
  }

  // Local dev without CRON_SECRET — allow unauthenticated kicks (vercel dev only).
  if (process.env.NODE_ENV !== 'production') {
    return { kind: 'cron' };
  }

  return { kind: 'none' };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const auth = authorizeQueue(req);
  if (auth.kind === 'none') {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (auth.kind === 'user') {
    const kickLimit = await checkQueueKickRateLimit(auth.userId);
    if (!kickLimit.allowed) {
      return res.status(429).json({ ok: false, error: kickLimit.error || 'Rate limited' });
    }
  }

  try {
    // Maintenance tasks run on the cron tick only — not on per-user mobile kicks.
    if (auth.kind === 'cron') {
      try {
        const recovered = await recoverStaleProcessingJobs(2);
        if (recovered > 0) {
          console.log(`[process-queue] Recovered ${recovered} stale job(s) from Replicate`);
        }
      } catch (recoverErr) {
        console.warn('[process-queue] Stale job recovery failed:', recoverErr);
      }

      try {
        const purged = await purgeStaleRateLimits();
        if (purged > 0) {
          console.log(`[process-queue] Purged ${purged} stale rate_limits row(s)`);
        }
      } catch (purgeErr) {
        console.warn('[process-queue] rate_limits purge failed:', purgeErr);
      }
    }

    const pauseCheck = await shouldPauseQueue();
    if (pauseCheck.paused) {
      console.warn('[process-queue] Queue paused:', pauseCheck.reason);
      return res.status(200).json({
        ok: true,
        message:
          pauseCheck.pauseKind === 'billing'
            ? 'Queue paused - Replicate billing (operator must top up credits)'
            : 'Queue paused - daily spending cap reached',
        paused: true,
        pauseKind: pauseCheck.pauseKind || null,
        reason: pauseCheck.reason,
        currentSpending: pauseCheck.currentSpending,
        cap: pauseCheck.cap,
      });
    }

    const activeResult = await query<{ count: number }>(
      `
        SELECT COUNT(*)::int AS count
        FROM jobs
        WHERE status = 'processing'
      `
    );
    const activeCount = activeResult.rows[0]?.count ?? 0;

    if (activeCount >= MAX_CONCURRENT_JOBS) {
      return res.status(200).json({
        ok: true,
        message: 'Queue full',
        activeJobs: activeCount,
        maxConcurrent: MAX_CONCURRENT_JOBS,
      });
    }

    const scopedUserId = auth.kind === 'user' ? auth.userId : null;

    const jobResult = scopedUserId
      ? await query<JobRow & { style_id: string }>(
          `
            WITH next_job AS (
              SELECT id
              FROM jobs
              WHERE status = 'pending'
                AND user_id = $1::uuid
              ORDER BY priority DESC, created_at ASC
              LIMIT 1
              FOR UPDATE SKIP LOCKED
            )
            UPDATE jobs j
            SET status = 'processing',
                started_at = NOW()
            FROM next_job
            WHERE j.id = next_job.id
            RETURNING j.id, j.user_id, j.style_id, j.input_image_url
          `,
          [scopedUserId]
        )
      : await query<JobRow & { style_id: string }>(
          `
            WITH next_job AS (
              SELECT id
              FROM jobs
              WHERE status = 'pending'
              ORDER BY priority DESC, created_at ASC
              LIMIT 1
              FOR UPDATE SKIP LOCKED
            )
            UPDATE jobs j
            SET status = 'processing',
                started_at = NOW()
            FROM next_job
            WHERE j.id = next_job.id
            RETURNING j.id, j.user_id, j.style_id, j.input_image_url
          `
        );

    if (jobResult.rows.length === 0) {
      return res.status(200).json({
        ok: true,
        message: scopedUserId ? 'No pending jobs for this user' : 'No jobs in queue',
      });
    }

    const job = jobResult.rows[0];

    const styleConfig = getStyleById(job.style_id);
    const estimatedCost = styleConfig ? getEstimatedCost(styleConfig.model) : 0.004;
    const costCheck = await checkDailySpendingCap(estimatedCost);

    if (!costCheck.allowed) {
      console.warn(`[process-queue] Skipping job ${job.id} - would exceed daily spending cap`);
      return res.status(200).json({
        ok: true,
        message: 'Job skipped - daily spending cap would be exceeded',
        currentSpending: costCheck.currentSpending,
        cap: costCheck.cap,
        estimatedCost,
      });
    }

    try {
      await processJob(job);

      await finalizeJobCost(job.id, job.style_id, 'completed');

      if (job.user_id) {
        await creditUsageForJob(job.id, job.user_id);
      }

      return res.status(200).json({
        ok: true,
        message: 'Job processed successfully',
        jobId: job.id,
      });
    } catch (processErr: any) {
      const errorMessage = String(processErr?.message || processErr);
      console.error(`[process-queue] Job ${job.id} failed:`, errorMessage);

      if (errorMessage.includes('JOB_STUCK') || errorMessage.includes('Worker interrupted')) {
        return res.status(200).json({
          ok: true,
          message: 'Job still processing on Replicate',
          jobId: job.id,
          recoverable: true,
        });
      }

      if (
        errorMessage.includes(GENERATION_UNAVAILABLE_CODE) ||
        errorMessage.includes('BLANK_OR_UNLOADABLE_OUTPUT') ||
        isReplicateBillingError(errorMessage)
      ) {
        if (
          !errorMessage.includes(GENERATION_UNAVAILABLE_CODE) &&
          !errorMessage.includes('BLANK_OR_UNLOADABLE_OUTPUT') &&
          isReplicateBillingError(errorMessage)
        ) {
          await pauseQueueForReplicateBilling(errorMessage, 'process_queue');
        }
        return res.status(200).json({
          ok: true,
          message: errorMessage.includes('BLANK_OR_UNLOADABLE_OUTPUT')
            ? 'Job failed — blank or unloadable output'
            : 'Job failed — queue paused for Replicate billing',
          jobId: job.id,
          error: errorMessage.includes('BLANK_OR_UNLOADABLE_OUTPUT')
            ? 'BLANK_OR_UNLOADABLE_OUTPUT'
            : GENERATION_UNAVAILABLE_CODE,
          paused: !errorMessage.includes('BLANK_OR_UNLOADABLE_OUTPUT'),
        });
      }

      try {
        await query(
          `
            UPDATE jobs
            SET status = 'failed',
                error_message = $1,
                completed_at = NOW()
            WHERE id = $2 AND status = 'processing'
          `,
          [errorMessage.slice(0, 1000), job.id]
        );
        await finalizeJobCost(job.id, job.style_id, 'failed');
      } catch (updateErr) {
        console.error(`[process-queue] Failed to update job ${job.id} status:`, updateErr);
      }

      return res.status(200).json({
        ok: true,
        message: 'Job failed',
        jobId: job.id,
        error: errorMessage,
      });
    }
  } catch (err: any) {
    console.error('[process-queue] Error:', err);
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err),
      detail: err?.stack?.split('\n')[0] || null,
    });
  }
}
