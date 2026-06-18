import { query } from './db';

const TRIAL_LIMIT = 3;

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

async function hasActiveSubscription(userId: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM subscriptions
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );
  return result.rows.length > 0;
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

  const subscribed = await hasActiveSubscription(userId);

  if (subscribed) {
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

  const userResult = await query<{
    subscription_status: string;
    trial_generations_used: number;
  }>(
    `
      SELECT subscription_status, trial_generations_used
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  if (userResult.rows.length === 0) {
    return false;
  }

  const { subscription_status: subscriptionStatus, trial_generations_used: trialUsed } = userResult.rows[0];
  const trialGenerationsUsed = trialUsed ?? 0;
  const isTrialUser =
    subscriptionStatus === 'trial' ||
    (subscriptionStatus !== 'active' && trialGenerationsUsed < TRIAL_LIMIT);

  if (isTrialUser) {
    await query(
      `
        UPDATE users
        SET trial_generations_used = trial_generations_used + 1
        WHERE id = $1
      `,
      [userId]
    );
    return true;
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

export { TRIAL_LIMIT, TIER_QUOTAS };
