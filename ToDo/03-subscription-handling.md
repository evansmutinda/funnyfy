# Subscription Data Collection and Handling - Architectural Plan

**Status**: Planning  
**Priority**: Critical (Required for Launch)  
**Last Updated**: January 2025

---

## Overview

This document outlines the architecture for handling subscriptions, payments, and user billing for FunnyFy. Following industry best practices for SaaS subscription management.

---

## Objectives

1. **Payment Processing**: Secure, reliable payment handling
2. **Subscription Management**: Create, update, cancel subscriptions
3. **Billing Automation**: Automatic renewals, prorations, invoicing
4. **Usage Tracking**: Track and enforce subscription limits
5. **Revenue Recognition**: Accurate revenue tracking and reporting

---

## Industry Standard Solutions

### Recommended: RevenueCat (Mobile-First)

**Why RevenueCat?**
- ✅ Built specifically for mobile apps
- ✅ Handles App Store & Google Play billing
- ✅ Cross-platform (iOS + Android)
- ✅ Webhooks for server-side sync
- ✅ Free tier available (up to $10k MRR)
- ✅ Industry standard for mobile SaaS

**Pricing**: Free up to $10k MRR, then 1% of revenue

### Alternative: Stripe (Web-First)

**Why Stripe?**
- ✅ Industry leader for web subscriptions
- ✅ More flexible for custom flows
- ✅ Better for web apps
- ✅ More complex setup for mobile

**Pricing**: 2.9% + $0.30 per transaction

### Hybrid Approach (Recommended)

- **Mobile**: RevenueCat (handles App Store/Play Store)
- **Web Admin**: Stripe (if needed later)
- **Backend**: Sync both via webhooks

---

## Architecture Overview

```
Mobile App → RevenueCat SDK → App Store/Google Play
                ↓
         RevenueCat Webhooks → Vercel API → Database
                ↓
         Sync Subscription Status
```

---

## Database Schema

### `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  revenuecat_user_id VARCHAR(255) UNIQUE, -- RevenueCat customer ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `subscriptions` Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  revenuecat_subscription_id VARCHAR(255) UNIQUE,
  platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  tier VARCHAR(20) NOT NULL, -- 'starter', 'popular', 'pro'
  status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired', 'trial'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

### `subscription_history` Table (Audit Trail)
```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  event_type VARCHAR(50) NOT NULL, -- 'created', 'renewed', 'canceled', 'upgraded', 'downgraded'
  from_tier VARCHAR(20),
  to_tier VARCHAR(20),
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `payments` Table (Optional - for tracking)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  revenuecat_transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  platform VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## RevenueCat Integration

### 1. Mobile App Setup

#### Install SDK
```bash
# React Native
npm install react-native-purchases
```

#### Initialize RevenueCat
```typescript
// apps/mobile/services/revenuecat.ts
import Purchases from 'react-native-purchases';

// Initialize
await Purchases.configure({
  apiKey: Platform.OS === 'ios' 
    ? process.env.REVENUECAT_IOS_KEY
    : process.env.REVENUECAT_ANDROID_KEY,
  appUserID: userId, // Your user ID
});

// Get offerings (subscription tiers)
const offerings = await Purchases.getOfferings();
const packages = offerings.current?.availablePackages;

