// Get user's current subscription status
// Returns subscription info, tier, quota usage

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import { applyMiddleware } from '../utils/middleware';
import { requireAuth } from '../utils/auth';
import { safeErrorResponse } from '../utils/security';

const TIER_QUOTAS: Record<string, number> = {
  'starter': 50,
  'popular': 100,
  'pro': 250,
};

function getCurrentMonthDate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

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
    const TRIAL_LIMIT = 3;
    const isTrialUser = subscriptionStatus === 'trial' || 
                       (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);

    // Get active subscription (if any)
    const subscriptionResult = await query<{
      id: string;
      tier: string;
      status: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
    }>(
      `
        SELECT id, tier, status, current_period_end, cancel_at_period_end
        FROM subscriptions
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    let subscription = null;
    if (subscriptionResult.rows.length > 0) {
      const sub = subscriptionResult.rows[0];
      subscription = {
        tier: sub.tier,
        status: sub.status,
        periodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end
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
      const limit = TIER_QUOTAS[subscription.tier.toLowerCase()] || 0;

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
    const debug = req.query.debug === '1' || req.query.debug === 'true';
    return safeErrorResponse(
      res,
      500,
      'INTERNAL_ERROR',
      debug ? String(err?.message || err) : 'Failed to get subscription info'
    );
  }
}
