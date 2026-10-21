// Manual subscription sync endpoint (for testing/recovery)
// Can be called to manually sync a user's subscription from purchase data
// Usage: POST with body: { userId: "test-user-123", tier: "popular", productId: "popular_monthly" }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query } from './_utils/db';
import { requireAuth } from './_utils/auth';
import { getCurrentMonthDate } from './_utils/usage';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;
/** Only reclaim via period match when within this window of the restored expiration. */
const PERIOD_RECLAIM_MAX_SEC = 3 * 24 * 60 * 60;

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function mintReclaimToken(donorUserId: string, fromUserId: string): string | null {
  if (!JWT_SECRET) return null;
  return jwt.sign(
    {
      userId: donorUserId,
      sub: donorUserId,
      purpose: 'reclaim',
      fromUserId,
    },
    JWT_SECRET,
    { expiresIn: '10m' },
  );
}

const TIER_RANK: Record<string, number> = {
  starter: 0,
  popular: 1,
  pro: 2,
};

function mapProductIdToTier(productId: string): string {
  const mapping: Record<string, string> = {
    'starter_monthly': 'starter',
    'popular_monthly': 'popular',
    'pro_monthly': 'pro',
  };
  
  const lower = productId.toLowerCase();
  if (lower.includes('starter')) return 'starter';
  if (lower.includes('popular')) return 'popular';
  if (lower.includes('pro')) return 'pro';
  
  return mapping[productId] || 'starter';
}

function tierRank(tier: string | null | undefined): number {
  return TIER_RANK[(tier || '').toLowerCase()] ?? -1;
}

async function writeUsageCount(userId: string, month: string, usage: number): Promise<void> {
  await query(
    `
      INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, month)
      DO UPDATE SET count = GREATEST(usage_tracking.count, EXCLUDED.count),
                    last_reset_at = NOW()
    `,
    [userId, month, usage],
  );
}

type UsageDonor = { usage: number; donorUserId: string };

/**
 * Reinstall + Play restore creates a *new* RC anonymous id (transfer), so RC-id
 * matching often misses the prior backend user. Find that donor by subscription
 * period/tier, copy usage onto the current user, and return donorUserId so the
 * client can switch JWT back to the original account.
 */
