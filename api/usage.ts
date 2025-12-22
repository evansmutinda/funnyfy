import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

// Subscription tier quotas (per month)
const TIER_QUOTAS: Record<string, number> = {
  'starter': 50,
  'popular': 100,
  'pro': 250,
};

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function getCurrentMonthDate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Only GET allowed' });
  }

  // User authentication required
  const userId: string | null = 
    (req.headers['x-user-id'] as string) || 
    (req.query.userId as string) ||
    null;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'User authentication required.'
    });
  }

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
    return res.status(500).json({
      ok: false,
      error: 'Failed to read usage info'
    });
  }
}

