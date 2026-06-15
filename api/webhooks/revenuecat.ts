// RevenueCat webhook handler
// Receives subscription events from RevenueCat and syncs to database

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_utils/db';
import crypto from 'crypto';
import { setSecurityHeaders, safeErrorResponse, getClientIp } from '../_utils/security';
import { logSecurityEventFromRequest } from '../_utils/security-logging';
import { z } from 'zod';

const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

// Webhook event schema validation
const webhookEventSchema = z.object({
  type: z.string().optional(),
  event: z.object({
    type: z.string(),
    id: z.string().optional(),
    product_id: z.string().optional(),
    customer_info: z.any().optional(),
  }).optional(),
  customer_info: z.any().optional(),
  product_id: z.string().optional(),
  subscription_id: z.string().optional(),
  store: z.string().optional(),
});

// Verify webhook auth header from RevenueCat.
// In RevenueCat, you configure an Authorization header value (e.g. `Bearer <secret>`).
// We compare that value to the shared secret from REVENUECAT_WEBHOOK_SECRET.
function verifyWebhookSignature(authHeader: string | string[] | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!REVENUECAT_WEBHOOK_SECRET) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.warn('[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET not set, allowing in development');
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Webhook secret not configured',
    };
  }

  if (!authHeader) {
    return {
      valid: false,
      error: 'Missing Authorization header',
    };
  }

  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!headerValue) {
    return {
      valid: false,
      error: 'Invalid Authorization header format',
    };
  }

  const candidate = headerValue.trim();
  const bare = REVENUECAT_WEBHOOK_SECRET;
  const bearer = `Bearer ${REVENUECAT_WEBHOOK_SECRET}`;

  const safeEquals = (a: string, b: string) => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  };

  const isValid = safeEquals(candidate, bare) || safeEquals(candidate, bearer);
  
  return {
    valid: isValid,
    error: isValid ? undefined : 'Invalid webhook signature',
  };
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
  // Set security headers
  setSecurityHeaders(res);

  // Only allow POST
  if (req.method !== 'POST') {
    return safeErrorResponse(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST method allowed');
  }

  // Get client IP for logging
  const clientIp = getClientIp(req);

  // Verify webhook auth header matches our shared secret
  const authHeader = req.headers['authorization'];
  const signatureCheck = verifyWebhookSignature(authHeader);
  
  if (!signatureCheck.valid) {
    await logSecurityEventFromRequest(req, 'webhook_auth_failed', false, {
      error: signatureCheck.error,
    });
    return safeErrorResponse(res, 401, 'INVALID_SIGNATURE', signatureCheck.error || 'Invalid webhook signature');
  }

  // Parse and validate event
  let event: any;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    await logSecurityEventFromRequest(req, 'webhook_parse_error', false, {
      error: String(err),
    });
    return safeErrorResponse(res, 400, 'INVALID_JSON', 'Invalid JSON in request body');
  }

  // Validate event structure
  const validation = webhookEventSchema.safeParse(event);
  if (!validation.success) {
    await logSecurityEventFromRequest(req, 'webhook_validation_failed', false, {
      errors: validation.error.errors,
    });
    return safeErrorResponse(res, 400, 'INVALID_EVENT_FORMAT', 'Event structure validation failed');
  }

  const eventType = event.type || event.event?.type;
  if (!eventType) {
    return safeErrorResponse(res, 400, 'MISSING_EVENT_TYPE', 'Event type is required');
  }

  console.log(`[revenuecat-webhook] Received event: ${eventType} from ${clientIp}`);
  
  // Log successful authentication
  await logSecurityEventFromRequest(req, 'webhook_received', true, {
    eventType,
  });

  // Check for duplicate processing (idempotency)
  const eventId = event.event?.id || event.id || `${eventType}_${Date.now()}`;
  try {
    // Check if we've already processed this event
    const existingEvent = await query<{ id: string }>(
      `
        SELECT id FROM subscription_history
        WHERE metadata->>'eventId' = $1
        LIMIT 1
      `,
      [eventId]
    );

    if (existingEvent.rows.length > 0) {
      console.log(`[revenuecat-webhook] Event ${eventId} already processed, skipping`);
      return res.status(200).json({ 
        ok: true, 
        received: true,
        message: 'Event already processed',
      });
    }
  } catch (idempotencyErr) {
    console.error('[revenuecat-webhook] Idempotency check failed:', idempotencyErr);
    await logSecurityEventFromRequest(req, 'webhook_idempotency_check_failed', false, {
      error: String(idempotencyErr),
    });
    // Continue processing (fail open)
  }

  try {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(event, eventId);
        break;
      case 'RENEWAL':
        await handleRenewal(event, eventId);
        break;
      case 'CANCELLATION':
        await handleCancellation(event, eventId);
        break;
      case 'UNCANCELLATION':
        await handleUncancellation(event, eventId);
        break;
      case 'EXPIRATION':
        await handleExpiration(event, eventId);
        break;
      case 'PRODUCT_CHANGE':
        await handleProductChange(event, eventId);
        break;
      default:
        console.log(`[revenuecat-webhook] Unhandled event type: ${eventType}`);
        await logSecurityEventFromRequest(req, 'webhook_unhandled_event', true, {
          eventType,
          eventId,
        });
    }

    await logSecurityEventFromRequest(req, 'webhook_processed', true, {
      eventType,
      eventId,
    });

    return res.status(200).json({ ok: true, received: true });
  } catch (err: any) {
    console.error(`[revenuecat-webhook] Error processing ${eventType}:`, err);
    
    await logSecurityEventFromRequest(req, 'webhook_processing_error', false, {
      eventType,
      eventId,
      error: String(err?.message || err),
    });

    return safeErrorResponse(
      res,
      500,
      'WEBHOOK_PROCESSING_FAILED',
      process.env.NODE_ENV === 'development' ? String(err?.message || err) : 'Webhook processing failed'
    );
  }
}

