// Production endpoint to cancel a subscription at period end
// User keeps access until the end of their current billing period

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
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

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const userId = body.userId || req.headers['x-user-id'];

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId is required' });
  }

  try {
    const subscriptionResult = await query<{
      id: string;
      user_id: string;
      tier: string;
    }>(
      `SELECT s.id, s.user_id, s.tier
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE (u.id::text = $1 OR u.revenuecat_user_id = $1)
       AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'No active subscription found' });
    }

    const subscription = subscriptionResult.rows[0];

    await query(
      `UPDATE subscriptions
       SET cancel_at_period_end = TRUE, canceled_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [subscription.id]
    );

    await query(
      `INSERT INTO subscription_history (
         subscription_id, user_id, event_type,
         from_tier, to_tier, from_status, to_status, metadata
       ) VALUES ($1, $2, 'canceled', $3, $3, 'active', 'active', $4)`,
      [
        subscription.id,
        subscription.user_id,
        subscription.tier,
        JSON.stringify({ canceledAt: new Date().toISOString() }),
      ]
    );

    return res.status(200).json({
      ok: true,
      message: 'Subscription will cancel at end of billing period',
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        cancelAtPeriodEnd: true,
      },
    });
  } catch (err: any) {
    console.error('[cancel-subscription] Error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to cancel subscription' });
  }
}
