// Rate limiting utilities for tier-based burst protection

import type { VercelRequest } from '@vercel/node';
import { query } from './db';
import { getClientIp } from './security';
import { logSecurityEvent } from './security-logging';

// Burst protection limits per tier (requests per minute)
const TIER_BURST_LIMITS: Record<string, number> = {
  'starter': 20,
  'popular': 30,
  'pro': 50,
  'trial': 10, // Trial users get lower burst limit
};

// IP-based rate limit (global, prevents abuse from any IP)
const IP_RATE_LIMIT_PER_MINUTE = Number(process.env.IP_RATE_LIMIT_PER_MINUTE || 60);

async function logRateLimitFailOpen(
  checkName: string,
  err: unknown,
  req?: VercelRequest
): Promise<void> {
  try {
    await logSecurityEvent({
      eventType: 'rate_limit_fail_open',
      ip: req ? getClientIp(req) : undefined,
      userAgent: req?.headers['user-agent'] as string | undefined,
      success: false,
      details: {
        check: checkName,
        error: String((err as Error)?.message || err),
      },
    });
  } catch {
    // Logging must not break the request path
  }
}

/**
 * Remove stale IP rate-limit rows (admin_login buckets use non-timestamp keys).
 */
export async function purgeStaleRateLimits(): Promise<number> {
  try {
    const result = await query<{ count: number }>(
      `
        WITH deleted AS (
          DELETE FROM rate_limits
          WHERE type = 'ip'
            AND window_start < NOW() - INTERVAL '2 hours'
          RETURNING 1
        )
        SELECT COUNT(*)::int AS count FROM deleted
      `
    );
    return result.rows[0]?.count ?? 0;
  } catch (err) {
    console.warn('[ratelimit] purgeStaleRateLimits failed:', err);
    return 0;
  }
}

// Get current minute window (rounded to minute)
function getCurrentMinuteWindow(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  return d.toISOString();
}

// Get current day (for daily limits)
function getCurrentDay(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Get burst limit for tier
export function getBurstLimitForTier(tier: string | null): number {
  if (!tier) return TIER_BURST_LIMITS['trial'];
  return TIER_BURST_LIMITS[tier.toLowerCase()] || TIER_BURST_LIMITS['trial'];
}

/**
 * Check IP-based rate limit (prevents abuse from any IP)
 */
export async function checkIpRateLimit(
  req: VercelRequest
): Promise<{ allowed: boolean; remaining: number; error?: string }> {
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
          ON CONFLICT (identifier, type, window_start) DO UPDATE
          SET request_count = rate_limits.request_count + 1
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

    const remaining = Math.max(0, IP_RATE_LIMIT_PER_MINUTE - currentCount);

    if (currentCount > IP_RATE_LIMIT_PER_MINUTE) {
      return {
        allowed: false,
        remaining: 0,
        error: 'Too many requests from this IP. Please wait a moment and try again.',
      };
    }

    return { allowed: true, remaining };
  } catch (err) {
    console.error('[ratelimit] IP rate limit check failed:', err);
    await logRateLimitFailOpen('ip', err, req);
    return { allowed: true, remaining: IP_RATE_LIMIT_PER_MINUTE };
  }
}

/**
 * Check tier-based burst limit (per user, per minute)
 */
export async function checkTierBurstLimit(
  userId: string,
  tier: string | null
): Promise<{ allowed: boolean; remaining: number; limit: number; error?: string }> {
  const limit = getBurstLimitForTier(tier);
  const windowStart = getCurrentMinuteWindow();

  try {
    // Count jobs created in the current minute
    const countResult = await query<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM jobs
        WHERE user_id = $1 
        AND created_at >= $2
        AND created_at < $2::timestamp + INTERVAL '1 minute'
      `,
      [userId, windowStart]
    );

    const currentCount = Number(countResult.rows[0]?.count ?? 0) + 1; // +1 for current request
    const remaining = Math.max(0, limit - currentCount);

    if (currentCount > limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        error: `Burst limit exceeded. Maximum ${limit} requests per minute for ${tier || 'trial'} tier. Please slow down.`,
      };
    }

    return { allowed: true, remaining, limit };
  } catch (err) {
    console.error('[ratelimit] Tier burst limit check failed:', err);
    await logRateLimitFailOpen('tier_burst', err);
    return { allowed: true, remaining: limit, limit };
  }
}

/**
 * Check daily safety limit (matches monthly quota - prevents accidental overuse)
 * This is optional and only acts as a safety net
 */
export async function checkDailyLimit(
  userId: string,
  tier: string | null,
  monthlyQuota: number
): Promise<{ allowed: boolean; current: number; limit: number; error?: string }> {
  // Daily limit matches monthly quota (users can use quota however they want)
  const dailyLimit = monthlyQuota;
  const today = getCurrentDay();

  try {
    // Count jobs created today
    const countResult = await query<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM jobs
        WHERE user_id = $1 
        AND DATE(created_at) = $2
      `,
      [userId, today]
    );

    const current = Number(countResult.rows[0]?.count ?? 0) + 1; // +1 for current request

    if (current > dailyLimit) {
      return {
        allowed: false,
        current,
        limit: dailyLimit,
        error: `Daily limit exceeded. You've generated ${current - 1} images today (limit: ${dailyLimit}). This matches your monthly quota.`,
      };
    }

    return { allowed: true, current, limit: dailyLimit };
  } catch (err) {
    console.error('[ratelimit] Daily limit check failed:', err);
    await logRateLimitFailOpen('daily', err);
    return { allowed: true, current: 0, limit: dailyLimit };
  }
}

