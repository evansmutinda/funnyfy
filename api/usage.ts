import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';
import { applyMiddleware } from './utils/middleware';
import { requireAuth } from './utils/auth';
import { safeErrorResponse } from './utils/security';

// Subscription tier quotas (per month)
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
  const userId = requireAuth(req, res);
  if (!userId) return; // Response already sent by requireAuth

  const currentMonth = getCurrentMonthDate();

  try {
    // Get user tier and trial status
    const userResult = await query<{ 
      subscription_tier: string; 
      subscription_status: string;
      trial_generations_used: number;
    }>(
      `
        SELECT subscription_tier, subscription_status, trial_generations_used
        FROM users
        WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'USER_NOT_FOUND'
      });
    }

    const userTier = userResult.rows[0].subscription_tier;
    const subscriptionStatus = userResult.rows[0].subscription_status;
    const trialGenerationsUsed = userResult.rows[0].trial_generations_used ?? 0;
    const TRIAL_LIMIT = 3;

    const isTrialUser = subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);

    if (isTrialUser) {
      // Trial user: return trial usage
      return res.status(200).json({
        ok: true,
        usage: {
          current: trialGenerationsUsed,
          limit: TRIAL_LIMIT,
          month: currentMonth,
          tier: 'trial',
          isTrial: true
        }
      });
    } else {
      // Subscribed user: return monthly quota usage
      const quotaLimit = TIER_QUOTAS[userTier.toLowerCase()] || 0;

      const result = await query<{ count: number }>(
        `
          SELECT count
          FROM usage_tracking
          WHERE user_id = $1 AND month = $2
        `,
        [userId, currentMonth]
      );

      const current = result.rows[0]?.count ?? 0;

      return res.status(200).json({
        ok: true,
        usage: {
          current,
          limit: quotaLimit,
          month: currentMonth,
          tier: userTier,
          isTrial: false
        }
      });
    }
  } catch (err: any) {
    console.error('[usage] Failed to read usage:', err);
    return safeErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to read usage info');
  }
}

