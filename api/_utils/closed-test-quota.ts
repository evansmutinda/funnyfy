/**
 * Temporary closed-testing generation allowance for users without a subscription.
 *
 * Env (Vercel — enable only during closed testing):
 * - CLOSED_TEST_QUOTA — total gens per user for the window (e.g. 12)
 * - CLOSED_TEST_DAILY_QUOTA — gens per calendar day (e.g. 1). Default 1 when quota is set.
 *
 * Leave CLOSED_TEST_QUOTA unset or 0 for production hard paywall.
 */

import { query } from './db';
import { getCurrentMonthDate } from './usage';

export type ClosedTestQuotaConfig = {
  enabled: boolean;
  totalQuota: number;
  dailyQuota: number;
};

export type ClosedTestUsage = {
  current: number;
  limit: number;
  dailyCurrent: number;
  dailyLimit: number;
  month: string;
};

function parseNonNegInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

/** Calendar day key in UTC (matches ratelimit job DATE checks). */
export function getCurrentDayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClosedTestQuotaConfig(): ClosedTestQuotaConfig {
  const totalQuota = parseNonNegInt(process.env.CLOSED_TEST_QUOTA, 0);
  const dailyQuota = parseNonNegInt(
    process.env.CLOSED_TEST_DAILY_QUOTA,
    totalQuota > 0 ? 1 : 0,
  );
  return {
    enabled: totalQuota > 0,
    totalQuota,
    dailyQuota: dailyQuota > 0 ? dailyQuota : 1,
  };
}

export async function getClosedTestUsage(userId: string): Promise<ClosedTestUsage> {
  const config = getClosedTestQuotaConfig();
  const month = getCurrentMonthDate();
  const today = getCurrentDayUtc();

  const [usageResult, dailyResult] = await Promise.all([
    query<{ count: number }>(
      `
        SELECT count
        FROM usage_tracking
        WHERE user_id = $1 AND month = $2
      `,
      [userId, month],
    ),
    query<{ count: number }>(
      `
        SELECT COUNT(*)::int AS count
        FROM jobs
        WHERE user_id = $1
          AND DATE(created_at) = $2::date
      `,
      [userId, today],
    ),
  ]);

  return {
    current: usageResult.rows[0]?.count ?? 0,
    limit: config.totalQuota,
    dailyCurrent: dailyResult.rows[0]?.count ?? 0,
    dailyLimit: config.dailyQuota,
    month,
  };
}
