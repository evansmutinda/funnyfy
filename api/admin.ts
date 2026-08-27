// Admin: Consolidated endpoint (routes by ?resource=)
// All admin operations go through this single function to stay within
// the Hobby plan's serverless function limit.
//
//   GET  /api/admin?page=login|dashboard   (admin UI HTML)
//   POST /api/admin?resource=login          { userId }
//   GET  /api/admin?resource=stats
//   GET  /api/admin?resource=queue-stats
//   POST /api/admin?resource=queue-stats&action=resume  (clear Replicate billing pause)
//   GET  /api/admin?resource=security-logs
//   GET  /api/admin?resource=users
//   POST /api/admin?resource=users&action=ban|unban|quota|tier
//   GET  /api/admin?resource=finance
//   GET  /api/admin?resource=growth
//   GET  /api/admin?resource=moderation
//   GET  /api/admin?resource=exchange-rate

import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { query } from './_utils/db';
import { applyMiddleware } from './_utils/middleware';
import { safeErrorResponse, verifyJWT, getClientIp, setAdminPageSecurityHeaders } from './_utils/security';
import { getQueueStats } from './_utils/queue-stats';
import { getTodaySpending, getSpendingStats, shouldPauseQueue } from './_utils/cost-protection';
import { clearBillingPause } from './_utils/queue-pause';
import { getRecentSecurityEvents, logSecurityEvent } from './_utils/security-logging';
import { checkAdminLoginRateLimit } from './_utils/ratelimit';
import { getUsdToKesRate } from './_utils/exchange-rate';
import { getModelDisplayLabel } from './_utils/job-cost';
import { MODEL_COST_USD, getModelCost } from './_utils/cost-protection';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const ADMIN_PAGES_DIR = path.join(__dirname, '_utils', 'admin-pages');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Avoid `varchar = uuid` errors when looking up by UUID (revenuecat_user_id is text). */
async function lookupUserByLoginId(loginId: string): Promise<string | null> {
  const trimmed = loginId.trim();
  const userResult = await query<{ id: string }>(
    UUID_REGEX.test(trimmed)
      ? `SELECT id FROM users WHERE id = $1::uuid LIMIT 1`
      : `SELECT id FROM users WHERE revenuecat_user_id = $1 LIMIT 1`,
    [trimmed]
  );
  return userResult.rows[0]?.id ?? null;
}

async function safeCount(sql: string, params: any[] = []): Promise<number> {
  try {
    const result = await query<{ count: number }>(sql, params);
    return result.rows[0]?.count ?? 0;
  } catch (err) {
    console.warn('[admin] count query failed:', err);
    return 0;
  }
}

const TIER_PRICES: Record<string, number> = {
  starter: 5,
  popular: 10,
  pro: 25,
};

function tierPrice(tier: string): number {
  return TIER_PRICES[(tier || '').toLowerCase()] ?? 0;
}

const ADMIN_PAGE_FILES: Record<string, string> = {
  login: 'login-page.html',
  dashboard: 'dashboard.html',
  'login-page.js': 'login-page.js',
  'dashboard-page.js': 'dashboard-page.js',
};

function requireAdminAuth(req: VercelRequest): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
  return decoded?.userId ?? null;
}

function currentMonthDate(): string {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
}