// Purchase package
const purchaseResult = await Purchases.purchasePackage(package);
```

### 2. RevenueCat Dashboard Configuration

#### Product Setup
1. Create products in App Store Connect (iOS)
2. Create products in Google Play Console (Android)
3. Configure in RevenueCat dashboard:
   - **Starter**: $4.99/month (50 images)
   - **Popular**: $9.99/month (100 images)
   - **Pro**: $24.99/month (250 images)

#### Webhook Configuration
- Set webhook URL: `https://funnyfyapp.vercel.app/api/webhooks/revenuecat`
- Enable events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE`

---

## Webhook Handler

### Vercel API Endpoint

```typescript
// api/webhooks/revenuecat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature (RevenueCat provides this)
  const signature = req.headers['authorization'];
  if (!verifyWebhookSignature(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  
  switch (event.type) {
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
    case 'NON_RENEWING_PURCHASE':
      await handleNonRenewingPurchase(event);
      break;
  }

  return res.status(200).json({ received: true });
}

async function handleInitialPurchase(event: any) {
  const { customer_info, product_id } = event;
  
  // Find or create user
  let user = await db.query(
    'SELECT * FROM users WHERE revenuecat_user_id = $1',
    [customer_info.original_app_user_id]
  );
  
  if (!user) {
    user = await db.query(`
      INSERT INTO users (revenuecat_user_id, email)
      VALUES ($1, $2)
      RETURNING *
    `, [customer_info.original_app_user_id, customer_info.email]);
  }
  
  // Create subscription
  const tier = mapProductIdToTier(product_id); // 'starter', 'popular', 'pro'
  const periodEnd = new Date(customer_info.entitlements.active[product_id]?.expires_date);
  
  await db.query(`
    INSERT INTO subscriptions (
      user_id, revenuecat_subscription_id, platform, tier, status,
      current_period_start, current_period_end
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    user.id,
    event.subscription_id,
    event.platform, // 'ios' or 'android'
    tier,
    'active',
    new Date(),
    periodEnd
  ]);
  
  // Log history
  await logSubscriptionEvent(user.id, 'created', { tier, platform: event.platform });
}

async function handleRenewal(event: any) {
  const subscription = await db.query(
    'SELECT * FROM subscriptions WHERE revenuecat_subscription_id = $1',
    [event.subscription_id]
  );
  
  if (subscription) {
    const periodEnd = new Date(event.expiration_at);
    await db.query(`
      UPDATE subscriptions
      SET current_period_end = $1, updated_at = NOW()
      WHERE id = $2
    `, [periodEnd, subscription.id]);
    
    // Reset usage quota
    await resetUsageQuota(subscription.user_id);
    
    await logSubscriptionEvent(subscription.user_id, 'renewed', {});
  }
}

async function handleCancellation(event: any) {
  const subscription = await db.query(
    'SELECT * FROM subscriptions WHERE revenuecat_subscription_id = $1',
    [event.subscription_id]
  );
  
  if (subscription) {
    await db.query(`
      UPDATE subscriptions
      SET cancel_at_period_end = TRUE, canceled_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [subscription.id]);
    
    await logSubscriptionEvent(subscription.user_id, 'canceled', {});
  }
}
```

---

## Subscription Status Sync

### API Endpoint to Get User Subscription

```typescript
// api/user/subscription.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = req.headers['x-user-id']; // From auth token
  
  const subscription = await db.query(`
    SELECT s.*, u.email
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    WHERE u.id = $1
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `, [userId]);
  
  if (!subscription) {
    return res.json({
      ok: true,
      subscription: null,
      tier: 'free',
      quota: { current: 0, limit: 0 }
    });
  }
  
  // Get current usage
  const usage = await getCurrentUsage(userId);
  const quota = getQuotaForTier(subscription.tier);
  
  return res.json({
    ok: true,
    subscription: {
      tier: subscription.tier,
      status: subscription.status,
      periodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    },
    quota: {
      current: usage,
      limit: quota,
      resetDate: subscription.current_period_end
    }
  });
}
```

---

## Billing Cycle Management

### Quota Reset Logic

```typescript
// Reset usage when subscription renews
async function resetUsageQuota(userId: string) {
  const currentMonth = getCurrentMonth(); // YYYY-MM-01
  
  await db.query(`
    INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
    VALUES ($1, $2, 0, NOW())
    ON CONFLICT (user_id, month) 
    DO UPDATE SET count = 0, last_reset_at = NOW()
  `, [userId, currentMonth]);
}
```

### Proration Handling

**Scenario**: User upgrades mid-month
- **Option 1**: Give full new quota immediately (simpler)
- **Option 2**: Prorate based on days remaining (more complex)

**Recommendation**: Start with Option 1, add proration later if needed.

---

## Subscription Tiers Mapping

```typescript
// Map RevenueCat product IDs to tiers
const PRODUCT_TO_TIER = {
  'starter_monthly': 'starter',
  'popular_monthly': 'popular',
  'pro_monthly': 'pro',
};

// Map tiers to quotas
const TIER_QUOTAS = {
  'starter': 50,
  'popular': 100,
  'pro': 250,
};

function mapProductIdToTier(productId: string): string {
  return PRODUCT_TO_TIER[productId] || 'starter';
}

function getQuotaForTier(tier: string): number {
  return TIER_QUOTAS[tier] || 0;
}
```

---

## Subscription Lifecycle

### 1. User Purchases Subscription
```
App → RevenueCat SDK → App Store/Play Store → Payment
                ↓
         RevenueCat Webhook → Backend → Create Subscription
                ↓
         Update User Tier → Reset Quota
```

### 2. Subscription Renews
```
App Store/Play Store → Auto-Renewal → RevenueCat Webhook
                ↓
         Backend → Update Period End → Reset Quota
```

### 3. User Cancels
```
App → RevenueCat SDK → Cancel Subscription
                ↓
         RevenueCat Webhook → Backend → Mark cancel_at_period_end
                ↓
         User keeps access until period_end
