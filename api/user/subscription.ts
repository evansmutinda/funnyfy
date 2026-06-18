// Get user's current subscription status
// Returns subscription info, tier, quota usage

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_utils/db';
import { applyMiddleware } from '../_utils/middleware';
import { requireAuth } from '../_utils/auth';
import { safeErrorResponse } from '../_utils/security';
import { getCurrentMonthDate, getTierQuota, TRIAL_LIMIT } from '../_utils/usage';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply security middleware (CORS, headers, OPTIONS handling)
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;

  // Require authentication
  const userIdRaw = requireAuth(req, res);
  if (!userIdRaw) return; // Response already sent by requireAuth

  const debug = req.query.debug === '1' || req.query.debug === 'true';

  try {
    // Get user info
    // Look up user by primary key OR by revenuecat_user_id (for appUserID-based auth)
    const userResult = await query<{
      id: string;
      subscription_tier: string | null;
      subscription_status: string | null;
      trial_generations_used: number | null;
      billing_date: string | null;
    }>(
      `
        SELECT id, subscription_tier, subscription_status, trial_generations_used, billing_date
        FROM users
        WHERE id::text = $1
           OR revenuecat_user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userIdRaw]
    );

    if (userResult.rows.length === 0) {
      return safeErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const user = userResult.rows[0];
    const userId = user.id;
    const subscriptionStatus = user.subscription_status ?? 'trial';
    const trialGenerationsUsed = user.trial_generations_used ?? 0;

    // Get active subscription (if any) — must run before isTrialUser
    let subscriptionResult: { rows: Array<{ tier: string; status: string; current_period_start: string; current_period_end: string; cancel_at_period_end: boolean; pending_tier?: string | null }> };
    try {
      subscriptionResult = await query(
        `SELECT id, tier, status, current_period_start, current_period_end, cancel_at_period_end, pending_tier
         FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
    } catch {
      subscriptionResult = await query(
        `SELECT id, tier, status, current_period_start, current_period_end, cancel_at_period_end
         FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
    }

    // Active subscription record wins over trial status (handles stale user row after purchase)
    const isTrialUser = subscriptionResult.rows.length === 0 && (
      subscriptionStatus === 'trial' ||
      (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT)
    );

    let subscription = null;
    if (subscriptionResult.rows.length > 0) {
      const sub = subscriptionResult.rows[0] as {
        tier: string;
        status: string;
        current_period_start: string;
        current_period_end: string;
        cancel_at_period_end: boolean;
        pending_tier?: string | null;
      };
      subscription = {
        tier: sub.tier,
        status: sub.status,
        periodStart: sub.current_period_start,
        periodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        pendingTier: sub.pending_tier ?? undefined
      };
    }

    // Get usage
    let usage = { current: 0, limit: 0, month: getCurrentMonthDate() };

    if (isTrialUser) {
      usage = {
        current: trialGenerationsUsed,
        limit: TRIAL_LIMIT,
        month: getCurrentMonthDate()
      };
    } else if (subscription) {
      const currentMonth = getCurrentMonthDate();
      const usageResult = await query<{ count: number }>(
        `
          SELECT count
          FROM usage_tracking
          WHERE user_id = $1 AND month = $2
        `,
        [userId, currentMonth]
      );
      const current = usageResult.rows[0]?.count ?? 0;
      const limit = getTierQuota(subscription.tier);

      usage = {
        current,
        limit,
        month: currentMonth
      };
    }

    return res.status(200).json({
      ok: true,
      subscription,
      usage,
      isTrial: isTrialUser
    });
  } catch (err: any) {
    console.error('[user/subscription] Failed to get subscription:', err);
    if (debug) {
      // Bypass safeErrorResponse's NODE_ENV check so we can diagnose prod issues
      return res.status(500).json({
        ok: false,
        error: 'INTERNAL_ERROR',
        detail: String(err?.message || err),
        stack: err?.stack,
      });
    }
    return safeErrorResponse(
      res,
      500,
      'INTERNAL_ERROR',
      'Failed to get subscription info'
    );
  }
}
