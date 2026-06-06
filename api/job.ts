import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';
import { applyMiddleware } from './utils/middleware';
import { safeErrorResponse } from './utils/security';
import { getEstimatedWaitTime } from './utils/queue-stats';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const jobId = (req.query.id || req.query.jobId) as string | undefined;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'jobId (or id) query parameter is required'
    });
  }

  try {
    // Fetch job details
    const jobResult = await query<{
      id: string;
      style_id: string;
      status: string;
      priority: number;
      input_image_url: string | null;
      output_image_url: string | null;
      error_message: string | null;
      created_at: string;
      started_at: string | null;
      completed_at: string | null;
    }>(
      `
        SELECT
          id,
          style_id,
          status,
          priority,
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

    const job = jobResult.rows[0];

    // Calculate queue position and estimated wait time
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

        // Use improved wait time estimation based on historical data
        estimatedWaitTime = await getEstimatedWaitTime(queuePosition ?? 0);
      } catch (queueErr) {
        console.error('[job] Failed to compute queue position:', queueErr);
        queuePosition = null;
        estimatedWaitTime = null;
      }
    }

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
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        queuePosition,
        estimatedWaitTime
      }
    });
  } catch (err: any) {
    console.error('[job] Failed to fetch job status:', err);
    return safeErrorResponse(res, 500, 'JOB_FETCH_FAILED', 'Failed to fetch job status');
  }
}

