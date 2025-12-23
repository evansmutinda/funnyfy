// Vercel Cron Job: Processes pending jobs from the queue
// Configure in vercel.json to run every 10 seconds

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import { processJob, type JobRow } from '../process-job';

const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS || 10);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Optional: Verify this is called by Vercel Cron (set CRON_SECRET env var to enable)
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }

  try {
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
    const jobResult = await query<JobRow>(
      `
        SELECT id, user_id, style_id, input_image_url
        FROM jobs
        WHERE status = 'pending'
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `
    );

    if (jobResult.rows.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'No jobs in queue'
      });
    }

    const job = jobResult.rows[0];

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
      // Job processing failed - already marked as failed in processJob
      console.error(`[process-queue] Job ${job.id} failed:`, processErr);
      return res.status(200).json({
        ok: true,
        message: 'Job failed',
        jobId: job.id,
        error: String(processErr?.message || processErr)
      });
    }
  } catch (err: any) {
    console.error('[process-queue] Error:', err);
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err)
    });
  }
}
