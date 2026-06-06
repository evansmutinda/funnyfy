// Admin: Stats overview (users, revenue, usage by tier)
// GET /api/admin/stats

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import { applyMiddleware } from '../utils/middleware';
import { safeErrorResponse, verifyJWT } from '../utils/security';

function requireAdminAuth(req: VercelRequest): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
  return decoded?.userId ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  const adminId = requireAdminAuth(req);
  if (!adminId) return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Admin authentication required');

  try {
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [
      userTotals,
      newToday,
      newThisWeek,
      tierBreakdown,
      usageByTier,
      mrrEstimate,
      totalJobs,
      jobsToday,
      bannedCount,
      infringementCount,
    ] = await Promise.all([
      // Total users
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users`),
      // New today
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users WHERE DATE(created_at) = CURRENT_DATE`),
      // New this week
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
      // Breakdown by tier + status
      query<{ subscription_tier: string; subscription_status: string; count: number }>(
        `SELECT subscription_tier, subscription_status, COUNT(*)::int AS count
         FROM users GROUP BY subscription_tier, subscription_status ORDER BY count DESC`
      ),
      // Usage this month by tier
      query<{ subscription_tier: string; total_usage: number; avg_usage: number }>(
        `SELECT u.subscription_tier,
                SUM(ut.count)::int AS total_usage,
                ROUND(AVG(ut.count), 1) AS avg_usage
         FROM users u
         JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1
         GROUP BY u.subscription_tier`,
        [currentMonth]
      ),
      // MRR estimate (active subscriptions × price per tier)
      query<{ mrr: number }>(
        `SELECT COALESCE(SUM(
           CASE subscription_tier
             WHEN 'starter' THEN 4.99
             WHEN 'popular' THEN 9.99
             WHEN 'pro'     THEN 24.99
             ELSE 0
           END
         ), 0)::numeric AS mrr
         FROM users WHERE subscription_status = 'active'`
      ),
      // All-time jobs
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM jobs`),
      // Jobs today
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM jobs WHERE DATE(created_at) = CURRENT_DATE`),
      // Banned users
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users WHERE banned_at IS NOT NULL`),
      // Total infringements
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM infringements`),
    ]);

    // Jobs by status (last 7 days)
    const jobsTrend = await query<{ date: string; completed: number; failed: number }>(
      `SELECT DATE(created_at) AS date,
              COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
       FROM jobs
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    return res.status(200).json({
      ok: true,
      users: {
        total: userTotals.rows[0]?.count ?? 0,
        newToday: newToday.rows[0]?.count ?? 0,
        newThisWeek: newThisWeek.rows[0]?.count ?? 0,
        banned: bannedCount.rows[0]?.count ?? 0,
        byTier: tierBreakdown.rows,
      },
      revenue: {
        mrrEstimateUsd: Number(mrrEstimate.rows[0]?.mrr ?? 0).toFixed(2),
      },
      usage: {
        thisMonth: usageByTier.rows,
      },
      jobs: {
        total: totalJobs.rows[0]?.count ?? 0,
        today: jobsToday.rows[0]?.count ?? 0,
        last7Days: jobsTrend.rows,
      },
      moderation: {
        totalInfringements: infringementCount.rows[0]?.count ?? 0,
      },
    });
  } catch (err: any) {
    console.error('[admin/stats]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
