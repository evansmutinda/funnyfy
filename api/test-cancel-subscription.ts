// Test endpoint to simulate subscription cancellation
// Simulates RevenueCat CANCELLATION webhook event
// Usage: POST /api/test-cancel-subscription with body: { userId: "test-user-123" }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

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

  // Allow in staging
  const isStaging = req.headers.host?.includes('staging') || 
                    process.env.VERCEL_URL?.includes('staging') ||
                    process.env.ALLOW_TEST_WEBHOOK === 'true';
  
  if (!isStaging && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ ok: false, error: 'Test endpoint disabled in production' });
  }

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const userId = body.userId || body.appUserId;

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId is required' });
  }

  try {
    // Find user's active subscription
    const subscriptionResult = await query<{
      id: string;
      user_id: string;
      tier: string;
      revenuecat_subscription_id: string;
    }>(
      `
        SELECT s.id, s.user_id, s.tier, s.revenuecat_subscription_id
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE (u.id::text = $1 OR u.revenuecat_user_id = $1)
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'No active subscription found for this user'
      });
    }

    const subscription = subscriptionResult.rows[0];

    // Mark subscription for cancellation at period end (user keeps access until then)
    await query(
      `
        UPDATE subscriptions
        SET cancel_at_period_end = TRUE,
            canceled_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `,
      [subscription.id]
    );

    // Log cancellation event
    await query(
      `
        INSERT INTO subscription_history (
          subscription_id, user_id, event_type,
          from_tier, to_tier, from_status, to_status, metadata
        )
        VALUES ($1, $2, 'canceled', $3, $3, 'active', 'active', $4)
      `,
      [
        subscription.id,
        subscription.user_id,
        subscription.tier,
        JSON.stringify({ test: true, canceledAt: new Date().toISOString() })
      ]
    );

    return res.status(200).json({
      ok: true,
      message: 'Subscription marked for cancellation at period end',
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        cancelAtPeriodEnd: true,
        canceledAt: new Date().toISOString()
      },
      note: 'User will keep access until current_period_end, then subscription will expire'
    });
  } catch (err: any) {
    console.error('[test-cancel-subscription] Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to cancel subscription',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
    });
  }
}