async function handleInitialPurchase(event: any, eventId: string) {
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
  const ev = event.event || event;
  // Use expiration_at_ms from event (next renewal) - NOT purchased_at or entitlement
  const periodEnd = ev?.expiration_at_ms
    ? new Date(ev.expiration_at_ms)
    : (() => {
        const ent = customerInfo?.entitlements?.active?.[productId] || 
                    Object.values(customerInfo?.entitlements?.active || {})[0] as any;
        return ent?.expires_date ? new Date(ent.expires_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      })();

  // Use original_transaction_id (stable across renewals) for subscription matching - NOT event.id
  const stableSubId = ev?.original_transaction_id || ev?.transaction_id || eventId;
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
    [userId, stableSubId, platform, tier, periodEnd]
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

  // Log history with event ID for idempotency
  await logSubscriptionEvent(subscriptionId, userId, 'created', null, tier, null, 'active', {
    productId,
    platform,
    eventId, // Store event ID for idempotency check
  });
}

async function handleRenewal(event: any, eventId: string) {
  const ev = event.event || event;
  const stableSubId = ev?.original_transaction_id || ev?.transaction_id || event.subscription_id;
  const appUserId = ev?.app_user_id || event.event?.customer_info?.original_app_user_id;
  const productId = ev?.product_id || event.product_id;

  if (!stableSubId && !appUserId) {
    throw new Error('Missing original_transaction_id or app_user_id');
  }

  let subscriptionResult: { rows: Array<{ id: string; user_id: string; tier: string; pending_tier?: string | null }> } = { rows: [] };
  if (stableSubId) {
    try {
      subscriptionResult = await query(
        `SELECT id, user_id, tier, pending_tier FROM subscriptions WHERE revenuecat_subscription_id = $1 AND status = 'active'`,
        [stableSubId]
      );
    } catch {
      subscriptionResult = await query(
        `SELECT id, user_id, tier FROM subscriptions WHERE revenuecat_subscription_id = $1 AND status = 'active'`,
        [stableSubId]
      );
    }
  }
  if (subscriptionResult.rows.length === 0 && appUserId) {
    try {
      subscriptionResult = await query(
        `SELECT s.id, s.user_id, s.tier, s.pending_tier FROM subscriptions s
         JOIN users u ON u.id = s.user_id
         WHERE (u.revenuecat_user_id = $1 OR u.id::text = $1) AND s.status = 'active'
         ORDER BY s.created_at DESC LIMIT 1`,
        [appUserId]
      );
    } catch {
      subscriptionResult = await query(
        `SELECT s.id, s.user_id, s.tier FROM subscriptions s
         JOIN users u ON u.id = s.user_id
         WHERE (u.revenuecat_user_id = $1 OR u.id::text = $1) AND s.status = 'active'
         ORDER BY s.created_at DESC LIMIT 1`,
        [appUserId]
      );
    }
  }

  if (subscriptionResult.rows.length === 0) {
    console.warn(`[revenuecat-webhook] Renewal: subscription not found for ${stableSubId || appUserId}`);
    return;
  }

  const subscription = subscriptionResult.rows[0];
  const periodEnd = ev?.expiration_at_ms
    ? new Date(ev.expiration_at_ms)
    : (() => {
        const customerInfo = event.event?.customer_info || event.customer_info;
        const entitlement = Object.values(customerInfo?.entitlements?.active || {})[0] as any;
        return entitlement?.expires_date ? new Date(entitlement.expires_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      })();

  const sub = subscription as { pending_tier?: string | null };
  const newTier = sub.pending_tier || (productId ? mapProductIdToTier(productId) : subscription.tier);

  try {
    await query(
      `UPDATE subscriptions SET tier = $1, current_period_end = $2, pending_tier = NULL, updated_at = NOW() WHERE id = $3`,
      [newTier, periodEnd, subscription.id]
    );
  } catch {
    await query(
      `UPDATE subscriptions SET tier = $1, current_period_end = $2, updated_at = NOW() WHERE id = $3`,
      [newTier, periodEnd, subscription.id]
    );
  }

  await query(
    `UPDATE users SET subscription_tier = $1, billing_date = $2, updated_at = NOW() WHERE id = $3`,
    [newTier, periodEnd.toISOString().slice(0, 10), subscription.user_id]
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
    subscription.tier, subscription.tier, 'active', 'active', {
      eventId, // Store event ID for idempotency check
    });
}

async function handleProductChange(event: any, eventId: string) {
  const ev = event.event || event;
  const newProductId = ev?.new_product_id || ev?.product_id;
  const appUserId = ev?.app_user_id || event.event?.customer_info?.original_app_user_id;
  const stableSubId = ev?.original_transaction_id || ev?.transaction_id;

  if (!newProductId || !appUserId) {
    console.warn('[revenuecat-webhook] PRODUCT_CHANGE: missing new_product_id or app_user_id');
    return;
  }

  const newTier = mapProductIdToTier(newProductId);

  const subResult = await query<{ id: string; user_id: string }>(
    stableSubId
      ? `SELECT id, user_id FROM subscriptions WHERE revenuecat_subscription_id = $1 AND status = 'active' LIMIT 1`
      : `SELECT s.id, s.user_id FROM subscriptions s JOIN users u ON u.id = s.user_id
         WHERE (u.revenuecat_user_id = $1 OR u.id::text = $1) AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1`,
    [stableSubId || appUserId]
  );

  if (subResult.rows.length === 0) {
    console.warn(`[revenuecat-webhook] PRODUCT_CHANGE: subscription not found for ${appUserId}`);
    return;
  }

  const sub = subResult.rows[0];
  await query(
    `UPDATE subscriptions SET pending_tier = $1, updated_at = NOW() WHERE id = $2`,
    [newTier, sub.id]
  );

  await logSubscriptionEvent(sub.id, sub.user_id, 'product_change', null, newTier, 'active', 'active', {
    eventId,
    new_product_id: newProductId,
    note: 'Tier change takes effect next cycle or on usage depletion',
  });
}

async function handleCancellation(event: any, eventId: string) {
  const ev = event.event || event;
  const stableSubId = ev?.original_transaction_id || ev?.transaction_id || ev?.id || event.subscription_id;
  const appUserId = ev?.app_user_id || event.event?.customer_info?.original_app_user_id;

  if (!stableSubId && !appUserId) {
    throw new Error('Missing subscription identifier');
  }

  let subscriptionResult: { rows: Array<{ id: string; user_id: string; tier: string }> } = { rows: [] };
  if (stableSubId) {
    subscriptionResult = await query<{ id: string; user_id: string; tier: string }>(
      `SELECT id, user_id, tier FROM subscriptions WHERE revenuecat_subscription_id = $1`,
      [stableSubId]
    );
  }
  if (subscriptionResult.rows.length === 0 && appUserId) {
    subscriptionResult = await query<{ id: string; user_id: string; tier: string }>(
      `SELECT s.id, s.user_id, s.tier FROM subscriptions s JOIN users u ON u.id = s.user_id
       WHERE (u.revenuecat_user_id = $1 OR u.id::text = $1) AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1`,
      [appUserId]
    );
  }

  if (subscriptionResult.rows.length === 0) {
    console.warn(`[revenuecat-webhook] Cancellation: subscription not found`);
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
    subscription.tier, subscription.tier, 'active', 'active', {
      eventId, // Store event ID for idempotency check
    });
}

async function handleUncancellation(event: any, eventId: string) {
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
    null, null, 'active', 'active', {
      eventId, // Store event ID for idempotency check
    });
}

async function handleExpiration(event: any, eventId: string) {
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
    subscription.tier, subscription.tier, 'active', 'expired', {
      eventId, // Store event ID for idempotency check
    });
}
