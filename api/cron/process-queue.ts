// Queue worker: Processes pending jobs from the queue.
// Scheduled externally by cron-job.org (https://cron-job.org/) — it sends
// `Authorization: Bearer <CRON_SECRET>` on every tick. Also kicked
// fire-and-forget from /api/enqueue and from the mobile app right after a
// successful enqueue so the user doesn't wait for the next cron tick.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_utils/db';
import { processJob, type JobRow } from '../_utils/process-job';
import { checkDailySpendingCap, shouldPauseQueue, recordJobCost, getEstimatedCost } from '../_utils/cost-protection';
import { getStyleById } from '../_utils/styles-config';
import { verifyJWT } from '../_utils/security';
import { creditUsageForJob } from '../_utils/usage';
import { recoverStaleProcessingJobs } from '../_utils/replicate-sync';

const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS || 10);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Authorize the caller. Two accepted credentials:
  //   1. The cron secret (sent by cron-job.org): Authorization: Bearer <CRON_SECRET>
  //   2. A valid user JWT (used by the mobile app to kick the queue right after enqueue,
  //      so generation doesn't wait for the next scheduled tick).
  // The user-JWT path means we never have to embed CRON_SECRET in the mobile app.
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers['authorization'];
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    let isUser = false;
    if (!isCron && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      isUser = !!verifyJWT(token);
    }
    if (!isCron && !isUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }

  try {
    // Finish jobs whose worker timed out but Replicate completed (predictions expire ~1h)
    try {
      const recovered = await recoverStaleProcessingJobs(2);
      if (recovered > 0) {
        console.log(`[process-queue] Recovered ${recovered} stale job(s) from Replicate`);
      }
    } catch (recoverErr) {
      console.warn('[process-queue] Stale job recovery failed:', recoverErr);
    }

    // Check if queue should be paused due to cost protection
    const pauseCheck = await shouldPauseQueue();
    if (pauseCheck.paused) {
      console.warn('[process-queue] Queue paused due to cost protection:', pauseCheck.reason);
      return res.status(200).json({
        ok: true,
        message: 'Queue paused - daily spending cap reached',
        paused: true,
        reason: pauseCheck.reason,
        currentSpending: pauseCheck.currentSpending,
        cap: pauseCheck.cap,
      });
    }

    // Check how many jobs are currently processing
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
        maxConcurrent: MAX_CONCURRENT_JOBS
      });
    }

    // Atomically claim one pending job (prevents duplicate processing / double usage credit)
    const jobResult = await query<JobRow & { style_id: string }>(
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
        message: 'No jobs in queue'
      });
    }

    const job = jobResult.rows[0];

    // Check cost before processing (estimate based on style)
    const styleConfig = getStyleById(job.style_id);
    const estimatedCost = styleConfig ? getEstimatedCost(styleConfig.model) : 0.004;
    const costCheck = await checkDailySpendingCap(estimatedCost);

    if (!costCheck.allowed) {
      // Don't process if it would exceed daily cap
      console.warn(`[process-queue] Skipping job ${job.id} - would exceed daily spending cap`);
      return res.status(200).json({
        ok: true,
        message: 'Job skipped - daily spending cap would be exceeded',
        currentSpending: costCheck.currentSpending,
        cap: costCheck.cap,
        estimatedCost,
      });
    }

    // Mark job as processing — already done by atomic claim above

    // Process the job (this may take a while)
    try {
      await processJob(job);

      // Record cost after successful completion
      if (styleConfig) {
        await recordJobCost(job.id, styleConfig.model);
      }

      // Update usage tracking after successful completion (once per job)
      if (job.user_id) {
        await creditUsageForJob(job.id, job.user_id);
      }

      return res.status(200).json({
        ok: true,
        message: 'Job processed successfully',
        jobId: job.id
      });
    } catch (processErr: any) {
      const errorMessage = String(processErr?.message || processErr);
      console.error(`[process-queue] Job ${job.id} failed:`, errorMessage);

      // Worker timeout while Replicate still running — leave as processing for sync/recovery
      if (errorMessage.includes('JOB_STUCK') || errorMessage.includes('Worker interrupted')) {
        return res.status(200).json({
          ok: true,
          message: 'Job still processing on Replicate',
          jobId: job.id,
          recoverable: true,
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
