// Test endpoint to simulate RevenueCat webhook events
// This allows testing the subscription flow without making real purchases
// Usage: POST /api/test-revenuecat-webhook with body: { userId: "test-user-123", tier: "starter" }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Map tier to product ID (for testing)
function tierToProductId(tier: string): string {
  const mapping: Record<string, string> = {
    'starter': 'starter_monthly',
    'popular': 'popular_monthly',
    'pro': 'pro_monthly',
  };
  return mapping[tier.toLowerCase()] || 'starter_monthly';
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

  // Only allow in development/staging (add auth check in production)
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_WEBHOOK) {
    return res.status(403).json({ ok: false, error: 'Test endpoint disabled in production' });
  }

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const userId = body.userId || body.appUserId;
  const tier = body.tier || 'starter';

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId is required' });
  }

  const productId = tierToProductId(tier);
  const platform = body.platform || 'test';

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

    // Calculate period end (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

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
      [dbUserId, `test_sub_${Date.now()}`, platform, tier, periodEnd]
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

    // Reset usage for new subscription (create fresh usage_tracking entry)
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
      message: 'Test subscription created successfully',
      subscription: {
        userId: dbUserId,
        tier,
        productId,
        periodEnd: periodEnd.toISOString(),
        subscriptionId
      }
    });
  } catch (err: any) {
    console.error('[test-revenuecat-webhook] Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create test subscription',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
    });
  }
}

