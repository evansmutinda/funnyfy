// Admin: Queue stats + cost overview
// GET /api/admin/queue-stats

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import { applyMiddleware } from '../utils/middleware';
import { safeErrorResponse, verifyJWT } from '../utils/security';
import { getQueueStats } from '../utils/queue-stats';
import { getTodaySpending, getSpendingStats, shouldPauseQueue } from '../utils/cost-protection';

function requireAdminAuth(req: VercelRequest): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyJWT(token);
  if (!decoded) return null;
  return decoded.userId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const adminId = requireAdminAuth(req);
  if (!adminId) return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Admin authentication required');

  try {
    const [queueStats, todaySpend, spending7d, pauseCheck] = await Promise.all([
      getQueueStats(),
      getTodaySpending(),
      getSpendingStats(7),
      shouldPauseQueue(),
    ]);

    // Jobs completed today
    const todayResult = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM jobs WHERE DATE(created_at) = CURRENT_DATE`
    );
    const todayJobs = todayResult.rows[0]?.count ?? 0;

    // Jobs failed today
    const failedResult = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM jobs WHERE DATE(created_at) = CURRENT_DATE AND status = 'failed'`
    );
    const failedJobs = failedResult.rows[0]?.count ?? 0;

    return res.status(200).json({
      ok: true,
      queue: {
        pending: queueStats.pending,
        processing: queueStats.processing,
        completed: queueStats.completed,
        failed: queueStats.failed,
        byPriority: queueStats.byPriority,
        averageWaitTime: queueStats.averageWaitTime,
        oldestPendingJob: queueStats.oldestPendingJob,
        isPaused: pauseCheck.paused,
        pauseReason: pauseCheck.reason,
      },
      today: {
        jobs: todayJobs,
        failed: failedJobs,
        costUsd: todaySpend.totalCost,
        costCap: pauseCheck.cap,
        costPercent: pauseCheck.cap > 0 ? Math.round((todaySpend.totalCost / pauseCheck.cap) * 100) : 0,
      },
      spending7d: spending7d.daily,
    });
  } catch (err: any) {
    console.error('[admin/queue-stats]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
