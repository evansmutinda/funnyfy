// Enqueue endpoint: Creates a job as 'pending' and returns jobId
// Client polls /api/job?id=<jobId> to check status
// This enables async processing via the queue worker

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';
import { getStyleById } from './styles-config';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const IP_RATE_LIMIT_PER_MINUTE = Number(process.env.IP_RATE_LIMIT_PER_MINUTE || 30);

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function getClientIp(req: VercelRequest): string {
  const xfwd = (req.headers['x-forwarded-for'] || '') as string;
  if (xfwd) {
    return xfwd.split(',')[0].trim();
  }
  return (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'unknown';
}

function getCurrentMinuteWindow(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString();
}

function getCurrentMonthDate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const TIER_QUOTAS: Record<string, number> = {
  'starter': 50,
  'popular': 100,
  'pro': 250,
};

function getQuotaForTier(tier: string | null): number {
  if (!tier) {
    throw new Error('User tier is required');
  }
  return TIER_QUOTAS[tier.toLowerCase()] || 0;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Only POST allowed' });
  }

  let body: Record<string, unknown> = {};
  try {
    if (typeof req.body === 'string') {
      body = req.body ? JSON.parse(req.body) : {};
    } else if (req.body) {
      body = req.body as Record<string, unknown>;
    }
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  const payload = (body?.payload as Record<string, unknown>) ?? {};

  // User authentication required
  const userId: string | null = 
    (req.headers['x-user-id'] as string) || 
    (body?.userId as string) || 
    null;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'User authentication required. Please sign in to continue.'
    });
  }

  // Look up user
  let userTier: string | null = null;
  let subscriptionStatus: string | null = null;
  let trialGenerationsUsed: number = 0;
  const TRIAL_LIMIT = 3;

  try {
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
        error: 'USER_NOT_FOUND',
        message: 'User account not found. Please sign up.'
      });
    }
    
    subscriptionStatus = userResult.rows[0].subscription_status;
    userTier = userResult.rows[0].subscription_tier;
    trialGenerationsUsed = userResult.rows[0].trial_generations_used ?? 0;

    if (subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT)) {
      if (trialGenerationsUsed >= TRIAL_LIMIT) {
        return res.status(403).json({
          ok: false,
          error: 'TRIAL_EXPIRED',
          message: 'You\'ve used all 3 free trial generations. Please subscribe to continue.',
        });
      }
    } else if (subscriptionStatus !== 'active') {
      return res.status(403).json({
        ok: false,
        error: 'SUBSCRIPTION_INACTIVE',
        message: 'Your subscription is not active. Please subscribe to continue.'
      });
    }
  } catch (userErr) {
    console.error('Failed to look up user:', userErr);
    return res.status(500).json({
      ok: false,
      error: 'Failed to verify user account'
    });
  }

  // Validate styleId
  const styleId = typeof (payload as any)?.styleId === 'string' 
    ? (payload as any).styleId 
    : null;
  
  if (!styleId) {
    return res.status(400).json({
      ok: false,
      error: 'styleId is required.'
    });
  }
  
  const styleConfig = getStyleById(styleId);
  if (!styleConfig) {
    return res.status(400).json({
      ok: false,
      error: `Invalid styleId: ${styleId}`
    });
  }

  const imageUrl = typeof (payload as any)?.imageUrl === 'string'
    ? (payload as any).imageUrl
    : null;

  // Per-IP rate limiting
  const clientIp = getClientIp(req);
  const windowStart = getCurrentMinuteWindow();

  try {
    const rateResult = await query<{ id: string; request_count: number }>(
      `
        SELECT id, request_count
        FROM rate_limits
        WHERE identifier = $1 AND type = 'ip' AND window_start = $2
      `,
      [clientIp, windowStart]
    );

    let currentCount = 0;
    if (rateResult.rows.length === 0) {
      await query(
        `
          INSERT INTO rate_limits (identifier, type, window_start, request_count)
          VALUES ($1, 'ip', $2, 1)
        `,
        [clientIp, windowStart]
      );
      currentCount = 1;
    } else {
      currentCount = (rateResult.rows[0].request_count ?? 0) + 1;
      await query(
        `
          UPDATE rate_limits
          SET request_count = $1
          WHERE id = $2
        `,
        [currentCount, rateResult.rows[0].id]
      );
    }

    if (currentCount > IP_RATE_LIMIT_PER_MINUTE) {
      return res.status(429).json({
        ok: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please wait a moment and try again.',
      });
    }
  } catch (rateErr) {
    console.error('IP rate limit check failed (continuing without limit):', rateErr);
  }

  // Quota check
  const isTrialUser = subscriptionStatus === 'trial' || (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);
  
  if (!isTrialUser) {
    const currentMonth = getCurrentMonthDate();
    const quotaLimit = getQuotaForTier(userTier);

    try {
      const usageResult = await query<{ id: string; count: number }>(
        `
          SELECT id, count
          FROM usage_tracking
          WHERE user_id = $1 AND month = $2
        `,
        [userId, currentMonth]
      );

      let currentCount = 0;
      if (usageResult.rows.length === 0) {
        await query(
          `
            INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
            VALUES ($1, $2, 0, NOW())
          `,
          [userId, currentMonth]
        );
      } else {
        currentCount = usageResult.rows[0].count ?? 0;
      }

      if (currentCount >= quotaLimit) {
        return res.status(429).json({
          ok: false,
          error: 'QUOTA_EXCEEDED',
          message: `You've used all ${quotaLimit} images this month (${userTier} plan). Upgrade your plan or wait until next month.`,
          usage: {
            current: currentCount,
            limit: quotaLimit,
            month: currentMonth,
            tier: userTier
          }
        });
      }
    } catch (quotaErr) {
      console.error('Quota check failed:', quotaErr);
      return res.status(500).json({
        ok: false,
        error: 'Failed to check usage quota'
      });
    }
  }

  // Create job as 'pending' (will be processed by queue worker)
  const priority = userTier === 'pro' ? 10 : userTier === 'popular' ? 5 : 1;

  try {
    const insertResult = await query<{ id: string }>(
      `
        INSERT INTO jobs (user_id, style_id, status, priority, input_image_url, created_at)
        VALUES ($1, $2, 'pending', $3, $4, NOW())
        RETURNING id
      `,
      [userId, styleId, priority, imageUrl]
    );

    const jobId = insertResult.rows[0]?.id;

    return res.status(200).json({
      ok: true,
      jobId,
      status: 'pending',
      message: 'Job queued for processing'
    });
  } catch (dbErr) {
    console.error('Failed to create job:', dbErr);
    return res.status(500).json({
      ok: false,
      error: 'Failed to queue job'
    });
  }
}
