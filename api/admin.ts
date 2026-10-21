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
//   GET  /api/admin?resource=runtime          (read-only deployment config)
//   GET  /api/admin?resource=jobs&id=         (single job inspector)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { query } from './_utils/db';
import { applyMiddleware } from './_utils/middleware';
import { safeErrorResponse, verifyJWT, getClientIp, setAdminPageSecurityHeaders } from './_utils/security';
import { getQueueStats } from './_utils/queue-stats';
import { getTodaySpending, getSpendingStats, shouldPauseQueue } from './_utils/cost-protection';
import { clearBillingPause, getOperatorPauseState, setOperatorQueuePause } from './_utils/queue-pause';
import { getRecentSecurityEvents, logSecurityEvent } from './_utils/security-logging';
import { checkAdminLoginRateLimit } from './_utils/ratelimit';
import { getUsdToKesRate } from './_utils/exchange-rate';
import { getModelDisplayLabel } from './_utils/job-cost';
import { MODEL_COST_USD, getModelCost } from './_utils/cost-protection';
import { getClosedTestQuotaConfig, getClosedTestUsage } from './_utils/closed-test-quota';
import { getAppVersionConfig } from './_utils/app-version';
import { getAdminTimeZone } from './_utils/admin-time';
import { STYLES_CONFIG } from './_utils/styles-config';
import { logAdminAction, normalizeAdminReason } from './_utils/admin-audit';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const ADMIN_PAGES_DIR = path.join(__dirname, '_utils', 'admin-pages');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdminIdentity = { id: string; role: string; source: 'admin_users' | 'legacy_users' };

/** Prefer `admin_users` (separate from app users). Legacy: `users` + ADMIN_USER_IDS. */
async function lookupAdminByLoginId(loginId: string): Promise<AdminIdentity | null> {
  const trimmed = loginId.trim();
  if (!trimmed) return null;

  try {
    const adminResult = await query<{ id: string; role: string }>(
      UUID_REGEX.test(trimmed)
        ? `SELECT id, role FROM admin_users WHERE id = $1::uuid LIMIT 1`
        : `SELECT id, role FROM admin_users WHERE lower(email) = lower($1) LIMIT 1`,
      [trimmed]
    );
    if (adminResult.rows[0]) {
      return {
        id: adminResult.rows[0].id,
        role: adminResult.rows[0].role || 'admin',
        source: 'admin_users',
      };
    }
  } catch (err) {
    console.warn('[admin] admin_users lookup failed (table missing?):', err);
  }

  // Legacy allowlist: app users.id must also be listed in ADMIN_USER_IDS
  if (ADMIN_USER_IDS.length === 0) return null;
  const dbUserId = await lookupUserByLoginId(trimmed);
  if (!dbUserId) return null;
  if (!ADMIN_USER_IDS.includes(trimmed) && !ADMIN_USER_IDS.includes(dbUserId)) return null;
  return { id: dbUserId, role: 'admin', source: 'legacy_users' };
}

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

async function hasAdminUsersTableRows(): Promise<boolean> {
  try {
    const count = await safeCount(`SELECT COUNT(*)::int AS count FROM admin_users`);
    return count > 0;
  } catch {
    return false;
  }
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

const ALLOWED_TIERS = ['starter', 'popular', 'pro'];

function readJsonBody(req: VercelRequest): Record<string, any> {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return (req.body as Record<string, any>) || {};
}

function styleMeta(styleId: string | null | undefined): { label: string | null; model: string | null } {
  if (!styleId) return { label: null, model: null };
  const style = STYLES_CONFIG[styleId];
  return {
    label: style?.label || null,
    model: style?.model || null,
  };
}

function httpsUrl(value: unknown): string | null {
  const raw = String(value || '');
  if (!raw.startsWith('https://') || raw.length > 2000) return null;
  return raw;
}

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const USER_NOTE_KEY = 'user_note:';

async function readUserNote(userId: string): Promise<string> {
  try {
    const result = await query<{ value: { note?: string } }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [USER_NOTE_KEY + userId]
    );
    return String(result.rows[0]?.value?.note || '');
  } catch {
    return '';
  }
}

