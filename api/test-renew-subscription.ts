// Test endpoint to simulate subscription renewal
// Simulates RevenueCat RENEWAL webhook event
// Usage: POST /api/test-renew-subscription with body: { userId: "test-user-123" }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function getCurrentMonthDate(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
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
    // Find user's subscription (even if canceled, we'll renew it)
    const subscriptionResult = await query<{
      id: string;
      user_id: string;
      tier: string;
      revenuecat_subscription_id: string;
      current_period_end: string;
    }>(
      `
        SELECT s.id, s.user_id, s.tier, s.revenuecat_subscription_id, s.current_period_end
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE (u.id::text = $1 OR u.revenuecat_user_id = $1)
        ORDER BY s.created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'No subscription found for this user'
      });
    }

    const subscription = subscriptionResult.rows[0];

    // Calculate new period end (30 days from current period end, or 30 days from now if expired)
    const currentPeriodEnd = new Date(subscription.current_period_end);
    const now = new Date();
    const newPeriodEnd = currentPeriodEnd > now
      ? new Date(currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from current end
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now if expired

    // Update subscription - renew it
    await query(
      `
        UPDATE subscriptions
        SET status = 'active',
            current_period_end = $1,
            cancel_at_period_end = FALSE,
            canceled_at = NULL,
            updated_at = NOW()
        WHERE id = $2
      `,
      [newPeriodEnd, subscription.id]
    );

    // Update user billing_date
    await query(
      `
        UPDATE users
        SET subscription_status = 'active',
            billing_date = $1,
            updated_at = NOW()
        WHERE id = $2
      `,
      [newPeriodEnd.toISOString().slice(0, 10), subscription.user_id]
    );

    // Reset usage quota for new billing period
    const currentMonth = getCurrentMonthDate();
    await query(
      `
        INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
        VALUES ($1, $2, 0, NOW())
        ON CONFLICT (user_id, month)
        DO UPDATE SET count = 0, last_reset_at = NOW()
      `,
      [subscription.user_id, currentMonth]
    );

    // Log renewal event
    await query(
      `
        INSERT INTO subscription_history (
          subscription_id, user_id, event_type,
          from_tier, to_tier, from_status, to_status, metadata
        )
        VALUES ($1, $2, 'renewed', $3, $3, 'active', 'active', $4)
      `,
      [
        subscription.id,
        subscription.user_id,
        subscription.tier,
        JSON.stringify({ 
          test: true, 
          renewedAt: new Date().toISOString(),
          newPeriodEnd: newPeriodEnd.toISOString()
        })
      ]
    );

    return res.status(200).json({
      ok: true,
      message: 'Subscription renewed successfully',
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: 'active',
        newPeriodEnd: newPeriodEnd.toISOString(),
        cancelAtPeriodEnd: false
      },
      usage: {
        reset: true,
        month: currentMonth,
        count: 0
      }
    });
  } catch (err: any) {
    console.error('[test-renew-subscription] Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to renew subscription',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
    });
  }
}

