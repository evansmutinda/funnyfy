// RevenueCat webhook handler
// Receives subscription events from RevenueCat and syncs to database

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import crypto from 'crypto';

const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

// Verify webhook signature (RevenueCat sends Authorization header)
function verifyWebhookSignature(authHeader: string | undefined, body: string): boolean {
  if (!REVENUECAT_WEBHOOK_SECRET) {
    console.warn('[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET not set, skipping verification');
    return true; // Allow in development if secret not set
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const signature = authHeader.replace('Bearer ', '');
  const expectedSignature = crypto
    .createHmac('sha256', REVENUECAT_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Map RevenueCat product ID to tier
function mapProductIdToTier(productId: string): string {
  const mapping: Record<string, string> = {
    'starter_monthly': 'starter',
    'popular_monthly': 'popular',
    'pro_monthly': 'pro',
    // Add more mappings as needed
  };
  
  // Try exact match first
  if (mapping[productId]) {
    return mapping[productId];
  }
  
  // Try partial match (e.g., "com.funnyfy.starter" -> "starter")
  const lower = productId.toLowerCase();
  if (lower.includes('starter')) return 'starter';
  if (lower.includes('popular')) return 'popular';
  if (lower.includes('pro')) return 'pro';
  
  return 'starter'; // Default fallback
}

// Log subscription event to history
async function logSubscriptionEvent(
  subscriptionId: string | null,
  userId: string,
  eventType: string,
  fromTier: string | null,
  toTier: string | null,
  fromStatus: string | null,
  toStatus: string | null,
  metadata: Record<string, any> = {}
) {
  try {
    await query(
      `
        INSERT INTO subscription_history (
          subscription_id, user_id, event_type,
          from_tier, to_tier, from_status, to_status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [subscriptionId, userId, eventType, fromTier, toTier, fromStatus, toStatus, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[revenuecat-webhook] Failed to log subscription event:', err);
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Get raw body for signature verification
  const rawBody = typeof req.body === 'string' 
    ? req.body 
    : JSON.stringify(req.body);

  // Verify webhook signature
  const authHeader = req.headers['authorization'] as string | undefined;
  if (!verifyWebhookSignature(authHeader, rawBody)) {
    console.error('[revenuecat-webhook] Invalid signature');
    return res.status(401).json({ ok: false, error: 'Invalid signature' });
  }

  let event: any;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const eventType = event.type || event.event?.type;
  console.log(`[revenuecat-webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(event);
        break;
      case 'RENEWAL':
        await handleRenewal(event);
        break;
      case 'CANCELLATION':
        await handleCancellation(event);
        break;
      case 'UNCANCELLATION':
        await handleUncancellation(event);
        break;
      case 'EXPIRATION':
        await handleExpiration(event);
        break;
      default:
        console.log(`[revenuecat-webhook] Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ ok: true, received: true });
  } catch (err: any) {
    console.error(`[revenuecat-webhook] Error processing ${eventType}:`, err);
    return res.status(500).json({ 
      ok: false, 
      error: 'Webhook processing failed',
      detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
    });
  }
}

async function handleInitialPurchase(event: any) {
  const customerInfo = event.event?.customer_info || event.customer_info;
  const productId = event.event?.product_id || event.product_id;
  const appUserId = customerInfo?.original_app_user_id;
  const platform = event.event?.store || event.store || 'unknown';

  if (!appUserId || !productId) {
    throw new Error('Missing app_user_id or product_id');
  }

  // Find or create user
  let userResult = await query<{ id: string; email: string | null }>(
    `
      SELECT id, email
      FROM users
      WHERE revenuecat_user_id = $1 OR id::text = $1
    `,
    [appUserId]
  );

  let userId: string;
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
        appUserId,
        customerInfo?.email || null,
        mapProductIdToTier(productId),
        new Date().toISOString().slice(0, 10) // billing_date
      ]
    );
    userId = insertResult.rows[0].id;
  } else {
    userId = userResult.rows[0].id;
    // Update user with RevenueCat ID if missing
    if (!userResult.rows[0].email && customerInfo?.email) {
      await query(
        `UPDATE users SET email = $1 WHERE id = $2`,
        [customerInfo.email, userId]
      );
    }
  }

  // Create subscription
  const tier = mapProductIdToTier(productId);
  const entitlement = customerInfo?.entitlements?.active?.[productId] || 
                     customerInfo?.entitlements?.all?.[productId];
  const periodEnd = entitlement?.expires_date 
    ? new Date(entitlement.expires_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days

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
    [userId, event.event?.id || event.id || `sub_${Date.now()}`, platform, tier, periodEnd]
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
    [tier, periodEnd.toISOString().slice(0, 10), userId]
  );

  // Log history
  await logSubscriptionEvent(subscriptionId, userId, 'created', null, tier, null, 'active', {
    productId,
    platform
  });
}

async function handleRenewal(event: any) {
  const revenuecatSubId = event.event?.id || event.subscription_id;
  if (!revenuecatSubId) {
    throw new Error('Missing subscription_id');
  }

  const subscriptionResult = await query<{ id: string; user_id: string; tier: string }>(
    `
      SELECT id, user_id, tier
      FROM subscriptions
      WHERE revenuecat_subscription_id = $1
    `,
    [revenuecatSubId]
  );

  if (subscriptionResult.rows.length === 0) {
    console.warn(`[revenuecat-webhook] Renewal: subscription not found: ${revenuecatSubId}`);
    return;
  }

  const subscription = subscriptionResult.rows[0];
  const customerInfo = event.event?.customer_info || event.customer_info;
  const entitlement = customerInfo?.entitlements?.active?.[Object.keys(customerInfo?.entitlements?.active || {})[0]];
  const periodEnd = entitlement?.expires_date 
    ? new Date(entitlement.expires_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Update subscription
  await query(
    `
      UPDATE subscriptions
      SET current_period_end = $1,
          updated_at = NOW()
      WHERE id = $2
    `,
    [periodEnd, subscription.id]
  );

  // Update user billing_date
  await query(
    `
      UPDATE users
      SET billing_date = $1,
          updated_at = NOW()
      WHERE id = $2
    `,
    [periodEnd.toISOString().slice(0, 10), subscription.user_id]
  );

  // Reset usage quota for new billing period
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  await query(
    `
      INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
      VALUES ($1, $2, 0, NOW())
      ON CONFLICT (user_id, month)
      DO UPDATE SET count = 0, last_reset_at = NOW()
    `,
    [subscription.user_id, currentMonth]
  );

  await logSubscriptionEvent(subscription.id, subscription.user_id, 'renewed', 
    subscription.tier, subscription.tier, 'active', 'active', {});
}

async function handleCancellation(event: any) {
  const revenuecatSubId = event.event?.id || event.subscription_id;
  if (!revenuecatSubId) {
    throw new Error('Missing subscription_id');
  }

  const subscriptionResult = await query<{ id: string; user_id: string; tier: string }>(
    `
      SELECT id, user_id, tier
      FROM subscriptions
      WHERE revenuecat_subscription_id = $1
    `,
    [revenuecatSubId]
  );

  if (subscriptionResult.rows.length === 0) {
    console.warn(`[revenuecat-webhook] Cancellation: subscription not found: ${revenuecatSubId}`);
    return;
  }

  const subscription = subscriptionResult.rows[0];

  // Mark for cancellation at period end (user keeps access until then)
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

  await logSubscriptionEvent(subscription.id, subscription.user_id, 'canceled',
    subscription.tier, subscription.tier, 'active', 'active', {});
}

async function handleUncancellation(event: any) {
  const revenuecatSubId = event.event?.id || event.subscription_id;
  if (!revenuecatSubId) {
    throw new Error('Missing subscription_id');
  }

  const subscriptionResult = await query<{ id: string; user_id: string }>(
    `
      SELECT id, user_id
      FROM subscriptions
      WHERE revenuecat_subscription_id = $1
    `,
    [revenuecatSubId]
  );

  if (subscriptionResult.rows.length === 0) {
    return;
  }

  const subscription = subscriptionResult.rows[0];

  // Remove cancellation flag
  await query(
    `
      UPDATE subscriptions
      SET cancel_at_period_end = FALSE,
          canceled_at = NULL,
          status = 'active',
          updated_at = NOW()
      WHERE id = $1
    `,
    [subscription.id]
  );

  await logSubscriptionEvent(subscription.id, subscription.user_id, 'uncanceled',
    null, null, 'active', 'active', {});
}

async function handleExpiration(event: any) {
  const revenuecatSubId = event.event?.id || event.subscription_id;
  if (!revenuecatSubId) {
    throw new Error('Missing subscription_id');
  }

  const subscriptionResult = await query<{ id: string; user_id: string; tier: string }>(
    `
      SELECT id, user_id, tier
      FROM subscriptions
      WHERE revenuecat_subscription_id = $1
    `,
    [revenuecatSubId]
  );

  if (subscriptionResult.rows.length === 0) {
    return;
  }

  const subscription = subscriptionResult.rows[0];

  // Mark subscription as expired
  await query(
    `
      UPDATE subscriptions
      SET status = 'expired',
          updated_at = NOW()
      WHERE id = $1
    `,
    [subscription.id]
  );

  // Update user status
  await query(
    `
      UPDATE users
      SET subscription_status = 'expired',
          updated_at = NOW()
      WHERE id = $1
    `,
    [subscription.user_id]
  );

  await logSubscriptionEvent(subscription.id, subscription.user_id, 'expired',
    subscription.tier, subscription.tier, 'active', 'expired', {});
}
