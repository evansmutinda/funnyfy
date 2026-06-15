// Vercel Cron Job: Processes pending jobs from the queue
// Configure in vercel.json to run every 10 seconds

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_utils/db';
import { processJob, type JobRow } from '../_utils/process-job';
import { checkDailySpendingCap, shouldPauseQueue, recordJobCost, getEstimatedCost } from '../_utils/cost-protection';
import { getStyleById } from '../_utils/styles-config';
import { verifyJWT } from '../_utils/security';

const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS || 10);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Authorize the caller. Two accepted credentials:
  //   1. The cron secret (used by cron-job.org / Vercel cron): Authorization: Bearer <CRON_SECRET>
  //   2. A valid user JWT (used by the mobile app to kick the queue right after enqueue,
  //      so generation doesn't wait for the next scheduled cron tick).
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

    // Get next pending job (priority-based, oldest first)
    // FOR UPDATE SKIP LOCKED requires a transaction
    const jobResult = await query<JobRow & { style_id: string }>(
      `
        SELECT id, user_id, style_id, input_image_url
        FROM jobs
        WHERE status = 'pending'
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
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

    // Mark job as processing
    await query(
      `
        UPDATE jobs
        SET status = 'processing',
            started_at = NOW()
        WHERE id = $1
      `,
      [job.id]
    );

    // Process the job (this may take a while)
    try {
      await processJob(job);

      // Record cost after successful completion
      if (styleConfig) {
        await recordJobCost(job.id, styleConfig.model);
      }

      // Update usage tracking after successful completion
      const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      
      // Check if user is in trial or subscribed
      if (job.user_id) {
        const userResult = await query<{ subscription_status: string; trial_generations_used: number }>(
          `
            SELECT subscription_status, trial_generations_used
            FROM users
            WHERE id = $1
          `,
          [job.user_id]
        );

        if (userResult.rows.length > 0) {
          const subscriptionStatus = userResult.rows[0].subscription_status;
          const trialGenerationsUsed = userResult.rows[0].trial_generations_used ?? 0;
          const TRIAL_LIMIT = 3;
          const isTrialUser = subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);

          if (isTrialUser) {
            // Increment trial usage
            await query(
              `
                UPDATE users
                SET trial_generations_used = trial_generations_used + 1
                WHERE id = $1
              `,
              [job.user_id]
            );
          } else {
            // Increment monthly usage
            await query(
              `
                INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
                VALUES ($1, $2, 1, NOW())
                ON CONFLICT (user_id, month)
                DO UPDATE SET count = usage_tracking.count + 1
              `,
              [job.user_id, currentMonth]
            );
          }
        }
      }

      return res.status(200).json({
        ok: true,
        message: 'Job processed successfully',
        jobId: job.id
      });
    } catch (processErr: any) {
      // Job processing failed - mark as failed if not already marked
      const errorMessage = String(processErr?.message || processErr);
      console.error(`[process-queue] Job ${job.id} failed:`, errorMessage);

      // Update job status to failed if not already updated by processJob
      try {
        await query(
          `
            UPDATE jobs
            SET status = 'failed',
                error_message = $1,
                completed_at = NOW()
            WHERE id = $2 AND status = 'processing'
          `,
          [errorMessage.slice(0, 1000), job.id] // Limit error message length
        );
      } catch (updateErr) {
        console.error(`[process-queue] Failed to update job ${job.id} status:`, updateErr);
      }

      return res.status(200).json({
        ok: true,
        message: 'Job failed',
        jobId: job.id,
        error: errorMessage
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
