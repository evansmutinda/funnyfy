// Cost protection utilities for monitoring and limiting Replicate API spending

import { query } from '../db';

// Estimated cost per generation (varies by model)
// These are approximate costs - adjust based on actual Replicate pricing
const MODEL_COSTS: Record<string, number> = {
  'black-forest-labs/flux-kontext-pro': 0.004, // ~$0.004 per generation
  'google/nano-banana': 0.003, // ~$0.003 per generation
  'default': 0.004, // Default fallback
};

// Get estimated cost for a model
export function getEstimatedCost(modelVersion: string): number {
  // Try exact match first
  if (MODEL_COSTS[modelVersion]) {
    return MODEL_COSTS[modelVersion];
  }

  // Try partial match
  for (const [model, cost] of Object.entries(MODEL_COSTS)) {
    if (modelVersion.includes(model) || model.includes(modelVersion)) {
      return cost;
    }
  }

  // Default cost
  return MODEL_COSTS['default'];
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
        VALUES ($1, $2, $3, $4)
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

    const daily = result.rows.map((row) => ({
      date: row.date,
      cost: Number(row.total_cost),
      jobs: Number(row.job_count),
    }));

    const total = daily.reduce((sum, day) => sum + day.cost, 0);
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