function serveAdminPage(res: VercelResponse, page: string): boolean {
  const fileName = ADMIN_PAGE_FILES[page];
  if (!fileName) return false;
  try {
    const html = fs.readFileSync(path.join(ADMIN_PAGES_DIR, fileName), 'utf8');
    const isScript = fileName.endsWith('.js');
    if (isScript) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
    } else {
      setAdminPageSecurityHeaders(res);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    res.status(200).send(html);
    return true;
  } catch (err) {
    console.error('[admin] page serve failed:', page, err);
    safeErrorResponse(res, 500, 'PAGE_ERROR', 'Admin page not available');
    return true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyMiddleware(req, res, ['GET', 'POST', 'OPTIONS'])) return;

  const resource = (req.query.resource as string) || '';
  const page = (req.query.page as string) || '';

  if (req.method === 'GET' && page && !resource) {
    serveAdminPage(res, page);
    return;
  }

  // ── LOGIN (no auth required) ───────────────────────────────────────────────
  if (resource === 'login') {
    const loginLimit = await checkAdminLoginRateLimit(req);
    if (!loginLimit.allowed) {
      await logSecurityEvent({
        eventType: 'admin_login_rate_limited',
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        success: false,
      });
      return safeErrorResponse(res, 429, 'RATE_LIMITED', loginLimit.error);
    }

    let body: { userId?: string } = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return safeErrorResponse(res, 400, 'INVALID_JSON', 'Invalid JSON in request body');
    }
    const userId = body.userId?.trim();

    if (!userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID', 'User ID is required');
    if (!JWT_SECRET) return safeErrorResponse(res, 500, 'AUTH_CONFIG_ERROR', 'Authentication not configured');

    if (ADMIN_USER_IDS.length === 0) {
      return safeErrorResponse(
        res,
        503,
        'ADMIN_NOT_CONFIGURED',
        'Admin access is not configured. Set ADMIN_USER_IDS in Vercel and redeploy.'
      );
    }

    try {
      let finalUserId = userId;

      const dbUserId = await lookupUserByLoginId(userId);
      if (!dbUserId) {
        return safeErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid user ID');
      }
      finalUserId = dbUserId;
      const isAdmin = ADMIN_USER_IDS.includes(userId) || ADMIN_USER_IDS.includes(finalUserId);
      if (!isAdmin) {
        await logSecurityEvent({
          eventType: 'admin_login_denied',
          userId: finalUserId,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] as string,
          success: false,
        });
        return safeErrorResponse(res, 403, 'ACCESS_DENIED', 'Admin access required.');
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
          safeCount(`SELECT COUNT(*)::int AS count FROM users`),
          safeCount(`SELECT COUNT(*)::int AS count FROM users WHERE DATE(created_at) = CURRENT_DATE`),
          safeCount(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
          query<any>(`SELECT subscription_tier, subscription_status, COUNT(*)::int AS count FROM users GROUP BY subscription_tier, subscription_status ORDER BY count DESC`).catch(() => ({ rows: [] })),
          query<any>(`SELECT u.subscription_tier, SUM(ut.count)::int AS total_usage, ROUND(AVG(ut.count),1) AS avg_usage FROM users u JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1 GROUP BY u.subscription_tier`, [cm]).catch(() => ({ rows: [] })),
          query<{ mrr: number }>(`SELECT COALESCE(SUM(CASE subscription_tier WHEN 'starter' THEN 5 WHEN 'popular' THEN 10 WHEN 'pro' THEN 25 ELSE 0 END),0)::numeric AS mrr FROM users WHERE subscription_status = 'active'`).catch(() => ({ rows: [{ mrr: 0 }] })),
          safeCount(`SELECT COUNT(*)::int AS count FROM jobs`),
          safeCount(`SELECT COUNT(*)::int AS count FROM jobs WHERE DATE(created_at) = CURRENT_DATE`),
          safeCount(`SELECT COUNT(*)::int AS count FROM users WHERE banned_at IS NOT NULL`),
          safeCount(`SELECT COUNT(*)::int AS count FROM infringements`),
        ]);

      let jobsTrend = { rows: [] as any[] };
      try {
        jobsTrend = await query<any>(
          `SELECT DATE(created_at) AS date,
                  COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                  COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
           FROM jobs WHERE created_at >= NOW() - INTERVAL '7 days'
           GROUP BY DATE(created_at) ORDER BY date ASC`
        );
      } catch (err) {
        console.warn('[admin/stats] jobs trend query failed:', err);
      }

      return res.status(200).json({
        ok: true,
        users: {
          total: userTotals,
          newToday: newToday,
          newThisWeek: newWeek,
          banned: banned,
          byTier: tierBreakdown.rows,
        },
        revenue: { mrrEstimateUsd: Number(mrr.rows[0]?.mrr ?? 0).toFixed(2) },
        usage: { thisMonth: usageByTier.rows },
        jobs: { total: totalJobs, today: jobsToday, last7Days: jobsTrend.rows },
        moderation: { totalInfringements: infringements },
      });
    }

    // ── QUEUE STATS ────────────────────────────────────────────────────────────
    if (resource === 'queue-stats') {
      if (req.method === 'POST') {
        const action = req.query.action as string;
        if (action === 'resume') {
          const cleared = await clearBillingPause('admin');
          if (!cleared) {
            return safeErrorResponse(res, 500, 'RESUME_FAILED', 'Could not clear billing pause');
          }
          const pauseCheck = await shouldPauseQueue();
          return res.status(200).json({
            ok: true,
            message: pauseCheck.paused
              ? 'Billing pause cleared, but queue still paused (daily cost cap).'
              : 'Queue resumed — pending jobs will process on the next worker tick.',
            stillPaused: pauseCheck.paused,
            pauseReason: pauseCheck.reason || null,
            pauseKind: pauseCheck.pauseKind || null,
          });
        }
        return safeErrorResponse(res, 400, 'UNKNOWN_ACTION', `Unknown action: ${action}`);
      }

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
          pauseKind: pauseCheck.pauseKind || null,
          canResumeBilling: pauseCheck.pauseKind === 'billing',
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
      params.push(limit, offset);

      const [usersResult, countResult] = await Promise.all([
        query<any>(
          `SELECT u.id, u.email, u.revenuecat_user_id, u.subscription_tier, u.subscription_status,
                  u.trial_generations_used, u.banned_at, u.created_at, COALESCE(ut.count, 0) AS usage_this_month
           FROM users u LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1
           ${where} ORDER BY u.created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
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
          await query(`UPDATE jobs SET status = 'pending', error_message = NULL, started_at = NULL, completed_at = NULL, cost_usd = 0, model_version = NULL WHERE id = $1 AND status = 'failed'`, [jobId]);
          return res.status(200).json({ ok: true, message: 'Job requeued' });
        }
        if (action === 'cancel') {
          await query(`UPDATE jobs SET status = 'failed', error_message = 'Cancelled by admin', completed_at = NOW(), cost_usd = 0 WHERE id = $1 AND status IN ('pending','processing')`, [jobId]);
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
      params.push(limit, offset);

      const [jobsResult, countResult] = await Promise.all([
        query<any>(
          `SELECT j.id, j.user_id, j.style_id, j.status, j.priority, j.output_image_url,
                  j.error_message, j.created_at, j.completed_at, u.subscription_tier
           FROM jobs j LEFT JOIN users u ON u.id = j.user_id
           ${where} ORDER BY j.created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
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

    // ── FINANCE ────────────────────────────────────────────────────────────────
    if (resource === 'finance') {
      const monthStart = `date_trunc('month', CURRENT_DATE)`;
      const [
        activeByTier,
        spending30,
        spending7,
        todaySpend,
        pauseCheck,
        monthCostJobs,
        monthCostLegacy,
        genMtd,
        genByUserTier,
        genByModel,
      ] = await Promise.all([
        query<any>(
          `SELECT subscription_tier AS tier, COUNT(*)::int AS count
           FROM users WHERE subscription_status = 'active' AND subscription_tier IN ('starter','popular','pro')
           GROUP BY subscription_tier ORDER BY count DESC`
        ).catch(() => ({ rows: [] })),
        getSpendingStats(30),
        getSpendingStats(7),
        getTodaySpending(),
        shouldPauseQueue(),
        query<{ total: number }>(
          `SELECT COALESCE(SUM(cost_usd), 0)::numeric AS total FROM jobs
           WHERE status = 'completed' AND completed_at >= ${monthStart}`
        ).catch(() => ({ rows: [{ total: 0 }] })),
        query<{ total: number }>(
          `SELECT COALESCE(SUM(cost_usd), 0)::numeric AS total FROM cost_tracking
           WHERE date >= ${monthStart}::date`
        ).catch(() => ({ rows: [{ total: 0 }] })),
        query<{
          generations: number;
          completed: number;
          failed: number;
          cost_usd: number;
        }>(
          `SELECT COUNT(*)::int AS generations,
                  COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                  COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
                  COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd
           FROM jobs
           WHERE status IN ('completed', 'failed')
             AND COALESCE(completed_at, created_at) >= ${monthStart}`
        ).catch(() => ({ rows: [{ generations: 0, completed: 0, failed: 0, cost_usd: 0 }] })),
        query<{
          user_tier: string;
          generations: number;
          completed: number;
          failed: number;
          cost_usd: number;
        }>(
          `SELECT
             CASE
               WHEN u.subscription_status = 'active' AND u.subscription_tier IN ('starter','popular','pro')
                 THEN u.subscription_tier
               ELSE 'trial'
             END AS user_tier,
             COUNT(*)::int AS generations,
             COUNT(*) FILTER (WHERE j.status = 'completed')::int AS completed,
             COUNT(*) FILTER (WHERE j.status = 'failed')::int AS failed,
             COALESCE(SUM(j.cost_usd), 0)::numeric AS cost_usd
           FROM jobs j
           LEFT JOIN users u ON u.id = j.user_id
           WHERE j.status IN ('completed', 'failed')
             AND COALESCE(j.completed_at, j.created_at) >= ${monthStart}
           GROUP BY 1
           ORDER BY cost_usd DESC`
        ).catch(() => ({ rows: [] })),
        query<{
          model: string;
          completed: number;
          failed: number;
          cost_usd: number;
        }>(
          `SELECT COALESCE(j.model_version, 'unknown') AS model,
                  COUNT(*) FILTER (WHERE j.status = 'completed')::int AS completed,
                  COUNT(*) FILTER (WHERE j.status = 'failed')::int AS failed,
                  COALESCE(SUM(j.cost_usd), 0)::numeric AS cost_usd
           FROM jobs j
           WHERE j.status IN ('completed', 'failed')
             AND COALESCE(j.completed_at, j.created_at) >= ${monthStart}
           GROUP BY j.model_version
           ORDER BY cost_usd DESC`
        ).catch(() => ({ rows: [] })),
      ]);

      const revenueRows = (activeByTier.rows || []).map((row: { tier: string; count: number }) => {
        const unit = tierPrice(row.tier);
        return {
          tier: row.tier,
          count: row.count,
          unitPriceUsd: unit,
          subtotalUsd: Number((row.count * unit).toFixed(2)),
        };
      });
      const mrr = revenueRows.reduce((sum: number, r: { subtotalUsd: number }) => sum + r.subtotalUsd, 0);
      const revenueByTier = Object.fromEntries(
        revenueRows.map((r: { tier: string; subtotalUsd: number; count: number }) => [
          r.tier,
          { mrrUsd: r.subtotalUsd, activeSubs: r.count },
        ])
      );

      const jobsCostMonth = Number(monthCostJobs.rows[0]?.total ?? 0);
      const legacyCostMonth = Number(monthCostLegacy.rows[0]?.total ?? 0);
      const costMonth = jobsCostMonth > 0 ? jobsCostMonth : legacyCostMonth;

      const mtd = genMtd.rows[0] ?? { generations: 0, completed: 0, failed: 0, cost_usd: 0 };
      const tierOrder = ['trial', 'starter', 'popular', 'pro'];
      const economicsByTier = tierOrder
        .map((tier) => {
          const row = (genByUserTier.rows || []).find((r: { user_tier: string }) => r.user_tier === tier);
          const rev = tier === 'trial' ? { mrrUsd: 0, activeSubs: 0 } : revenueByTier[tier] ?? { mrrUsd: 0, activeSubs: 0 };
          const costUsd = Number(row?.cost_usd ?? 0);
          return {
            tier,
            activeSubs: rev.activeSubs,
            revenueMrrUsd: rev.mrrUsd,
            generationsMtd: row?.generations ?? 0,
            completedMtd: row?.completed ?? 0,
            failedMtd: row?.failed ?? 0,
            costMtdUsd: costUsd,
          };
        })
        .filter((row) => row.generationsMtd > 0 || row.revenueMrrUsd > 0 || row.activeSubs > 0);

      const trialRow = economicsByTier.find((r) => r.tier === 'trial');

      return res.status(200).json({
        ok: true,
        revenue: {
          mrrEstimateUsd: mrr.toFixed(2),
          activeByTier: revenueRows,
          totalActiveSubs: revenueRows.reduce((s: number, r: { count: number }) => s + r.count, 0),
        },
        generations: {
          monthToDate: {
            total: mtd.generations,
            completed: mtd.completed,
            failed: mtd.failed,
            costUsd: Number(mtd.cost_usd),
          },
          byUserTier: economicsByTier,
          byModel: (genByModel.rows || []).map((row: { model: string; completed: number; failed: number; cost_usd: number }) => ({
            model: row.model,
            label: getModelDisplayLabel(row.model === 'unknown' ? null : row.model),
            completed: row.completed,
            failed: row.failed,
            costUsd: Number(row.cost_usd),
            unitCostUsd: row.model && row.model !== 'unknown' ? getModelCost(row.model) : null,
          })),
          trial: trialRow
            ? {
                generationsMtd: trialRow.generationsMtd,
                costMtdUsd: trialRow.costMtdUsd,
              }
            : { generationsMtd: 0, costMtdUsd: 0 },
        },
        costs: {
          today: {
            costUsd: todaySpend.totalCost,
            jobs: todaySpend.jobCount,
            capUsd: pauseCheck.cap,
            capPercent: pauseCheck.cap > 0 ? Math.round((todaySpend.totalCost / pauseCheck.cap) * 100) : 0,
            queuePaused: pauseCheck.paused,
            pauseReason: pauseCheck.reason,
          },
          last7: spending7,
          last30: spending30,
          monthToDateUsd: costMonth,
        },
        margin: {
          mrrEstimateUsd: mrr,
          costMonthToDateUsd: costMonth,
          estimatedNetUsd: Number((mrr - costMonth).toFixed(2)),
        },
        meta: {
          prices: TIER_PRICES,
          modelCosts: MODEL_COST_USD,
          disclaimer:
            'MRR uses rounded tier prices ($5/$10/$25). Generation costs from jobs.cost_usd. Trial spend has $0 revenue.',
          exchange: await getUsdToKesRate(),
        },
      });
    }

    // ── GROWTH ─────────────────────────────────────────────────────────────────
    if (resource === 'growth') {
      const monthStart = `date_trunc('month', CURRENT_DATE)`;
      const [
        totalUsers,
        mauMtd,
        activePaid,
        mrrRow,
        newUsersMtd,
        churnedMtd,
        churnedLastMonth,
        newPaidMtd,
        mauByMonth,
        newUsersByMonth,
        churnByMonth,
        activeByTier,
      ] = await Promise.all([
        safeCount(`SELECT COUNT(*)::int AS count FROM users`),
        safeCount(
          `SELECT COUNT(DISTINCT user_id)::int AS count FROM (
             SELECT user_id FROM jobs
             WHERE user_id IS NOT NULL AND created_at >= ${monthStart}
             UNION
             SELECT user_id FROM usage_tracking
             WHERE month = ${monthStart}::date AND count > 0
           ) active_users`
        ),
        safeCount(
          `SELECT COUNT(*)::int AS count FROM users
           WHERE subscription_status = 'active' AND subscription_tier IN ('starter','popular','pro')`
        ),
        query<{ mrr: number }>(
          `SELECT COALESCE(SUM(CASE subscription_tier
             WHEN 'starter' THEN 5 WHEN 'popular' THEN 10 WHEN 'pro' THEN 25 ELSE 0 END), 0)::numeric AS mrr
           FROM users WHERE subscription_status = 'active' AND subscription_tier IN ('starter','popular','pro')`
        ).catch(() => ({ rows: [{ mrr: 0 }] })),
        safeCount(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= ${monthStart}`),
        safeCount(
          `SELECT COUNT(DISTINCT user_id)::int AS count FROM subscription_history
           WHERE event_type IN ('canceled', 'expired')
             AND from_status = 'active'
             AND created_at >= ${monthStart}`
        ),
        safeCount(
          `SELECT COUNT(DISTINCT user_id)::int AS count FROM subscription_history
           WHERE event_type IN ('canceled', 'expired')
             AND from_status = 'active'
             AND created_at >= ${monthStart} - INTERVAL '1 month'
             AND created_at < ${monthStart}`
        ),
        safeCount(
          `SELECT COUNT(DISTINCT user_id)::int AS count FROM subscription_history
           WHERE event_type = 'created' AND to_status = 'active'
             AND created_at >= ${monthStart}`
        ),
        query<{ month: string; mau: number }>(
          `WITH months AS (
             SELECT generate_series(
               ${monthStart} - INTERVAL '5 months',
               ${monthStart},
               INTERVAL '1 month'
             )::date AS month
           )
           SELECT m.month::text AS month,
             COALESCE((
               SELECT COUNT(DISTINCT user_id)::int FROM (
                 SELECT user_id FROM jobs
                 WHERE user_id IS NOT NULL
                   AND created_at >= m.month
                   AND created_at < m.month + INTERVAL '1 month'
                 UNION
                 SELECT user_id FROM usage_tracking
                 WHERE month = m.month AND count > 0
               ) u
             ), 0) AS mau
           FROM months m ORDER BY m.month`
        ).catch(() => ({ rows: [] })),
        query<{ month: string; new_users: number }>(
          `SELECT date_trunc('month', created_at)::date::text AS month,
                  COUNT(*)::int AS new_users
           FROM users
           WHERE created_at >= ${monthStart} - INTERVAL '5 months'
           GROUP BY 1 ORDER BY 1`
        ).catch(() => ({ rows: [] })),
        query<{ month: string; churned: number }>(
          `SELECT date_trunc('month', created_at)::date::text AS month,
                  COUNT(DISTINCT user_id)::int AS churned
           FROM subscription_history
           WHERE event_type IN ('canceled', 'expired')
             AND from_status = 'active'
             AND created_at >= ${monthStart} - INTERVAL '5 months'
           GROUP BY 1 ORDER BY 1`
        ).catch(() => ({ rows: [] })),
        query<{ tier: string; count: number }>(
          `SELECT subscription_tier AS tier, COUNT(*)::int AS count
           FROM users
           WHERE subscription_status = 'active' AND subscription_tier IN ('starter','popular','pro')
           GROUP BY subscription_tier ORDER BY count DESC`
        ).catch(() => ({ rows: [] })),
      ]);

      const mrr = Number(mrrRow.rows[0]?.mrr ?? 0);
      const arr = Number((mrr * 12).toFixed(2));
      const churnDenom = activePaid + churnedMtd;
      const churnRate =
        churnDenom > 0 ? Number(((churnedMtd / churnDenom) * 100).toFixed(2)) : 0;
      const churnDenomLast = activePaid + churnedLastMonth + churnedMtd - newPaidMtd;
      const churnRateLastMonth =
        churnDenomLast > 0
          ? Number(((churnedLastMonth / Math.max(churnDenomLast, 1)) * 100).toFixed(2))
          : 0;
      const mauPct = totalUsers > 0 ? Number(((mauMtd / totalUsers) * 100).toFixed(1)) : 0;

      return res.status(200).json({
        ok: true,
        snapshot: {
          mau: mauMtd,
          totalUsers,
          mrrUsd: mrr.toFixed(2),
          arrUsd: arr.toFixed(2),
          churnRatePercent: churnRate,
          activePaidSubs: activePaid,
          newUsersMtd,
          newPaidSubsMtd: newPaidMtd,
          churnedSubsMtd: churnedMtd,
          mauPercentOfTotal: mauPct,
        },
        churn: {
          ratePercentMtd: churnRate,
          ratePercentLastMonth: churnRateLastMonth,
          churnedMtd,
          churnedLastMonth,
          denominator: churnDenom,
        },
        trends: {
          mauByMonth: mauByMonth.rows || [],
          newUsersByMonth: newUsersByMonth.rows || [],
          churnByMonth: churnByMonth.rows || [],
        },
        revenue: {
          activeByTier: (activeByTier.rows || []).map((row: { tier: string; count: number }) => ({
            tier: row.tier,
            count: row.count,
            unitPriceUsd: tierPrice(row.tier),
            subtotalUsd: Number((row.count * tierPrice(row.tier)).toFixed(2)),
          })),
        },
        meta: {
          prices: TIER_PRICES,
          disclaimer:
            'MAU = users with ≥1 generation this month. MRR/ARR from active paid subs at $5/$10/$25. Churn = paid subs lost MTD ÷ (active paid + churned MTD).',
          exchange: await getUsdToKesRate(),
        },
      });
    }

    // ── EXCHANGE RATE ──────────────────────────────────────────────────────────
    if (resource === 'exchange-rate') {
      const fx = await getUsdToKesRate();
      return res.status(200).json({ ok: true, ...fx });
    }

    // ── MODERATION ─────────────────────────────────────────────────────────────
    if (resource === 'moderation') {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const [total, recent] = await Promise.all([
        safeCount(`SELECT COUNT(*)::int AS count FROM infringements`),
        query<any>(
          `SELECT i.id, i.user_id, i.infringement_type, i.details, i.created_at,
                  u.subscription_tier, u.email, u.banned_at
           FROM infringements i
           LEFT JOIN users u ON u.id = i.user_id
           ORDER BY i.created_at DESC LIMIT $1`,
          [limit]
        ).catch(() => ({ rows: [] })),
      ]);

      return res.status(200).json({
        ok: true,
        total,
        recent: recent.rows,
      });
    }

    return safeErrorResponse(res, 400, 'UNKNOWN_RESOURCE', `Unknown resource: ${resource}`);
  } catch (err: any) {
    console.error('[admin]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
