// Manual subscription sync endpoint (for testing/recovery)
// Can be called to manually sync a user's subscription from purchase data
// Usage: POST with body: { userId: "test-user-123", tier: "popular", productId: "popular_monthly" }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Map product ID to tier (same as webhook)
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

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const userId = (req.headers['x-user-id'] as string) || body.userId;
  const tier = body.tier || (body.productId ? mapProductIdToTier(body.productId) : null);
  const productId = body.productId || body.productIdentifier;
  const expirationDate = body.expirationDate || body.expiresDate;

  if (!userId) {
    return res.status(400).json({
      ok: false,
      error: 'userId required'
    });
  }

  if (!tier) {
    return res.status(400).json({
      ok: false,
      error: 'tier or productId required'
    });
  }

  try {
    // Find or create user
    let userResult = await query<{ id: string; email: string | null }>(
      `
        SELECT id, email
        FROM users
        WHERE id::text = $1 OR revenuecat_user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    let dbUserId: string;
    if (userResult.rows.length === 0) {
      // Create new user
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
          userId,
          body.email || null,
          tier,
          new Date().toISOString().slice(0, 10)
        ]
      );
      dbUserId = insertResult.rows[0].id;
    } else {
      dbUserId = userResult.rows[0].id;
    }

    // Calculate period end
    let periodEnd: Date;
    if (expirationDate) {
      periodEnd = new Date(expirationDate);
    } else {
      periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30); // Default 30 days
    }

    // Create/update subscription
    const subscriptionResult = await query<{ id: string }>(
      `
        INSERT INTO subscriptions (
          user_id, revenuecat_subscription_id, platform, tier, status,
          current_period_start, current_period_end
        )
        VALUES ($1, $2, $3, $4, 'active', NOW(), $5)
        ON CONFLICT (revenuecat_subscription_id) 
        DO UPDATE SET
          status = 'active',
          tier = $4,
          current_period_end = $5,
          cancel_at_period_end = FALSE,
          canceled_at = NULL,
          updated_at = NOW()
        RETURNING id
      `,
      [dbUserId, `sync_${Date.now()}`, body.platform || 'manual', tier, periodEnd]
    );

    const subscriptionId = subscriptionResult.rows[0]?.id;

    // Update user's subscription info
    await query(
      `
        UPDATE users
        SET subscription_tier = $1,
            subscription_status = 'active',
            billing_date = $2,
            updated_at = NOW()
        WHERE id = $3
      `,
      [tier, periodEnd.toISOString().slice(0, 10), dbUserId]
    );

    // Reset usage for new subscription
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    await query(
      `
        INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
        VALUES ($1, $2, 0, NOW())
        ON CONFLICT (user_id, month)
        DO UPDATE SET count = 0, last_reset_at = NOW()
      `,
      [dbUserId, currentMonth]
    );

    return res.status(200).json({
      ok: true,
      message: 'Subscription synced successfully',
      subscription: {
        userId: dbUserId,
        tier,
        productId,
        periodEnd: periodEnd.toISOString(),
        subscriptionId
      }
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
