// Admin: User management
// GET  /api/admin/users?page=1&limit=20&search=&tier=&status=
// GET  /api/admin/users?id=<uuid>  (single user detail)
// POST /api/admin/users/ban        { userId, reason }
// POST /api/admin/users/unban      { userId }
// POST /api/admin/users/quota      { userId, adjustment }  (add/subtract quota)

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
  if (!applyMiddleware(req, res, ['GET', 'POST', 'OPTIONS'])) return;

  const adminId = requireAdminAuth(req);
  if (!adminId) return safeErrorResponse(res, 401, 'UNAUTHORIZED', 'Admin authentication required');

  // ── POST actions ─────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const action = req.query.action as string;
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    if (action === 'ban') {
      const { userId } = body;
      if (!userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
      await query(`UPDATE users SET banned_at = NOW(), updated_at = NOW() WHERE id = $1`, [userId]);
      return res.status(200).json({ ok: true, message: 'User banned' });
    }

    if (action === 'unban') {
      const { userId } = body;
      if (!userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
      await query(`UPDATE users SET banned_at = NULL, updated_at = NOW() WHERE id = $1`, [userId]);
      return res.status(200).json({ ok: true, message: 'User unbanned' });
    }

    if (action === 'quota') {
      // Manually adjust a user's monthly usage count (positive = add, negative = subtract)
      const { userId, adjustment } = body;
      if (!userId || adjustment === undefined) return safeErrorResponse(res, 400, 'MISSING_PARAMS');
      const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      await query(
        `INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
         VALUES ($1, $2, GREATEST(0, $3::int), NOW())
         ON CONFLICT (user_id, month)
         DO UPDATE SET count = GREATEST(0, usage_tracking.count + $3::int), last_reset_at = NOW()`,
        [userId, currentMonth, adjustment]
      );
      return res.status(200).json({ ok: true, message: 'Quota adjusted' });
    }

    if (action === 'tier') {
      const { userId, tier } = body;
      if (!userId || !tier) return safeErrorResponse(res, 400, 'MISSING_PARAMS');
      await query(
        `UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2`,
        [tier, userId]
      );
      await query(
        `UPDATE subscriptions SET tier = $1, updated_at = NOW() WHERE user_id = $2 AND status = 'active'`,
        [tier, userId]
      );
      return res.status(200).json({ ok: true, message: 'Tier updated' });
    }

    return safeErrorResponse(res, 400, 'UNKNOWN_ACTION', `Unknown action: ${action}`);
  }

  // ── GET single user ───────────────────────────────────────────────────────
  if (req.query.id) {
    const userId = req.query.id as string;
    try {
      const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

      const userResult = await query<any>(
        `SELECT u.id, u.email, u.revenuecat_user_id, u.subscription_tier,
                u.subscription_status, u.trial_generations_used, u.banned_at,
                u.created_at, u.updated_at,
                COALESCE(ut.count, 0) AS usage_this_month
         FROM users u
         LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $2
         WHERE u.id = $1`,
        [userId, currentMonth]
      );

      if (userResult.rows.length === 0) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
      const user = userResult.rows[0];

      // Recent jobs
      const jobsResult = await query<any>(
        `SELECT id, style_id, status, priority, created_at, completed_at, error_message
         FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [userId]
      );

      // Subscription
      const subResult = await query<any>(
        `SELECT tier, status, platform, current_period_start, current_period_end, cancel_at_period_end, pending_tier
         FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      // Infringement count
      const infResult = await query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM infringements WHERE user_id = $1`,
        [userId]
      );

      return res.status(200).json({
        ok: true,
        user,
        subscription: subResult.rows[0] || null,
        recentJobs: jobsResult.rows,
        infringements: infResult.rows[0]?.count ?? 0,
      });
    } catch (err: any) {
      return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
    }
  }

  // ── GET user list ─────────────────────────────────────────────────────────
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').trim();
    const tier = req.query.tier as string | undefined;
    const status = req.query.status as string | undefined;
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const conditions: string[] = [];
    const params: any[] = [currentMonth];
    let p = 2;

    if (search) {
      conditions.push(`(u.id::text ILIKE $${p} OR u.email ILIKE $${p} OR u.revenuecat_user_id ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }
    if (tier) { conditions.push(`u.subscription_tier = $${p}`); params.push(tier); p++; }
    if (status) { conditions.push(`u.subscription_status = $${p}`); params.push(status); p++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [usersResult, countResult] = await Promise.all([
      query<any>(
        `SELECT u.id, u.email, u.revenuecat_user_id, u.subscription_tier,
                u.subscription_status, u.trial_generations_used, u.banned_at,
                u.created_at, COALESCE(ut.count, 0) AS usage_this_month
         FROM users u
         LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1
         ${where}
         ORDER BY u.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM users u ${where}`,
        params
      ),
    ]);

    return res.status(200).json({
      ok: true,
      users: usersResult.rows,
      total: countResult.rows[0]?.count ?? 0,
      page,
      limit,
      pages: Math.ceil((countResult.rows[0]?.count ?? 0) / limit),
    });
  } catch (err: any) {
    console.error('[admin/users]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
