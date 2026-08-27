import { query } from './db';

const TIER_QUOTAS: Record<string, number> = {
  starter: 50,
  popular: 100,
  pro: 250,
};

/** Calendar month key (local), avoids UTC shift from toISOString(). */
export function getCurrentMonthDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Credit exactly one generation for a completed job (idempotent per job_id).
 * Returns true if usage was incremented, false if already credited.
 */
export async function creditUsageForJob(jobId: string, userId: string): Promise<boolean> {
  const creditResult = await query<{ job_id: string }>(
    `
      INSERT INTO job_usage_credits (job_id)
      VALUES ($1)
      ON CONFLICT (job_id) DO NOTHING
      RETURNING job_id
    `,
    [jobId]
  );

  if (creditResult.rows.length === 0) {
    console.log(`[usage] Job ${jobId} already credited — skipping duplicate increment`);
    return false;
  }

  const currentMonth = getCurrentMonthDate();
  await query(
    `
      INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (user_id, month)
      DO UPDATE SET count = usage_tracking.count + 1
    `,
    [userId, currentMonth]
  );
  return true;
}

export function getTierQuota(tier: string | null | undefined): number {
  if (!tier) return 0;
  return TIER_QUOTAS[tier.toLowerCase()] || 0;
}

/**
 * Undo a usage credit for a job that was marked completed but later found unloadable/blank.
 * Safe to call multiple times (no-op if credit row already gone).
 */
export async function revokeUsageForJob(jobId: string, userId: string): Promise<boolean> {
  const creditResult = await query<{ job_id: string }>(
    `DELETE FROM job_usage_credits WHERE job_id = $1 RETURNING job_id`,
    [jobId]
  );

  if (creditResult.rows.length === 0) {
    return false;
  }

  const jobResult = await query<{ completed_at: string | null }>(
    `SELECT completed_at FROM jobs WHERE id = $1`,
    [jobId]
  );
  const completedAt = jobResult.rows[0]?.completed_at
    ? new Date(jobResult.rows[0].completed_at)
    : new Date();
  const month = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-01`;

  await query(
    `
      UPDATE usage_tracking
      SET count = GREATEST(0, count - 1)
      WHERE user_id = $1 AND month = $2
    `,
    [userId, month]
  );

  console.log(`[usage] Revoked credit for job ${jobId} (user ${userId})`);
  return true;
}

export { TIER_QUOTAS };
