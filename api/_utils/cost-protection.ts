// Cost protection utilities for monitoring and limiting Replicate API spending

import { query } from './db';

/** USD per successful generation (failed = $0). */
export const MODEL_COST_USD: Record<string, number> = {
  'black-forest-labs/flux-kontext-pro': 0.04,
  'google/nano-banana': 0.039,
  'google/nano-banana-2': 0.067,
  'bytedance/seedream-4': 0.04,
  'bytedance/seedream-4.5': 0.04,
  default: 0.04,
};

export function getModelCost(modelVersion: string): number {
  const key = (modelVersion || '').trim();
  if (MODEL_COST_USD[key] != null) return MODEL_COST_USD[key];
  if (key.includes('nano-banana-2')) return MODEL_COST_USD['google/nano-banana-2'];
  if (key.includes('nano-banana')) return MODEL_COST_USD['google/nano-banana'];
  if (key.includes('seedream-4.5')) return MODEL_COST_USD['bytedance/seedream-4.5'];
  if (key.includes('seedream-4')) return MODEL_COST_USD['bytedance/seedream-4'];
  if (key.includes('flux')) return MODEL_COST_USD['black-forest-labs/flux-kontext-pro'];
  return MODEL_COST_USD.default;
}

export function getEstimatedCost(modelVersion: string): number {
  return getModelCost(modelVersion);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get daily spending cap from environment variable
 */
function getDailySpendingCap(): number {
  return Number(process.env.DAILY_SPENDING_CAP || '100'); // Default $100/day
}

/**
 * Get today's total spending
 */
export async function getTodaySpending(): Promise<{
  totalCost: number;
  jobCount: number;
}> {
  try {
    const today = getTodayDate();
    const result = await query<{ total_cost: number; job_count: number }>(
      `
        SELECT 
          COALESCE(SUM(cost_usd), 0)::numeric as total_cost,
          COUNT(*)::int as job_count
        FROM cost_tracking
        WHERE date = $1
      `,
      [today]
    );

    return {
      totalCost: Number(result.rows[0]?.total_cost ?? 0),
      jobCount: Number(result.rows[0]?.job_count ?? 0),
    };
  } catch (err) {
    console.error('[cost-protection] Failed to get today spending:', err);
    return { totalCost: 0, jobCount: 0 };
  }
}

/**
 * Check if daily spending cap would be exceeded
 */
export async function checkDailySpendingCap(
  additionalCost: number = 0
): Promise<{
  allowed: boolean;
  currentSpending: number;
  cap: number;
  remaining: number;
  wouldExceed: boolean;
}> {
  const cap = getDailySpendingCap();
  const today = await getTodaySpending();
  const totalAfter = today.totalCost + additionalCost;

  return {
    allowed: totalAfter <= cap,
    currentSpending: today.totalCost,
    cap,
    remaining: Math.max(0, cap - today.totalCost),
    wouldExceed: totalAfter > cap,
  };
}

/**
 * Record cost for a completed job
 */
export async function recordJobCost(
  jobId: string,
  modelVersion: string,
  actualCost?: number // If provided, use this instead of estimated
): Promise<void> {
  try {
    const cost = actualCost ?? getEstimatedCost(modelVersion);
    const today = getTodayDate();

    await query(
      `
        INSERT INTO cost_tracking (job_id, date, cost_usd, model_version)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM cost_tracking WHERE job_id = $1)
      `,
      [jobId, today, cost, modelVersion]
    );
  } catch (err) {
    console.error('[cost-protection] Failed to record job cost:', err);
    // Don't throw - cost tracking failures shouldn't break the app
  }
}

/**
 * Get spending statistics
 */
export async function getSpendingStats(days: number = 7): Promise<{
  daily: Array<{ date: string; cost: number; jobs: number }>;
  total: number;
  average: number;
}> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await query<{
      date: string;
      total_cost: number;
      job_count: number;
    }>(
      `
        SELECT 
          date,
          COALESCE(SUM(cost_usd), 0)::numeric as total_cost,
          COUNT(*)::int as job_count
        FROM cost_tracking
        WHERE date >= $1
        GROUP BY date
        ORDER BY date DESC
      `,
      [since.toISOString().slice(0, 10)]
    );

    const daily = result.rows.map((row: { date: string; total_cost: number; job_count: number }) => ({
      date: row.date,
      cost: Number(row.total_cost),
      jobs: Number(row.job_count),
    }));

    const total = daily.reduce((sum: number, day: { cost: number }) => sum + day.cost, 0);
    const average = daily.length > 0 ? total / daily.length : 0;

    return { daily, total, average };
  } catch (err) {
    console.error('[cost-protection] Failed to get spending stats:', err);
    return { daily: [], total: 0, average: 0 };
  }
}

/**
 * Check if queue should be paused due to cost
 */
export async function shouldPauseQueue(): Promise<{
  paused: boolean;
  reason?: string;
  currentSpending: number;
  cap: number;
}> {
  const cap = getDailySpendingCap();
  const today = await getTodaySpending();

  // Pause if we've exceeded 95% of cap (safety margin)
  const threshold = cap * 0.95;
  const paused = today.totalCost >= threshold;

  return {
    paused,
    reason: paused ? `Daily spending cap reached ($${today.totalCost.toFixed(2)} / $${cap.toFixed(2)})` : undefined,
    currentSpending: today.totalCost,
    cap,
  };
}

