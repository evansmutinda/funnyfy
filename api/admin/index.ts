// Admin: Consolidated endpoint (routes by ?resource=)
// All admin operations go through this single function to stay within
// the Hobby plan's serverless function limit.
//
//   GET  /api/admin?resource=login    (POST actually)
//   POST /api/admin?resource=login          { userId }
//   GET  /api/admin?resource=stats
//   GET  /api/admin?resource=queue-stats
//   GET  /api/admin?resource=security-logs
//   GET  /api/admin?resource=users
//   POST /api/admin?resource=users&action=ban|unban|quota|tier
//   GET  /api/admin?resource=jobs
//   POST /api/admin?resource=jobs&action=retry|cancel

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query } from '../_utils/db';
import { applyMiddleware } from '../_utils/middleware';
import { safeErrorResponse, verifyJWT } from '../_utils/security';
import { getQueueStats } from '../_utils/queue-stats';
import { getTodaySpending, getSpendingStats, shouldPauseQueue } from '../_utils/cost-protection';
import { getRecentSecurityEvents } from '../_utils/security-logging';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

function requireAdminAuth(req: VercelRequest): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
  return decoded?.userId ?? null;
}

function currentMonthDate(): string {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'POST', 'OPTIONS'])) return;

  const resource = (req.query.resource as string) || '';

  // ── LOGIN (no auth required) ───────────────────────────────────────────────
  if (resource === 'login') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userId } = body as { userId?: string };

    if (!userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID', 'User ID is required');
    if (!JWT_SECRET) return safeErrorResponse(res, 500, 'AUTH_CONFIG_ERROR', 'Authentication not configured');

    try {
      let finalUserId = userId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (ADMIN_USER_IDS.length === 0) {
        if (!uuidRegex.test(userId)) {
          return safeErrorResponse(res, 400, 'INVALID_USER_ID', 'User ID must be a valid UUID format');
        }
      } else {
        const userResult = await query<{ id: string }>(
          `SELECT id FROM users WHERE id = $1 OR revenuecat_user_id = $1 LIMIT 1`,
          [userId]
        );
        if (userResult.rows.length === 0) {
          return safeErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid user ID');
        }
        finalUserId = userResult.rows[0].id;
        const isAdmin = ADMIN_USER_IDS.includes(userId) || ADMIN_USER_IDS.includes(finalUserId);
        if (!isAdmin) {
          return safeErrorResponse(res, 403, 'ACCESS_DENIED', 'Admin access required.');
        }
      }

      const token = jwt.sign(
        { userId: finalUserId, sub: finalUserId, role: 'admin', iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({ ok: true, token, userId: finalUserId, role: 'admin', expiresIn: '7d' });
    } catch (err: any) {
      console.error('[admin/login]', err);
      return safeErrorResponse(res, 500, 'LOGIN_FAILED', 'Failed to process login');
    }
  }

  // ── All other resources require admin auth ─────────────────────────────────
  const adminId = requireAdminAuth(req);
  if (!adminId) return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Admin authentication required');

  try {
    // ── STATS ────────────────────────────────────────────────────────────────
    if (resource === 'stats') {
      const cm = currentMonthDate();
      const [userTotals, newToday, newWeek, tierBreakdown, usageByTier, mrr, totalJobs, jobsToday, banned, infringements] =
        await Promise.all([
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users`),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users WHERE DATE(created_at) = CURRENT_DATE`),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
          query<any>(`SELECT subscription_tier, subscription_status, COUNT(*)::int AS count FROM users GROUP BY subscription_tier, subscription_status ORDER BY count DESC`),
          query<any>(`SELECT u.subscription_tier, SUM(ut.count)::int AS total_usage, ROUND(AVG(ut.count),1) AS avg_usage FROM users u JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1 GROUP BY u.subscription_tier`, [cm]),
          query<{ mrr: number }>(`SELECT COALESCE(SUM(CASE subscription_tier WHEN 'starter' THEN 4.99 WHEN 'popular' THEN 9.99 WHEN 'pro' THEN 24.99 ELSE 0 END),0)::numeric AS mrr FROM users WHERE subscription_status = 'active'`),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM jobs`),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM jobs WHERE DATE(created_at) = CURRENT_DATE`),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users WHERE banned_at IS NOT NULL`),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM infringements`),
        ]);

      const jobsTrend = await query<any>(
        `SELECT DATE(created_at) AS date,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
         FROM jobs WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at) ORDER BY date ASC`
      );

      return res.status(200).json({
        ok: true,
        users: {
          total: userTotals.rows[0]?.count ?? 0,
          newToday: newToday.rows[0]?.count ?? 0,
          newThisWeek: newWeek.rows[0]?.count ?? 0,
          banned: banned.rows[0]?.count ?? 0,
          byTier: tierBreakdown.rows,
        },
        revenue: { mrrEstimateUsd: Number(mrr.rows[0]?.mrr ?? 0).toFixed(2) },
        usage: { thisMonth: usageByTier.rows },
        jobs: { total: totalJobs.rows[0]?.count ?? 0, today: jobsToday.rows[0]?.count ?? 0, last7Days: jobsTrend.rows },
        moderation: { totalInfringements: infringements.rows[0]?.count ?? 0 },
      });
    }

    // ── QUEUE STATS ────────────────────────────────────────────────────────────
    if (resource === 'queue-stats') {
      const [queueStats, todaySpend, spending7d, pauseCheck] = await Promise.all([
        getQueueStats(), getTodaySpending(), getSpendingStats(7), shouldPauseQueue(),
      ]);
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
          costUsd: todaySpend.totalCost,
          costCap: pauseCheck.cap,
          costPercent: pauseCheck.cap > 0 ? Math.round((todaySpend.totalCost / pauseCheck.cap) * 100) : 0,
        },
        spending7d: spending7d.daily,
      });
    }

    // ── SECURITY LOGS ──────────────────────────────────────────────────────────
    if (resource === 'security-logs') {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const eventType = req.query.eventType as string | undefined;
      const sp = req.query.success;
      const success = sp === 'true' ? true : sp === 'false' ? false : undefined;
      const userId = req.query.userId as string | undefined;
      const events = await getRecentSecurityEvents(limit, eventType, success, userId);
      return res.status(200).json({ ok: true, count: events.length, events });
    }

    // ── USERS ──────────────────────────────────────────────────────────────────
    if (resource === 'users') {
      if (req.method === 'POST') {
        const action = req.query.action as string;
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

        if (action === 'ban') {
          if (!body.userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
          await query(`UPDATE users SET banned_at = NOW(), updated_at = NOW() WHERE id = $1`, [body.userId]);
          return res.status(200).json({ ok: true, message: 'User banned' });
        }
        if (action === 'unban') {
          if (!body.userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
          await query(`UPDATE users SET banned_at = NULL, updated_at = NOW() WHERE id = $1`, [body.userId]);
          return res.status(200).json({ ok: true, message: 'User unbanned' });
        }
        if (action === 'quota') {
          if (!body.userId || body.adjustment === undefined) return safeErrorResponse(res, 400, 'MISSING_PARAMS');
          const cm = currentMonthDate();
          await query(
            `INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
             VALUES ($1, $2, GREATEST(0, $3::int), NOW())
             ON CONFLICT (user_id, month)
             DO UPDATE SET count = GREATEST(0, usage_tracking.count + $3::int), last_reset_at = NOW()`,
            [body.userId, cm, body.adjustment]
          );
          return res.status(200).json({ ok: true, message: 'Quota adjusted' });
        }
        if (action === 'tier') {
          if (!body.userId || !body.tier) return safeErrorResponse(res, 400, 'MISSING_PARAMS');
          await query(`UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2`, [body.tier, body.userId]);
          await query(`UPDATE subscriptions SET tier = $1, updated_at = NOW() WHERE user_id = $2 AND status = 'active'`, [body.tier, body.userId]);
          return res.status(200).json({ ok: true, message: 'Tier updated' });
        }
        return safeErrorResponse(res, 400, 'UNKNOWN_ACTION', `Unknown action: ${action}`);
      }

      // GET single user
      if (req.query.id) {
        const userId = req.query.id as string;
        const cm = currentMonthDate();
        const userResult = await query<any>(
          `SELECT u.id, u.email, u.revenuecat_user_id, u.subscription_tier, u.subscription_status,
                  u.trial_generations_used, u.banned_at, u.created_at, u.updated_at,
                  COALESCE(ut.count, 0) AS usage_this_month
           FROM users u LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $2
           WHERE u.id = $1`,
          [userId, cm]
        );
        if (userResult.rows.length === 0) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
        const [jobsResult, subResult, infResult] = await Promise.all([
          query<any>(`SELECT id, style_id, status, priority, created_at, completed_at, error_message FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
          query<any>(`SELECT tier, status, platform, current_period_start, current_period_end, cancel_at_period_end, pending_tier FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`, [userId]),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM infringements WHERE user_id = $1`, [userId]),
        ]);
        return res.status(200).json({
          ok: true,
          user: userResult.rows[0],
          subscription: subResult.rows[0] || null,
          recentJobs: jobsResult.rows,
          infringements: infResult.rows[0]?.count ?? 0,
        });
      }

      // GET user list
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const search = (req.query.search as string || '').trim();
      const tier = req.query.tier as string | undefined;
      const status = req.query.status as string | undefined;
      const cm = currentMonthDate();

      const conditions: string[] = [];
      const params: any[] = [cm];
      let p = 2;
      if (search) { conditions.push(`(u.id::text ILIKE $${p} OR u.email ILIKE $${p} OR u.revenuecat_user_id ILIKE $${p})`); params.push(`%${search}%`); p++; }
      if (tier) { conditions.push(`u.subscription_tier = $${p}`); params.push(tier); p++; }
      if (status) { conditions.push(`u.subscription_status = $${p}`); params.push(status); p++; }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const [usersResult, countResult] = await Promise.all([
        query<any>(
          `SELECT u.id, u.email, u.revenuecat_user_id, u.subscription_tier, u.subscription_status,
                  u.trial_generations_used, u.banned_at, u.created_at, COALESCE(ut.count, 0) AS usage_this_month
           FROM users u LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1
           ${where} ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
          params
        ),
        query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users u ${where}`, params),
      ]);

      return res.status(200).json({
        ok: true,
        users: usersResult.rows,
        total: countResult.rows[0]?.count ?? 0,
        page, limit,
        pages: Math.ceil((countResult.rows[0]?.count ?? 0) / limit),
      });
    }

    // ── JOBS ───────────────────────────────────────────────────────────────────
    if (resource === 'jobs') {
      if (req.method === 'POST') {
        const action = req.query.action as string;
        const jobId = req.query.jobId as string;
        if (!jobId) return safeErrorResponse(res, 400, 'MISSING_JOB_ID');
        if (action === 'retry') {
          await query(`UPDATE jobs SET status = 'pending', error_message = NULL, started_at = NULL, completed_at = NULL WHERE id = $1 AND status = 'failed'`, [jobId]);
          return res.status(200).json({ ok: true, message: 'Job requeued' });
        }
        if (action === 'cancel') {
          await query(`UPDATE jobs SET status = 'failed', error_message = 'Cancelled by admin', completed_at = NOW() WHERE id = $1 AND status IN ('pending','processing')`, [jobId]);
          return res.status(200).json({ ok: true, message: 'Job cancelled' });
        }
        return safeErrorResponse(res, 400, 'UNKNOWN_ACTION');
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status as string | undefined;
      const userId = req.query.userId as string | undefined;

      const conditions: string[] = [];
      const params: any[] = [];
      let p = 1;
      if (status) { conditions.push(`j.status = $${p}`); params.push(status); p++; }
      if (userId) { conditions.push(`j.user_id = $${p}`); params.push(userId); p++; }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const [jobsResult, countResult] = await Promise.all([
        query<any>(
          `SELECT j.id, j.user_id, j.style_id, j.status, j.priority, j.output_image_url,
                  j.error_message, j.created_at, j.completed_at, u.subscription_tier
           FROM jobs j LEFT JOIN users u ON u.id = j.user_id
           ${where} ORDER BY j.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
          params
        ),
        query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM jobs j ${where}`, params),
      ]);

      return res.status(200).json({
        ok: true,
        jobs: jobsResult.rows,
        total: countResult.rows[0]?.count ?? 0,
        page, limit,
        pages: Math.ceil((countResult.rows[0]?.count ?? 0) / limit),
      });
    }

    return safeErrorResponse(res, 400, 'UNKNOWN_RESOURCE', `Unknown resource: ${resource}`);
  } catch (err: any) {
    console.error('[admin]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
