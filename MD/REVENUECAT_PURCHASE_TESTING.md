# RevenueCat Purchase Flow Testing Guide

## Overview

This guide walks through testing the complete subscription purchase flow:
1. Mobile app → RevenueCat SDK → Purchase
2. RevenueCat → Webhook → Backend database update
3. Mobile app → Refresh subscription → Display updated plan

---

## Prerequisites

### 1. RevenueCat Configuration

- ✅ RevenueCat project created
- ✅ iOS/Android products configured in App Store Connect / Google Play Console
- ✅ Products added to RevenueCat dashboard
- ✅ Offerings configured in RevenueCat
- ✅ Webhook URL configured: `https://funnyfy-staging.vercel.app/api/webhooks/revenuecat`
- ✅ Webhook Authorization header set to match `REVENUECAT_WEBHOOK_SECRET`

### 2. Environment Variables

**Backend (Vercel):**
- `REVENUECAT_WEBHOOK_SECRET` - Secret for webhook verification

**Mobile App:**
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` - iOS SDK key
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` - Android SDK key
- `EXPO_PUBLIC_API_URL` - Backend URL (`https://funnyfy-staging.vercel.app`)

---

## Testing Methods

### Method 1: Real Purchase (Recommended for Final Testing)

**Steps:**

1. **Build EAS dev client:**
   ```bash
   cd apps/mobile
   eas build --profile development --platform android
   # or
   eas build --profile development --platform ios
   ```

2. **Install on device** and run:
   ```bash
   npx expo start --dev-client
   ```

3. **In the app:**
   - Open Subscription from the menu
   - Select Starter / Popular / Pro and complete purchase
   - Plan should update automatically (sync + refresh)
   - If needed, tap **Refresh** or **Restore**

4. **Verify backend:**
   - Metro logs: `[subscription] Synced to backend`
   - Vercel logs: `POST /api/sync-subscription` or webhook `INITIAL_PURCHASE`
   - Database: `subscriptions` and `users.subscription_status = 'active'`

### Method 2: Manual Sync Endpoint (Quick Backend Testing)

Use when webhook is delayed or for recovery:

```bash
curl -X POST https://funnyfy-staging.vercel.app/api/sync-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "userId": "YOUR-USER-UUID",
    "productId": "popular_monthly",
    "tier": "popular",
    "platform": "android"
  }'
```

Then refresh subscription in the app.

> **Note:** Legacy test webhook scripts and `/api/test-revenuecat-webhook` were removed. Use `/api/sync-subscription`, RevenueCat sandbox purchases, or the live webhook.

### Method 3: Manual Database Update (For Debugging)

If webhook isn't working, manually update database:

```sql
-- Update user subscription
UPDATE users 
SET subscription_tier = 'starter',
    subscription_status = 'active',
    billing_date = CURRENT_DATE
WHERE revenuecat_user_id = 'test-user-123';

-- Create subscription record
INSERT INTO subscriptions (
  user_id, revenuecat_subscription_id, platform, tier, status,
  current_period_start, current_period_end
)
SELECT 
  id,
  'test_sub_' || EXTRACT(EPOCH FROM NOW()),
  'test',
  'starter',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM users
WHERE revenuecat_user_id = 'test-user-123';

-- Reset usage
INSERT INTO usage_tracking (user_id, month, count, last_reset_at)
SELECT 
  id,
  DATE_TRUNC('month', CURRENT_DATE)::date,
  0,
  NOW()
FROM users
WHERE revenuecat_user_id = 'test-user-123'
ON CONFLICT (user_id, month)
DO UPDATE SET count = 0, last_reset_at = NOW();
```

---

## Verification Checklist

After a purchase (real or test), verify:

### ✅ Database Updates

```sql
-- Check user record
SELECT id, revenuecat_user_id, subscription_tier, subscription_status, billing_date
FROM users
WHERE revenuecat_user_id = 'test-user-123';

-- Check subscription record
SELECT id, tier, status, current_period_end, cancel_at_period_end
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE revenuecat_user_id = 'test-user-123');

-- Check usage tracking
SELECT month, count, last_reset_at
FROM usage_tracking
WHERE user_id = (SELECT id FROM users WHERE revenuecat_user_id = 'test-user-123');
```

### ✅ API Response

```bash
curl "https://funnyfy-staging.vercel.app/api/user/subscription?userId=test-user-123" \
  -H "x-user-id: test-user-123"
```

Expected response:
```json
{
  "ok": true,
  "subscription": {
    "tier": "starter",
    "status": "active",
    "periodEnd": "2025-12-31T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  },
  "usage": {
    "current": 0,
    "limit": 50,
    "month": "2025-12-01"
  },
  "isTrial": false
}
```

### ✅ Mobile App UI

- Plan pill shows: "Starter plan • 50 of 50 caricatures remaining this month"
- Upload screen allows generation (quota not exceeded)
- After generating, counter decrements: "Starter plan • 49 of 50 remaining"

---

## Troubleshooting

### Issue: Purchase succeeds but subscription doesn't update

**Check:**
1. Webhook URL is correct in RevenueCat dashboard
2. `REVENUECAT_WEBHOOK_SECRET` matches Authorization header
3. Vercel logs show webhook was received
4. Database has correct `revenuecat_user_id` matching RevenueCat `app_user_id`

**Fix:**
- Verify webhook secret matches
- Check webhook logs in RevenueCat dashboard
- Manually trigger webhook or use test endpoint

### Issue: "No offerings available"

**Check:**
1. RevenueCat SDK keys are correct
2. Offerings are configured in RevenueCat dashboard
3. Products are approved in App Store/Play Store

**Fix:**
- Verify SDK keys in `apps/mobile/.env`
- Check RevenueCat dashboard → Offerings
- Ensure products are in "Ready to Submit" or "Approved" status

### Issue: Webhook returns 401 (Invalid signature)

**Check:**
1. `REVENUECAT_WEBHOOK_SECRET` in Vercel matches RevenueCat webhook auth header
2. Webhook URL is correct

**Fix:**
- Update `REVENUECAT_WEBHOOK_SECRET` in Vercel environment variables
- Update Authorization header in RevenueCat webhook settings

### Issue: Subscription shows but quota is wrong

**Check:**
1. Tier mapping in `api/webhooks/revenuecat.ts` → `mapProductIdToTier()`
2. Product ID from RevenueCat matches expected format

**Fix:**
- Update `mapProductIdToTier()` function to match your product IDs
- Check RevenueCat dashboard for actual product identifiers

---

## Product ID Mapping

The webhook maps RevenueCat product IDs to tiers:

| Product ID Pattern | Tier |
|-------------------|------|
| `starter_monthly` or contains "starter" | `starter` (50/month) |
| `popular_monthly` or contains "popular" | `popular` (100/month) |
| `pro_monthly` or contains "pro" | `pro` (250/month) |

Update `api/webhooks/revenuecat.ts` if your product IDs differ.

---

## Next Steps

1. ✅ Test purchase flow in staging
2. ✅ Verify webhook updates database
3. ✅ Verify app displays updated subscription
4. ✅ Test quota enforcement (generate images, verify counter)
5. ✅ Test renewal webhook (if applicable)
6. ✅ Test cancellation webhook
7. ✅ Deploy to production with production RevenueCat keys

---

## Support

If issues persist:
- Check Vercel function logs
- Check RevenueCat dashboard → Events → Webhooks
- Verify database schema matches migrations
- Test with test endpoint first to isolate webhook issues