/**
 * Combined rate limit check (IP + Tier + Daily)
 * Returns the first limit that's exceeded, or success if all pass
 */
export async function checkAllRateLimits(
  req: VercelRequest,
  userId: string,
  tier: string | null,
  monthlyQuota: number
): Promise<{
  allowed: boolean;
  error?: string;
  details?: {
    ip?: { remaining: number };
    burst?: { remaining: number; limit: number };
    daily?: { current: number; limit: number };
  };
}> {
  // 1. Check IP rate limit (prevents abuse from any IP)
  const ipCheck = await checkIpRateLimit(req);
  if (!ipCheck.allowed) {
    return {
      allowed: false,
      error: ipCheck.error,
      details: { ip: { remaining: ipCheck.remaining } },
    };
  }

  // 2. Check tier-based burst limit (per user, per minute)
  const burstCheck = await checkTierBurstLimit(userId, tier);
  if (!burstCheck.allowed) {
    return {
      allowed: false,
      error: burstCheck.error,
      details: {
        ip: { remaining: ipCheck.remaining },
        burst: { remaining: burstCheck.remaining, limit: burstCheck.limit },
      },
    };
  }

  // 3. Check daily limit (optional safety net, matches monthly quota)
  const dailyCheck = await checkDailyLimit(userId, tier, monthlyQuota);
  if (!dailyCheck.allowed) {
    return {
      allowed: false,
      error: dailyCheck.error,
      details: {
        ip: { remaining: ipCheck.remaining },
        burst: { remaining: burstCheck.remaining, limit: burstCheck.limit },
        daily: { current: dailyCheck.current, limit: dailyCheck.limit },
      },
    };
  }

  // All checks passed
  return {
    allowed: true,
    details: {
      ip: { remaining: ipCheck.remaining },
      burst: { remaining: burstCheck.remaining, limit: burstCheck.limit },
      daily: { current: dailyCheck.current, limit: dailyCheck.limit },
    },
  };
}

const QUEUE_KICK_LIMIT_PER_MINUTE = Number(process.env.QUEUE_KICK_LIMIT_PER_MINUTE || 12);

/**
 * Rate limit mobile queue kicks per user (prevents hammering process-queue).
 */
export async function checkQueueKickRateLimit(
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const windowStart = getCurrentMinuteWindow();

  try {
    const rateResult = await query<{ id: string; request_count: number }>(
      `
        SELECT id, request_count
        FROM rate_limits
        WHERE identifier = $1 AND type = 'queue_kick' AND window_start = $2
      `,
      [userId, windowStart]
    );

    let currentCount = 0;
    if (rateResult.rows.length === 0) {
      await query(
        `
          INSERT INTO rate_limits (identifier, type, window_start, request_count)
          VALUES ($1, 'queue_kick', $2, 1)
          ON CONFLICT (identifier, type, window_start) DO UPDATE
          SET request_count = rate_limits.request_count + 1
        `,
        [userId, windowStart]
      );
      currentCount = 1;
    } else {
      currentCount = (rateResult.rows[0].request_count ?? 0) + 1;
      await query(`UPDATE rate_limits SET request_count = $1 WHERE id = $2`, [
        currentCount,
        rateResult.rows[0].id,
      ]);
    }

    if (currentCount > QUEUE_KICK_LIMIT_PER_MINUTE) {
      return {
        allowed: false,
        error: 'Too many queue requests. Please wait a moment and try again.',
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[ratelimit] Queue kick rate limit check failed:', err);
    await logRateLimitFailOpen('queue_kick', err);
    return { allowed: true };
  }
}

const ADMIN_LOGIN_MAX_ATTEMPTS = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 10);
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;

function getAdminLoginWindowStart(): string {
  const bucket = Math.floor(Date.now() / ADMIN_LOGIN_WINDOW_MS);
  return `admin_login_${bucket}`;
}

/**
 * Rate limit admin login attempts per IP (15-minute window).
 */
export async function checkAdminLoginRateLimit(
  req: VercelRequest
): Promise<{ allowed: boolean; error?: string }> {
  const clientIp = getClientIp(req);
  const windowStart = getAdminLoginWindowStart();

  try {
    const rateResult = await query<{ id: string; request_count: number }>(
      `
        SELECT id, request_count
        FROM rate_limits
        WHERE identifier = $1 AND type = 'admin_login' AND window_start = $2
      `,
      [clientIp, windowStart]
    );

    let currentCount = 0;
    if (rateResult.rows.length === 0) {
      await query(
        `
          INSERT INTO rate_limits (identifier, type, window_start, request_count)
          VALUES ($1, 'admin_login', $2, 1)
          ON CONFLICT (identifier, type, window_start) DO UPDATE
          SET request_count = rate_limits.request_count + 1
        `,
        [clientIp, windowStart]
      );
      currentCount = 1;
    } else {
      currentCount = (rateResult.rows[0].request_count ?? 0) + 1;
      await query(
        `UPDATE rate_limits SET request_count = $1 WHERE id = $2`,
        [currentCount, rateResult.rows[0].id]
      );
    }

    if (currentCount > ADMIN_LOGIN_MAX_ATTEMPTS) {
      return {
        allowed: false,
        error: 'Too many login attempts. Please wait 15 minutes and try again.',
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[ratelimit] Admin login rate limit check failed:', err);
    await logRateLimitFailOpen('admin_login', err, req);
    return { allowed: true };
  }
}