async function writeUserNote(userId: string, note: string): Promise<void> {
  await query(
    `
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
  );
  await query(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [USER_NOTE_KEY + userId, JSON.stringify({ note })]
  );
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

    if (!userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID', 'Admin ID or email is required');
    if (!JWT_SECRET) return safeErrorResponse(res, 500, 'AUTH_CONFIG_ERROR', 'Authentication not configured');

    const adminConfigured =
      ADMIN_USER_IDS.length > 0 || (await hasAdminUsersTableRows());
    if (!adminConfigured) {
      return safeErrorResponse(
        res,
        503,
        'ADMIN_NOT_CONFIGURED',
        'Admin access is not configured. Insert a row into admin_users (or set ADMIN_USER_IDS) and redeploy.'
      );
    }

    try {
      const admin = await lookupAdminByLoginId(userId);
      if (!admin) {
        await logSecurityEvent({
          eventType: 'admin_login_denied',
          userId,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'] as string,
          success: false,
        });
        return safeErrorResponse(res, 403, 'ACCESS_DENIED', 'Admin access required.');
      }

      const token = jwt.sign(
        {
          userId: admin.id,
          sub: admin.id,
          role: admin.role || 'admin',
          iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        ok: true,
        token,
        userId: admin.id,
        role: admin.role || 'admin',
        expiresIn: '7d',
      });
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
        const reason = normalizeAdminReason(readJsonBody(req).reason);
        if (!reason) {
          return safeErrorResponse(res, 400, 'MISSING_REASON', 'A reason is required (280 characters max)');
        }
        if (action === 'resume') {
          const cleared = await clearBillingPause('admin');
          if (!cleared) {
            await logAdminAction(req, adminId, 'admin_queue_resume', false, { reason });
            return safeErrorResponse(res, 500, 'RESUME_FAILED', 'Could not clear billing pause');
          }
          const pauseCheck = await shouldPauseQueue();
          await logAdminAction(req, adminId, 'admin_queue_resume', true, {
            reason,
            stillPaused: pauseCheck.paused,
            pauseKind: pauseCheck.pauseKind || null,
          });
          return res.status(200).json({
            ok: true,
            message: pauseCheck.paused
              ? `Billing pause cleared, but the queue is still paused. ${pauseCheck.reason || ''}`.trim()
              : 'Queue resumed — pending jobs will process on the next worker tick.',
            stillPaused: pauseCheck.paused,
            pauseReason: pauseCheck.reason || null,
            pauseKind: pauseCheck.pauseKind || null,
          });
        }
        if (action === 'pause' || action === 'resume-operator') {
          const pausing = action === 'pause';
          const saved = await setOperatorQueuePause(pausing, reason);
          if (!saved) {
            await logAdminAction(req, adminId, pausing ? 'admin_queue_pause' : 'admin_queue_resume_operator', false, { reason });
            return safeErrorResponse(res, 500, 'PAUSE_FAILED', 'Could not update the operator pause');
          }
          const pauseCheck = await shouldPauseQueue();
          await logAdminAction(req, adminId, pausing ? 'admin_queue_pause' : 'admin_queue_resume_operator', true, {
            reason,
            stillPaused: pauseCheck.paused,
            pauseKind: pauseCheck.pauseKind || null,
          });
          return res.status(200).json({
            ok: true,
            message: pausing
              ? 'Queue paused. New generations will wait until you resume it.'
              : pauseCheck.paused
                ? `Operator pause cleared, but the queue is still paused. ${pauseCheck.reason || ''}`.trim()
                : 'Queue resumed — pending jobs will process on the next worker tick.',
            stillPaused: pauseCheck.paused,
            pauseReason: pauseCheck.reason || null,
            pauseKind: pauseCheck.pauseKind || null,
          });
        }
        return safeErrorResponse(res, 400, 'UNKNOWN_ACTION', `Unknown action: ${action}`);
      }

      const [queueStats, todaySpend, spending7d, pauseCheck, operatorPause] = await Promise.all([
        getQueueStats(), getTodaySpending(), getSpendingStats(7), shouldPauseQueue(), getOperatorPauseState(),
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
          operatorPaused: operatorPause.paused,
          canPause: !operatorPause.paused,
          canResumeOperator: operatorPause.paused,
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
      const rawType = String(req.query.eventType || '');
      const eventType = /^[a-z0-9_*]+$/i.test(rawType) ? rawType : undefined;
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

        const reason = normalizeAdminReason(body.reason);
        if (!reason) {
          return safeErrorResponse(res, 400, 'MISSING_REASON', 'A reason is required (280 characters max)');
        }

        if (action === 'ban') {
          if (!body.userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
          const before = await query<{ email: string | null; banned_at: string | null }>(
            `SELECT email, banned_at FROM users WHERE id = $1`,
            [body.userId]
          );
          if (!before.rows[0]) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
          await query(`UPDATE users SET banned_at = NOW(), updated_at = NOW() WHERE id = $1`, [body.userId]);
          await logAdminAction(req, adminId, 'admin_ban', true, {
            reason,
            email: before.rows[0].email,
            previouslyBannedAt: before.rows[0].banned_at,
          }, body.userId);
          return res.status(200).json({ ok: true, message: 'User banned' });
        }
        if (action === 'unban') {
          if (!body.userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
          const before = await query<{ email: string | null; banned_at: string | null }>(
            `SELECT email, banned_at FROM users WHERE id = $1`,
            [body.userId]
          );
          if (!before.rows[0]) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
          await query(`UPDATE users SET banned_at = NULL, updated_at = NOW() WHERE id = $1`, [body.userId]);
          await logAdminAction(req, adminId, 'admin_unban', true, {
            reason,
            email: before.rows[0].email,
            previouslyBannedAt: before.rows[0].banned_at,
          }, body.userId);
          return res.status(200).json({ ok: true, message: 'User unbanned' });
        }
        if (action === 'quota') {
          if (!body.userId || body.adjustment === undefined) return safeErrorResponse(res, 400, 'MISSING_PARAMS');
          const adjustment = Number(body.adjustment);
          if (!Number.isFinite(adjustment) || !Number.isInteger(adjustment)) {
            return safeErrorResponse(res, 400, 'INVALID_ADJUSTMENT', 'Adjustment must be a whole number');
          }
          const exists = await query<{ id: string }>(`SELECT id FROM users WHERE id = $1`, [body.userId]);
          if (!exists.rows[0]) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
          const cm = currentMonthDate();
          const before = await query<{ count: number }>(
            `SELECT count FROM usage_tracking WHERE user_id = $1 AND month = $2`,
            [body.userId, cm]
          );
          const previous = before.rows[0]?.count ?? 0;
          await query(
            `INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
             VALUES ($1, $2, GREATEST(0, $3::int), NOW())
             ON CONFLICT (user_id, month)
             DO UPDATE SET count = GREATEST(0, usage_tracking.count + $3::int), last_reset_at = NOW()`,
            [body.userId, cm, adjustment]
          );
          await logAdminAction(req, adminId, 'admin_quota', true, {
            reason,
            month: cm,
            adjustment,
            previousCount: previous,
            nextCount: Math.max(0, previous + adjustment),
          }, body.userId);
          return res.status(200).json({ ok: true, message: 'Quota adjusted' });
        }
        if (action === 'tier') {
          if (!body.userId || !body.tier) return safeErrorResponse(res, 400, 'MISSING_PARAMS');
          const tier = String(body.tier).trim().toLowerCase();
          if (!ALLOWED_TIERS.includes(tier)) {
            return safeErrorResponse(res, 400, 'INVALID_TIER', 'Tier must be starter, popular, or pro');
          }
          const before = await query<{ subscription_tier: string | null }>(
            `SELECT subscription_tier FROM users WHERE id = $1`,
            [body.userId]
          );
          if (!before.rows[0]) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
          await query(`UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2`, [tier, body.userId]);
          await query(`UPDATE subscriptions SET tier = $1, updated_at = NOW() WHERE user_id = $2 AND status = 'active'`, [tier, body.userId]);
          await logAdminAction(req, adminId, 'admin_tier', true, {
            reason,
            previousTier: before.rows[0].subscription_tier,
            nextTier: tier,
          }, body.userId);
          return res.status(200).json({ ok: true, message: 'Tier updated' });
        }
        if (action === 'note') {
          if (!body.userId) return safeErrorResponse(res, 400, 'MISSING_USER_ID');
          const exists = await query<{ id: string }>(`SELECT id FROM users WHERE id = $1`, [body.userId]);
          if (!exists.rows[0]) return safeErrorResponse(res, 404, 'USER_NOT_FOUND');
          const note = String(body.note ?? '').trim().slice(0, 2000);
          const previous = await readUserNote(body.userId);
          await writeUserNote(body.userId, note);
          await logAdminAction(req, adminId, 'admin_note', true, {
            reason,
            previousNote: previous.slice(0, 200),
            nextNote: note.slice(0, 200),
          }, body.userId);
          return res.status(200).json({ ok: true, message: 'Note saved' });
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
        const [jobsResult, subResult, infResult, closedUsage, adminNote] = await Promise.all([
          query<any>(`SELECT id, style_id, status, priority, created_at, completed_at, error_message FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
          query<any>(`SELECT tier, status, platform, current_period_start, current_period_end, cancel_at_period_end, pending_tier FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`, [userId]),
          query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM infringements WHERE user_id = $1`, [userId]),
          getClosedTestUsage(userId),
          readUserNote(userId),
        ]);
        const closedConfig = getClosedTestQuotaConfig();
        return res.status(200).json({
          ok: true,
          user: userResult.rows[0],
          subscription: subResult.rows[0] || null,
          recentJobs: jobsResult.rows,
          infringements: infResult.rows[0]?.count ?? 0,
          adminNote,
          closedTest: {
            enabled: closedConfig.enabled,
            current: closedUsage.current,
            limit: closedUsage.limit,
            dailyCurrent: closedUsage.dailyCurrent,
            dailyLimit: closedUsage.dailyLimit,
          },
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
      const countParams = params.slice(1, p - 1);
      const countWhere = conditions.length
        ? `WHERE ${conditions
            .map((clause) => clause.replace(/\$(\d+)/g, (_match, n) => `$${Number(n) - 1}`))
            .join(' AND ')}`
        : '';

      const [usersResult, countResult] = await Promise.all([
        query<any>(
          `SELECT u.id, u.email, u.revenuecat_user_id, u.subscription_tier, u.subscription_status,
                  u.trial_generations_used, u.banned_at, u.created_at, COALESCE(ut.count, 0) AS usage_this_month
           FROM users u LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1
           ${where} ORDER BY u.created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
          params
        ),
        query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users u ${countWhere}`, countParams),
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
        const reason = normalizeAdminReason(readJsonBody(req).reason);
        if (!reason) {
          return safeErrorResponse(res, 400, 'MISSING_REASON', 'A reason is required (280 characters max)');
        }
        const existing = await query<{
          id: string;
          user_id: string | null;
          status: string;
          style_id: string;
          error_message: string | null;
        }>(
          `SELECT id, user_id, status, style_id, error_message FROM jobs WHERE id = $1`,
          [jobId]
        );
        const job = existing.rows[0];
        if (!job) return safeErrorResponse(res, 404, 'JOB_NOT_FOUND');

        if (action === 'retry') {
          const updated = await query<{ id: string }>(
            `UPDATE jobs SET status = 'pending', error_message = NULL, started_at = NULL, completed_at = NULL, cost_usd = 0, model_version = NULL WHERE id = $1 AND status = 'failed' RETURNING id`,
            [jobId]
          );
          if (!updated.rows[0]) {
            await logAdminAction(req, adminId, 'admin_job_retry', false, {
              reason,
              jobId,
              styleId: job.style_id,
              status: job.status,
            }, job.user_id);
            return safeErrorResponse(res, 409, 'JOB_NOT_RETRYABLE', 'Only failed jobs can be retried');
          }
          await logAdminAction(req, adminId, 'admin_job_retry', true, {
            reason,
            jobId,
            styleId: job.style_id,
            previousError: job.error_message,
          }, job.user_id);
          return res.status(200).json({ ok: true, message: 'Job requeued' });
        }
        if (action === 'cancel') {
          const updated = await query<{ id: string }>(
            `UPDATE jobs SET status = 'failed', error_message = 'Cancelled by admin', completed_at = NOW(), cost_usd = 0 WHERE id = $1 AND status IN ('pending','processing') RETURNING id`,
            [jobId]
          );
          if (!updated.rows[0]) {
            await logAdminAction(req, adminId, 'admin_job_cancel', false, {
              reason,
              jobId,
              styleId: job.style_id,
              status: job.status,
            }, job.user_id);
            return safeErrorResponse(res, 409, 'JOB_NOT_CANCELLABLE', 'Only pending or processing jobs can be cancelled');
          }
          await logAdminAction(req, adminId, 'admin_job_cancel', true, {
            reason,
            jobId,
            styleId: job.style_id,
            previousStatus: job.status,
          }, job.user_id);
          return res.status(200).json({ ok: true, message: 'Job cancelled' });
        }
        return safeErrorResponse(res, 400, 'UNKNOWN_ACTION');
      }

      if (req.query.id) {
        const jobId = String(req.query.id);
        if (!UUID_REGEX.test(jobId)) return safeErrorResponse(res, 400, 'INVALID_JOB_ID');
        const jobResult = await query<any>(
          `SELECT j.id, j.user_id, j.style_id, j.status, j.priority, j.replicate_prediction_id,
                  j.input_image_url, j.output_image_url, j.sheet_expressions, j.error_message,
                  j.created_at, j.started_at, j.completed_at, j.cost_usd, j.model_version,
                  u.email, u.subscription_tier, u.subscription_status, u.banned_at
           FROM jobs j
           LEFT JOIN users u ON u.id = j.user_id
           WHERE j.id = $1`,
          [jobId]
        );
        const job = jobResult.rows[0];
        if (!job) return safeErrorResponse(res, 404, 'JOB_NOT_FOUND');
        const meta = styleMeta(job.style_id);
        const modelVersion = job.model_version || meta.model;
        const expressions = typeof job.sheet_expressions === 'string' ? job.sheet_expressions : '';
        return res.status(200).json({
          ok: true,
          job: {
            ...job,
            sheet_expressions: expressions ? expressions.slice(0, 500) : null,
            style_label: meta.label,
            configured_model: meta.model,
            model_label: getModelDisplayLabel(modelVersion),
            cost_usd: Number(job.cost_usd ?? 0),
          },
        });
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status as string | undefined;
      const userId = (req.query.userId as string || '').trim();
      const style = (req.query.style as string || '').trim().slice(0, 80);
      const q = (req.query.q as string || '').trim().slice(0, 80);

      const conditions: string[] = [];
      const params: any[] = [];
      let p = 1;
      if (status) { conditions.push(`j.status = $${p}`); params.push(status); p++; }
      if (userId) { conditions.push(`j.user_id::text ILIKE $${p}`); params.push(`%${userId}%`); p++; }
      if (style) { conditions.push(`j.style_id ILIKE $${p}`); params.push(`%${style}%`); p++; }
      if (q) { conditions.push(`j.id::text ILIKE $${p}`); params.push(`${q}%`); p++; }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const filterParams = params.slice();
      params.push(limit, offset);

      const [jobsResult, countResult] = await Promise.all([
        query<any>(
          `SELECT j.id, j.user_id, j.style_id, j.status, j.priority, j.output_image_url,
                  j.error_message, j.cost_usd, j.model_version, j.created_at, j.completed_at,
                  u.subscription_tier
           FROM jobs j LEFT JOIN users u ON u.id = j.user_id
           ${where} ORDER BY j.created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
          params
        ),
        query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM jobs j ${where}`, filterParams),
      ]);

      return res.status(200).json({
        ok: true,
        jobs: jobsResult.rows.map((row) => ({
          ...row,
          style_label: styleMeta(row.style_id).label,
          cost_usd: Number(row.cost_usd ?? 0),
        })),
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

      let storeGrossUsd = 0;
      let storeEvents = 0;
      try {
        const storeRow = await query<{ gross: number; events: number }>(
          `SELECT COALESCE(SUM(
              CASE WHEN (metadata->>'priceUsd') ~ '^[0-9]+(\\.[0-9]+)?$'
                   THEN (metadata->>'priceUsd')::numeric ELSE 0 END
            ), 0)::numeric AS gross,
            COUNT(*) FILTER (
              WHERE (metadata->>'priceUsd') ~ '^[0-9]+(\\.[0-9]+)?$'
            )::int AS events
           FROM subscription_history
           WHERE created_at >= ${monthStart}
             AND event_type IN ('created', 'renewed')`
        );
        storeGrossUsd = Number(storeRow.rows[0]?.gross ?? 0);
        storeEvents = Number(storeRow.rows[0]?.events ?? 0);
      } catch (err) {
        console.warn('[admin/finance] store cash query failed:', err);
      }
      const storeNetEstimateUsd = Number((storeGrossUsd * 0.85).toFixed(2));

      return res.status(200).json({
        ok: true,
        revenue: {
          mrrEstimateUsd: mrr.toFixed(2),
          activeByTier: revenueRows,
          totalActiveSubs: revenueRows.reduce((s: number, r: { count: number }) => s + r.count, 0),
          storeCashMtdUsd: Number(storeGrossUsd.toFixed(2)),
          storeEventsMtd: storeEvents,
          storeFeeRate: 0.15,
          storeNetEstimateUsd,
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
            'MRR uses rounded tier prices ($5/$10/$25). Store cash is the USD price on purchase and renewal webhooks received after this deploy, before store fees. The 15% fee line is an estimate. Refunds are not subtracted. Generation costs come from jobs.cost_usd.',
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

    if (resource === 'runtime') {
      const closedTest = getClosedTestQuotaConfig();
      const appVersion = getAppVersionConfig();
      const pauseCheck = await shouldPauseQueue();
      const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
      return res.status(200).json({
        ok: true,
        deployment: {
          host: String(req.headers['x-forwarded-host'] || req.headers.host || ''),
          vercelEnv: process.env.VERCEL_ENV || null,
          gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
          gitCommit: sha ? sha.slice(0, 7) : null,
        },
        timezone: getAdminTimeZone(),
        closedTest: {
          enabled: closedTest.enabled,
          totalQuota: closedTest.totalQuota,
          dailyQuota: closedTest.enabled ? closedTest.dailyQuota : 0,
        },
        appVersion: {
          latestAppVersion: appVersion.latestAppVersion,
          minAppVersion: appVersion.minAppVersion,
          minRequiredAppVersion: appVersion.minRequiredAppVersion,
          storeUrl: appVersion.storeUrl,
        },
        spending: {
          capUsd: pauseCheck.cap,
          todayCostUsd: pauseCheck.currentSpending,
          paused: pauseCheck.paused,
          pauseKind: pauseCheck.pauseKind || null,
          pauseReason: pauseCheck.reason || null,
        },
      });
    }

    if (resource === 'styles') {
      const rows = await query<{
        style_id: string;
        jobs: number;
        completed: number;
        failed: number;
        cost_usd: number;
      }>(
        `SELECT style_id,
                COUNT(*)::int AS jobs,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
                COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd
         FROM jobs
         WHERE created_at >= date_trunc('month', CURRENT_DATE)
         GROUP BY style_id
         ORDER BY jobs DESC
         LIMIT 100`
      ).catch(() => ({ rows: [] as any[] }));

      return res.status(200).json({
        ok: true,
        styles: rows.rows.map((row) => {
          const jobs = Number(row.jobs) || 0;
          const failed = Number(row.failed) || 0;
          return {
            styleId: row.style_id,
            label: styleMeta(row.style_id).label,
            jobs,
            completed: Number(row.completed) || 0,
            failed,
            failRate: jobs > 0 ? Number((failed / jobs).toFixed(3)) : 0,
            costUsd: Number(row.cost_usd) || 0,
          };
        }),
      });
    }

    if (resource === 'export') {
      const kind = String(req.query.kind || '');
      if (kind !== 'users' && kind !== 'jobs') {
        return safeErrorResponse(res, 400, 'INVALID_EXPORT', 'kind must be users or jobs');
      }
      const cm = currentMonthDate();
      const lines = [
        kind === 'users'
          ? ['id', 'email', 'tier', 'status', 'usage_this_month', 'banned_at', 'created_at']
          : ['id', 'user_id', 'style_id', 'status', 'cost_usd', 'error_message', 'created_at'],
      ];
      if (kind === 'users') {
        const rows = await query<any>(
          `SELECT u.id, u.email, u.subscription_tier, u.subscription_status,
                  COALESCE(ut.count, 0) AS usage_this_month, u.banned_at, u.created_at
           FROM users u
           LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.month = $1
           ORDER BY u.created_at DESC
           LIMIT 2000`,
          [cm]
        );
        for (const row of rows.rows) {
          lines.push([
            row.id, row.email, row.subscription_tier, row.subscription_status,
            row.usage_this_month, row.banned_at, row.created_at,
          ].map(csvCell));
        }
      } else {
        const rows = await query<any>(
          `SELECT id, user_id, style_id, status, cost_usd, error_message, created_at
           FROM jobs
           ORDER BY created_at DESC
           LIMIT 2000`
        );
        for (const row of rows.rows) {
          lines.push([
            row.id, row.user_id, row.style_id, row.status, row.cost_usd,
            String(row.error_message || '').slice(0, 180), row.created_at,
          ].map(csvCell));
        }
      }
      lines[0] = lines[0].map(csvCell);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${kind}.csv"`);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(lines.map((line) => line.join(',')).join('\n'));
    }

    // ── MODERATION ─────────────────────────────────────────────────────────────
    if (resource === 'moderation') {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const [total, recent] = await Promise.all([
        safeCount(`SELECT COUNT(*)::int AS count FROM infringements`),
        query<any>(
          `SELECT i.id, i.user_id, i.infringement_type, i.details, i.created_at,
                  u.subscription_tier, u.email, u.banned_at,
                  j.input_image_url, j.output_image_url, j.style_id, j.status AS job_status
           FROM infringements i
           LEFT JOIN users u ON u.id = i.user_id
           LEFT JOIN jobs j ON j.id::text = i.details->>'jobId'
           ORDER BY i.created_at DESC LIMIT $1`,
          [limit]
        ).catch(() => ({ rows: [] })),
      ]);

      return res.status(200).json({
        ok: true,
        total,
        recent: recent.rows.map((row: any) => {
          const details = row.details && typeof row.details === 'object' ? row.details : {};
          const violations = Array.isArray(details.violations) ? details.violations.slice(0, 6) : [];
          return {
            id: row.id,
            user_id: row.user_id,
            infringement_type: row.infringement_type,
            created_at: row.created_at,
            subscription_tier: row.subscription_tier,
            email: row.email,
            banned_at: row.banned_at,
            jobId: typeof details.jobId === 'string' ? details.jobId : null,
            jobStatus: row.job_status || null,
            styleId: row.style_id || null,
            source: details.source || null,
            stage: details.stage || null,
            imageUrl: httpsUrl(details.imageUrl) || httpsUrl(row.input_image_url) || httpsUrl(row.output_image_url),
            violations,
          };
        }),
      });
    }

    return safeErrorResponse(res, 400, 'UNKNOWN_RESOURCE', `Unknown resource: ${resource}`);
  } catch (err: any) {
    console.error('[admin]', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', String(err?.message || err));
  }
}
