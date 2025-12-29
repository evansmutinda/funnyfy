// Admin endpoint to view queue statistics
// GET /api/admin/queue-stats

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from '../utils/middleware';
import { requireAdminAuth } from '../utils/admin-auth';
import { safeErrorResponse } from '../utils/security';
import { getQueueStats } from '../utils/queue-stats';
import { getTodaySpending, getSpendingStats } from '../utils/cost-protection';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  // Require admin authentication
  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  try {
    const queueStats = await getQueueStats();
    const todaySpending = await getTodaySpending();
    const spendingStats = await getSpendingStats(7); // Last 7 days

    return res.status(200).json({
      ok: true,
      queue: queueStats,
      spending: {
        today: todaySpending,
        last7Days: spendingStats,
      },
    });
  } catch (err: any) {
    console.error('[admin/queue-stats] Failed to get queue stats:', err);
    return safeErrorResponse(
      res,
      500,
      'FAILED_TO_GET_STATS',
      'Failed to retrieve queue statistics'
    );
  }
}