async function adoptPriorUsageIfSafe(opts: {
  userId: string;
  tier: string;
  periodEnd: Date;
  preferUserId?: string | null;
}): Promise<UsageDonor | null> {
  const month = getCurrentMonthDate();

  const adoptFrom = async (donorUserId: string, reason: string): Promise<UsageDonor | null> => {
    if (!donorUserId || donorUserId === opts.userId) return null;
    const preferred = await query<{ usage: number }>(
      `
        SELECT COALESCE(MAX(ut.count), 0)::int AS usage
        FROM usage_tracking ut
        WHERE ut.user_id = $1
      `,
      [donorUserId],
    );
    const usage = preferred.rows[0]?.usage ?? 0;
    if (usage <= 0) return null;
    await writeUsageCount(opts.userId, month, usage);
    console.log(
      `[sync-subscription] Adopted ${reason} usage ${usage} from ${donorUserId} onto ${opts.userId}`,
    );
    return { usage, donorUserId };
  };

  // 1) Explicit reclaim candidate (RC identity match).
  if (opts.preferUserId) {
    const preferred = await adoptFrom(opts.preferUserId, 'reclaim');
    if (preferred) return preferred;
  }

  // 2) Closest period_end on same tier — only if within PERIOD_RECLAIM_MAX_SEC
  //    (same Play sub after restore transfer). Never steal from an unrelated subscriber.
  const byPeriod = await query<{ id: string; usage: number; delta_sec: number }>(
    `
      SELECT u.id,
             COALESCE(MAX(ut.count), 0)::int AS usage,
             ABS(EXTRACT(EPOCH FROM (s.current_period_end - $3::timestamptz)))::float AS delta_sec
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN usage_tracking ut ON ut.user_id = u.id
      WHERE LOWER(s.tier) = LOWER($1)
        AND u.id::text <> $2
        AND s.current_period_end IS NOT NULL
        AND s.current_period_end > NOW() - INTERVAL '45 days'
        AND s.current_period_end < NOW() + INTERVAL '45 days'
      GROUP BY u.id, s.current_period_end
      HAVING COALESCE(MAX(ut.count), 0) > 0
      ORDER BY delta_sec ASC, COALESCE(MAX(ut.count), 0) DESC, u.created_at ASC
      LIMIT 1
    `,
    [opts.tier, opts.userId, opts.periodEnd.toISOString()],
  );
  if (byPeriod.rows[0] && byPeriod.rows[0].delta_sec <= PERIOD_RECLAIM_MAX_SEC) {
    const adopted = await adoptFrom(byPeriod.rows[0].id, 'period-closest');
    if (adopted) return adopted;
  } else if (byPeriod.rows[0]) {
    console.warn(
      `[sync-subscription] Closest period donor ${byPeriod.rows[0].id} delta=${Math.round(byPeriod.rows[0].delta_sec)}s exceeds ${PERIOD_RECLAIM_MAX_SEC}s — skip`,
    );
  }

  console.warn(
    `[sync-subscription] No prior usage donor for ${opts.userId} tier=${opts.tier}`,
  );
  return null;
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

  const authedUserId = requireAuth(req, res);
  if (!authedUserId) return;

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  // Ignore client-supplied userId — JWT is the only identity for sync.
  const userId = authedUserId;
  const revenuecatUserId = body.revenuecatUserId || body.revenuecat_user_id;
  const revenuecatAppUserId =
    body.revenuecatAppUserId || body.revenuecat_app_user_id || null;
  const tier = body.tier || (body.productId ? mapProductIdToTier(body.productId) : null);
  const productId = body.productId || body.productIdentifier;
  const expirationDate = body.expirationDate || body.expiresDate;
  const pendingFromClient = body.pendingTier
    ? mapProductIdToTier(String(body.pendingTier))
    : null;

  if (!tier) {
    return res.status(400).json({
      ok: false,
      error: 'tier or productId required'
    });
  }

  try {
    // Attach Pro to the JWT / client user so the current session sees subscription.
    // Separately find a reclaim candidate (older RC-linked account with usage).
    const identityIds = Array.from(
      new Set(
        [userId, revenuecatUserId, revenuecatAppUserId]
          .map((v) => (v == null ? '' : String(v).trim()))
          .filter(Boolean),
      ),
    );

    let dbUserId: string | null = null;
    const byJwt = await query<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE id::text = $1 OR revenuecat_user_id = $1
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [userId],
    );
    if (byJwt.rows.length > 0) {
      dbUserId = byJwt.rows[0].id;
    }

    if (!dbUserId) {
      const insertResult = await query<{ id: string }>(
        `
          INSERT INTO users (
            revenuecat_user_id,
            email,
            subscription_tier,
            subscription_status,
            billing_date
          )
          VALUES ($1, $2, $3, 'active', $4)
          RETURNING id
        `,
        [
          revenuecatUserId || revenuecatAppUserId || userId,
          body.email || null,
          tier,
          new Date().toISOString().slice(0, 10),
        ],
      );
      dbUserId = insertResult.rows[0].id;
    }

    let reclaimUserId: string | null = null;
    if (identityIds.length > 0) {
      const candidates = await query<{ id: string; usage: number }>(
        `
          SELECT u.id, COALESCE(MAX(ut.count), 0)::int AS usage
          FROM users u
          LEFT JOIN usage_tracking ut ON ut.user_id = u.id
          WHERE u.id::text = ANY($1::text[])
             OR u.revenuecat_user_id = ANY($1::text[])
          GROUP BY u.id
          ORDER BY COALESCE(MAX(ut.count), 0) DESC, u.created_at ASC
        `,
        [identityIds],
      );
      if (candidates.rows.length > 0) {
        reclaimUserId = candidates.rows[0].id;
      }
    }

    // Keep RevenueCat app user ID linked to the backend user (needed for webhooks)
    const rcLink = revenuecatUserId || revenuecatAppUserId;
    if (rcLink) {
      await query(
        `UPDATE users SET revenuecat_user_id = $1, updated_at = NOW() WHERE id = $2 AND (revenuecat_user_id IS NULL OR revenuecat_user_id = $1)`,
        [rcLink, dbUserId],
      );
    }

    // Calculate period end (expiration = next renewal date)
    let periodEnd: Date;
    if (expirationDate) {
      periodEnd = new Date(expirationDate);
      if (Number.isNaN(periodEnd.getTime())) {
        periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDay = new Date(periodEnd);
        endDay.setHours(0, 0, 0, 0);
        // If expiration is today or in the past, advance one billing month for display/storage
        if (endDay <= today) {
          periodEnd = new Date(periodEnd);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
      }
    } else {
      periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Update existing subscription for user, or create new one
    const existingSub = await query<{ id: string; tier: string }>(
      `SELECT id, tier FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [dbUserId]
    );

    let subscriptionId: string;
    let isTierChange = false;
    let isUpgrade = false;
    if (existingSub.rows.length > 0) {
      const currentTier = (existingSub.rows[0].tier || '').toLowerCase();
      const newTierLower = (tier || '').toLowerCase();
      isUpgrade = ['starter', 'popular', 'pro'].indexOf(newTierLower) > ['starter', 'popular', 'pro'].indexOf(currentTier);
      isTierChange = currentTier !== newTierLower;

      if (isTierChange) {
        if (isUpgrade) {
          // Upgrade: apply immediately (user paid for more, get it now)
          await query(
            `UPDATE subscriptions SET tier = $1, current_period_end = $2, pending_tier = NULL, updated_at = NOW() WHERE id = $3`,
            [tier, periodEnd, existingSub.rows[0].id]
          );
          await query(`UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2`, [tier, dbUserId]);
        } else {
          // Downgrade: defer to next cycle or usage depletion
          await query(
            `UPDATE subscriptions SET pending_tier = $1, current_period_end = $2, updated_at = NOW() WHERE id = $3`,
            [tier, periodEnd, existingSub.rows[0].id]
          );
        }
      } else {
        await query(
          `UPDATE subscriptions SET current_period_end = $1, updated_at = NOW() WHERE id = $2`,
          [periodEnd, existingSub.rows[0].id]
        );
      }

      if (
        pendingFromClient &&
        tierRank(pendingFromClient) < tierRank(existingSub.rows[0].tier)
      ) {
        await query(
          `UPDATE subscriptions SET pending_tier = $1, updated_at = NOW() WHERE id = $2`,
          [pendingFromClient, existingSub.rows[0].id]
        );
      }
      subscriptionId = existingSub.rows[0].id;
    } else {
      const insertResult = await query<{ id: string }>(
        `
          INSERT INTO subscriptions (user_id, revenuecat_subscription_id, platform, tier, status, current_period_start, current_period_end)
          VALUES ($1, $2, $3, $4, 'active', NOW(), $5)
          RETURNING id
        `,
        [dbUserId, `sync_${Date.now()}`, body.platform || 'manual', tier, periodEnd]
      );
      subscriptionId = insertResult.rows[0]?.id ?? '';
    }

    // Update user's subscription info (tier: only for upgrades or same-tier; downgrades stay deferred)
    const userTierToSet = (existingSub.rows.length > 0 && isTierChange && !isUpgrade)
      ? existingSub.rows[0].tier : tier;
    await query(
      `UPDATE users SET subscription_tier = $1, subscription_status = 'active', billing_date = $2, updated_at = NOW() WHERE id = $3`,
      [userTierToSet, periodEnd.toISOString().slice(0, 10), dbUserId]
    );

    // Ensure a usage row exists for new subs — never wipe an existing count.
    if (existingSub.rows.length === 0) {
      const currentMonth = getCurrentMonthDate();
      await query(
        `
          INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
          VALUES ($1, $2, 0, NOW())
          ON CONFLICT (user_id, month) DO NOTHING
        `,
        [dbUserId, currentMonth],
      );
    }

    // Close restore loophole: copy usage + point client at the prior account.
    const adopted = await adoptPriorUsageIfSafe({
      userId: dbUserId,
      tier,
      periodEnd,
      preferUserId: reclaimUserId,
    });
    const canonicalReclaimId =
      (adopted?.donorUserId && adopted.donorUserId !== dbUserId
        ? adopted.donorUserId
        : null) ||
      (reclaimUserId && reclaimUserId !== dbUserId ? reclaimUserId : null);

    const reclaimToken =
      canonicalReclaimId && JWT_SECRET
        ? mintReclaimToken(canonicalReclaimId, dbUserId)
        : null;

    return res.status(200).json({
      ok: true,
      message: 'Subscription synced successfully',
      subscription: {
        userId: dbUserId,
        reclaimUserId: canonicalReclaimId || undefined,
        reclaimToken: reclaimToken || undefined,
        tier,
        productId,
        periodEnd: periodEnd.toISOString(),
        subscriptionId,
        adoptedUsage: adopted?.usage ?? undefined,
      },
    });
  } catch (err: any) {
    console.error('[sync-subscription] Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to sync subscription',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
    });
  }
}
