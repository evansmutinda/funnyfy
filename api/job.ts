import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';
import { applyMiddleware } from './_utils/middleware';
import { requireAuth } from './_utils/auth';
import { safeErrorResponse } from './_utils/security';
import { getEstimatedWaitTime } from './_utils/queue-stats';
import { humanizeJobError } from './_utils/job-messages';
import { syncJobWithReplicate, type JobSyncRow } from './_utils/replicate-sync';
import { getContentPolicySource, isContentPolicyError } from './_utils/sightengine-moderation';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const userId = requireAuth(req, res);
  if (!userId) return;

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
