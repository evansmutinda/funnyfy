// RevenueCat webhook handler
// Receives subscription events from RevenueCat and syncs to database

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db';
import crypto from 'crypto';
import { setSecurityHeaders, safeErrorResponse, getClientIp } from '../utils/security';
import { logSecurityEventFromRequest } from '../utils/security-logging';
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

  // Log history with event ID for idempotency
  await logSubscriptionEvent(subscriptionId, userId, 'created', null, tier, null, 'active', {
    productId,
    platform,
    eventId, // Store event ID for idempotency check
  });
}

async function handleRenewal(event: any, eventId: string) {
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
    subscription.tier, subscription.tier, 'active', 'active', {
      eventId, // Store event ID for idempotency check
    });
}

async function handleCancellation(event: any, eventId: string) {
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