```

### 4. Subscription Expires
```
Period End Reached → RevenueCat Webhook → Backend
                ↓
         Update Status to 'expired' → Revoke Access
```

---

## Error Handling

### Payment Failures
- RevenueCat handles retries automatically
- Webhook: `BILLING_ISSUE` event
- Action: Notify user, allow manual retry

### Webhook Failures
- Implement retry logic
- Log failed webhooks
- Manual sync endpoint for recovery

### Sync Issues
- Periodic sync job (daily)
- Compare RevenueCat status with database
- Auto-fix discrepancies

---

## Testing Strategy

### Test Scenarios
1. **Initial Purchase**: New user subscribes
2. **Renewal**: Subscription auto-renews
3. **Cancellation**: User cancels (keeps access until end)
4. **Upgrade**: User upgrades tier
5. **Downgrade**: User downgrades tier
6. **Payment Failure**: Payment fails, retry succeeds
7. **Expiration**: Subscription expires

### Test Accounts
- Use RevenueCat sandbox environment
- Test with App Store/Play Store sandbox accounts
- Test webhook handling with mock events

---

## Security Considerations

1. **Webhook Verification**: Always verify RevenueCat webhook signatures
2. **User Authentication**: All subscription endpoints require auth
3. **Idempotency**: Handle duplicate webhook events gracefully
4. **Data Privacy**: Don't store payment details (RevenueCat handles this)
5. **Audit Trail**: Log all subscription changes

---

## Revenue Recognition

### Monthly Recurring Revenue (MRR)

```sql
-- Calculate MRR
SELECT 
  SUM(CASE 
    WHEN tier = 'starter' THEN 5.00
    WHEN tier = 'popular' THEN 10.00
    WHEN tier = 'pro' THEN 25.00
  END) as mrr
FROM subscriptions
WHERE status = 'active'
AND current_period_end > NOW();
```

### Revenue Tracking
- Track in `payments` table
- Generate monthly revenue reports
- Track by tier, platform, date

---

## Implementation Phases

### Phase 1: RevenueCat Setup (Week 1)
- [ ] Create RevenueCat account
- [ ] Configure products in App Store/Play Store
- [ ] Set up RevenueCat products
- [ ] Configure webhooks
- [ ] Test webhook endpoint

### Phase 2: Mobile Integration (Week 2)
- [ ] Install RevenueCat SDK
- [ ] Implement purchase flow
- [ ] Implement restore purchases
- [ ] Handle subscription status
- [ ] Test on iOS and Android

### Phase 3: Backend Integration (Week 3)
- [ ] Create webhook handler
- [ ] Set up database schema
- [ ] Implement subscription sync
- [ ] Implement quota reset logic
- [ ] Test all webhook events

### Phase 4: Testing & Launch (Week 4)
- [ ] End-to-end testing
- [ ] Test payment flows
- [ ] Test renewals
- [ ] Test cancellations
- [ ] Production deployment

---

## Cost Analysis

### RevenueCat Costs
- **Free**: Up to $10,000 MRR
- **Paid**: 1% of revenue after $10k MRR

### App Store Fees
- **Apple**: 30% (first year), 15% (after year 1 for subscriptions)
- **Google**: 15-30% (depending on revenue)

### Net Revenue Calculation
- User pays: $5/month
- App Store takes: $1.50 (30%) = $3.50 net
- RevenueCat takes: $0.035 (1% after $10k MRR)
- **Your net**: ~$3.47/month per Starter user

---

## Alternative: Stripe (If Needed Later)

If you want to add web subscriptions or direct payments:

```typescript
// Stripe integration (optional)
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
});
```

---

## Monitoring & Analytics

### Key Metrics
- **MRR**: Monthly recurring revenue
- **Churn Rate**: % of users canceling
- **LTV**: Lifetime value per user
- **Conversion Rate**: Free → Paid
- **Upgrade Rate**: Tier upgrades

### RevenueCat Dashboard
- Built-in analytics
- Revenue tracking
- Churn analysis
- User cohorts

---

## Next Steps

1. **Set Up RevenueCat Account**: Create account, configure products
2. **Configure App Store Products**: Set up in App Store Connect
3. **Configure Play Store Products**: Set up in Google Play Console
4. **Implement Webhook Handler**: Create Vercel endpoint
5. **Integrate SDK**: Add to mobile app
6. **Test End-to-End**: Full purchase flow

---

## References

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat React Native SDK](https://github.com/RevenueCat/react-native-purchases)
- [App Store In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

---

**Recommendation**: Use RevenueCat for mobile subscriptions - it's the industry standard and handles all the complexity.
