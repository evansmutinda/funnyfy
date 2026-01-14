# How Apps Like AI Morph Implement 3-Day Subscription Trials

## Overview

Apps like "AI Morph" offer 3-day subscription trials by leveraging **Google Play Store's built-in subscription trial system** (and App Store on iOS). This is different from your current usage-based trial system (3 free generations).

**⚠️ Important Cost Consideration:** Yes, apps offering 3-day trials ARE paying for API costs during the trial. However, they manage this through **usage quotas and limits** to keep costs controlled while still providing value. See the "Managing API Costs During Trials" section below.

---

## Two Types of Trials

### Current System: Usage-Based Trial (What You Have Now)
- ✅ Users get **3 free generations** without any subscription
- ✅ No payment method required
- ✅ No time limit
- ✅ User can subscribe anytime or continue using the free tier

### Time-Based Subscription Trial (What AI Morph Uses)
- 📅 Users get **full premium access for 3 days**
- 💳 **Payment method required upfront** (Google Play/App Store)
- ⏰ Trial expires after 3 days
- 🔄 Automatically converts to paid subscription unless canceled
- ✅ Users must cancel 24 hours before trial ends to avoid charges

---

## How Google Play Store Subscription Trials Work

### The Process:

1. **User taps "Start 3-Day Trial"** in your app
2. **Google Play Store prompts for payment method** (if not already on file)
3. **User confirms and starts trial** - no charge yet
4. **Full premium features unlocked** for 3 days
5. **After 3 days:**
   - If user **canceled before day 2**: No charge, access ends
   - If user **didn't cancel**: Automatic charge and subscription continues

### Key Points:

- **Configured in Google Play Console** (not in your app code)
- **Minimum trial length**: Google recommends 7+ days, but **3 days is allowed** for introductory offers
- **RevenueCat automatically passes through** the trial from Play Store
- **Trial period is handled by Google/Apple** - you don't manage it

---

## Implementation Steps for Your App

### Step 1: Configure Products in Google Play Console

1. **Go to Google Play Console** → Your App → Monetize → Products → Subscriptions

2. **Create/Edit Subscription Product** (e.g., "Starter Monthly")

3. **Set up Base Plan:**
   - Subscription period: 1 month
   - Price: $4.99 (or your price)

4. **Add Introductory Offer (This is the 3-Day Trial):**
   - Click "Add offer" → "Free trial"
   - Duration: **3 days**
   - Set as "Introductory offer"
   - This offer is shown to **first-time subscribers only**

5. **Save and activate the subscription**

### Step 2: Link to RevenueCat Products

In RevenueCat Dashboard:

1. **Go to Product Catalog → Products**
2. **Edit your Android product** (e.g., `starter_monthly`)
3. **Map to Google Play Store product ID** (the one you just created)
4. RevenueCat will automatically detect the trial period from Play Store

### Step 3: RevenueCat Webhook Handling

Your webhook (`api/webhooks/revenuecat.ts`) already handles trial status through RevenueCat events.

**Key Event Types:**
- `INITIAL_PURCHASE` - Sent when user starts trial (subscription is active during trial)
- `RENEWAL` - Sent when trial converts to paid (or monthly renewal)
- `CANCELLATION` - User canceled before trial ended
- `EXPIRATION` - Trial or subscription expired

### Step 4: Update Your App UI

In `apps/mobile/App.js`, you might want to:

1. **Show trial status clearly:**
   ```javascript
   // Check if subscription is in trial period
   const isInTrialPeriod = subscriptionInfo?.subscription?.willRenew && 
                            subscriptionInfo?.subscription?.periodType === 'TRIAL';
   ```

2. **Display trial countdown:**
   ```javascript
   // Show days remaining in trial
   const trialEndDate = subscriptionInfo?.subscription?.expiresDate;
   const daysRemaining = Math.ceil((new Date(trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
   ```

3. **Warn users before trial ends:**
   ```javascript
   if (daysRemaining <= 1) {
     // Show warning: "Trial ends in 1 day. Cancel to avoid charges."
   }
   ```

---

## RevenueCat Trial Information

RevenueCat provides trial information in the subscription response:

```javascript
// When checking subscription status via RevenueCat SDK
const customerInfo = await Purchases.getCustomerInfo();

// Check if in trial period
const isInTrial = customerInfo.entitlements.active['starter']?.willRenew === true &&
                  customerInfo.entitlements.active['starter']?.periodType === 'TRIAL';

// Get trial end date
const expiresDate = customerInfo.entitlements.active['starter']?.expiresDate;

// Get intro offer info
const introPrice = customerInfo.entitlements.active['starter']?.productIdentifier;
```

---

## Differences: Your Current System vs. Subscription Trial

| Feature | Current (Usage-Based) | Subscription Trial (AI Morph) |
|---------|----------------------|-------------------------------|
| **Payment Required** | ❌ No | ✅ Yes (payment method) |
| **Time Limit** | ❌ No | ✅ Yes (3 days) |
| **Auto-Charge** | ❌ No | ✅ Yes (unless canceled) |
| **Full Access** | ❌ Limited (3 generations) | ✅ Full premium access |
| **User Control** | ✅ Complete | ⚠️ Must remember to cancel |
| **Conversion Rate** | Lower | Higher (commitment) |

---

## Why Apps Use Subscription Trials

1. **Higher Conversion Rates**: Users commit to adding payment method
2. **Better User Experience**: Full premium features during trial
3. **Automatic Billing**: Less friction after trial ends
4. **Play Store Optimization**: Better visibility and ranking
5. **Industry Standard**: Users are familiar with this model

---

## Important Considerations

### Pros:
- ✅ **Higher revenue** - better conversion rates
- ✅ **Full feature access** - users see value immediately
- ✅ **Automatic conversion** - no manual subscription needed
- ✅ **Play Store optimized** - better app store ranking

### Cons:
- ⚠️ **Payment barrier** - some users won't start trial
- ⚠️ **Negative reviews** - users forget to cancel and get charged
- ⚠️ **Regulatory compliance** - must clearly disclose trial terms
- ⚠️ **Support burden** - refund requests from users who forgot to cancel

---

## Google Play Store Requirements

When offering trials, you must:

1. **Clearly disclose:**
   - Trial duration (e.g., "3-day free trial")
   - What happens after trial (auto-renewal, price)
   - How to cancel (link to subscription management)

2. **Display in app listing:**
   - Trial information in app description
   - Pricing and terms visible

3. **Send reminders:**
   - Google Play automatically sends email reminders
   - You can also show in-app reminders (recommended)

---

## Implementation Checklist

### Google Play Console:
- [ ] Create subscription products with 3-day free trial offers
- [ ] Set up introductory offers (3 days free)
- [ ] Activate subscriptions
- [ ] Test with sandbox accounts

### RevenueCat:
- [ ] Link products to Play Store subscription IDs
- [ ] Verify trial periods are detected automatically
- [ ] Test webhook receives `INITIAL_PURCHASE` for trial starts

### Backend:
- [ ] Verify webhook handles trial status correctly
- [ ] Update subscription status logic to handle trials
- [ ] Ensure full premium access during trial period

### Mobile App:
- [ ] Update UI to show trial status
- [ ] Display trial countdown/expiration date
- [ ] Add warning before trial ends
- [ ] Show clear cancellation instructions
- [ ] Test purchase flow with trial

### Legal/Compliance:
- [ ] Update app description with trial terms
- [ ] Add clear cancellation instructions
- [ ] Ensure terms are compliant with Play Store policies

---

## Testing the Trial Flow

### In Google Play Console (Sandbox):

1. **Create test accounts** in Play Console
2. **Install app** on test device with test account
3. **Start subscription** - should show "3-day free trial"
4. **Verify no charge** immediately
5. **Check RevenueCat dashboard** - should show trial active
6. **Wait 3 days** (or use Play Console to accelerate time)
7. **Verify auto-renewal** happens (in sandbox)

### Testing in RevenueCat:

1. Use RevenueCat's **test mode**
2. Purchase subscription via Test Store
3. Verify webhook receives `INITIAL_PURCHASE`
4. Check database shows subscription as active
5. Verify full premium access granted

---

## Managing API Costs During 3-Day Trials

### The Problem

**Your concern is valid!** If you give users unlimited access during a 3-day trial, you could face massive API bills. A single user could generate hundreds of images during their trial, costing you $1-5+ per user.

**Example:**
- User generates 100 images during 3-day trial
- Cost: 100 × $0.04 = **$4.00 per user**
- If 1000 users sign up: **$4,000 in API costs**
- If only 10% convert to paid: You've spent $400 to earn maybe $500-1000/month

### The Solution: Trial Quotas

Apps like AI Morph **don't give unlimited access** during trials. Instead, they use **reasonable quotas** that:

1. **Provide enough value** to show what the app can do
2. **Limit API costs** to manageable amounts
3. **Encourage conversion** by leaving users wanting more

### Common Trial Strategies

#### Strategy 1: Tier-Based Trial Quotas (Recommended)

Give trial users a **subset of their tier's monthly quota** for the 3-day period:

```javascript
// Example: Trial users get 20% of monthly quota during 3-day trial
const TRIAL_QUOTAS = {
  'starter': 10,   // 20% of 50/month
  'popular': 20,   // 20% of 100/month  
  'pro': 50,       // 20% of 250/month
};
```

**Cost per trial user:** ~$0.40-2.00 (much more manageable)

#### Strategy 2: Fixed Trial Quota (Simpler)

All trial users get the same quota regardless of tier:

```javascript
const TRIAL_QUOTA = 15; // All users get 15 generations during 3-day trial
```

**Cost per trial user:** ~$0.60 (very predictable)

#### Strategy 3: Daily Trial Limit

Limit trial users to X generations per day:

```javascript
const TRIAL_DAILY_LIMIT = 5; // Max 5 per day during 3-day trial = 15 total max
```

**Cost per trial user:** ~$0.60 (prevents abuse on single day)

### Implementation in Your Codebase

You already have the infrastructure! Here's how to modify it:

#### Option A: Modify Trial Logic to Use Trial Quotas

In `api/enqueue.ts`, update the trial quota logic:

```typescript
// Current: TRIAL_LIMIT = 3 (usage-based, not time-based)
// For subscription trials, use larger quotas but still enforce limits

const TRIAL_QUOTAS = {
  'starter': 10,    // 10 generations during 3-day trial
  'popular': 20,    // 20 generations during 3-day trial
  'pro': 50,        // 50 generations during 3-day trial
};

// In your enqueue logic:
const isTrialUser = subscriptionInfo?.subscription?.periodType === 'TRIAL';
const trialQuota = isTrialUser ? TRIAL_QUOTAS[tier] || 10 : null;

// Check trial quota instead of subscription quota during trial
if (isTrialUser) {
  if (trialUsage >= trialQuota) {
    return error('Trial quota exhausted. Subscribe to continue.');
  }
}
```

#### Option B: Apply Monthly Quota During Trial

Treat trial as "mini subscription" - trial users get their tier's quota, but only valid during the 3-day period:

```typescript
// Trial users use monthly quota system, but trial ends in 3 days
// This means if they have "popular" tier, they get 100/month
// But they only have 3 days to use it (unrealistic to use all 100)

// Your existing quota system handles this - just ensure trial users
// get their tier quota applied
```

**Note:** This could be expensive if users abuse it, so use daily limits too.

### Cost Protection You Already Have

Your codebase already includes excellent cost protection:

1. **Daily Spending Cap** (`DAILY_SPENDING_CAP` env var)
   - Default: $100/day
   - Automatically pauses queue if exceeded
   - **Critical for trial periods!**

2. **Rate Limiting** (in `api/utils/ratelimit.ts`)
   - Burst limits per tier
   - Daily safety limits
   - Prevents abuse

3. **Monthly Quotas** (already implemented)
   - Per-tier quotas: 50/100/250
   - Prevents unlimited usage

### Recommended Trial Setup for Your App

**For 3-Day Subscription Trials:**

```typescript
// Trial quota configuration
const TRIAL_QUOTA_CONFIG = {
  // Fixed quota for all trial users (simplest)
  fixed: 15,  // 15 generations during 3-day trial = ~$0.06 per user
  
  // OR tier-based (more generous)
  tierBased: {
    'starter': 10,   // $0.04 per user
    'popular': 20,   // $0.08 per user
    'pro': 50,       // $0.20 per user
  },
  
  // Daily limit to prevent abuse
  dailyLimit: 5,  // Max 5 per day = 15 max over 3 days
};
```

**Cost Example:**
- 1,000 trial users × $0.60 = **$600 in API costs**
- If 10% convert ($5/month each) = $500/month revenue
- **Net profit: -$100/month** (loss until users renew - this shows importance of quotas!)

### Monitoring Trial Costs

1. **Track trial users separately:**
   ```sql
   -- Add to cost_tracking or create trial_tracking table
   SELECT 
     COUNT(DISTINCT user_id) as trial_users,
     COUNT(*) as trial_generations,
     SUM(cost_usd) as total_cost
   FROM cost_tracking ct
   JOIN users u ON ct.user_id = u.id
   WHERE u.subscription_status = 'trial'
   AND ct.date >= CURRENT_DATE - INTERVAL '3 days'
   ```

2. **Set lower daily cap during trial promotions:**
   ```bash
   # Reduce daily cap when expecting many trials
   DAILY_SPENDING_CAP=50  # Lower during promotional periods
   ```

3. **Alert on trial cost spikes:**
   ```typescript
   // In your monitoring
   if (trialCostsToday > 20) {
     sendAlert('High trial costs today: $' + trialCostsToday);
   }
   ```

### Best Practices

1. **✅ DO:**
   - Set reasonable trial quotas (10-20 generations)
   - Enforce daily limits (max 5-7 per day)
   - Track trial costs separately
   - Monitor conversion rates vs. costs
   - Use daily spending caps

2. **❌ DON'T:**
   - Give unlimited access during trial
   - Ignore daily spending caps
   - Forget to track trial costs
   - Set quotas so low users can't experience value

### Real-World Trial Cost Examples

**Scenario 1: Conservative Trial (10 generations)**
- 1,000 trial users
- Cost: 1,000 × 10 × $0.04 = **$400**
- If 10% convert: $500/month revenue
- **ROI: 25%** (break even, depends on retention)

**Scenario 2: Generous Trial (25 generations)**
- 1,000 trial users  
- Cost: 1,000 × 25 × $0.04 = **$1,000**
- If 15% convert: $750/month revenue
- **ROI: -25%** (loss initially - need retention to profit)

**Scenario 3: Abusive User (100+ generations)**
- 10 abusive users try to exploit trial
- Your daily limit (5/day) prevents: 5 × 3 days = 15 max
- Cost per user: 15 × $0.04 = **$0.60** (controlled!)

### Your Current System Comparison

| Approach | API Cost/User | Conversion | Risk |
|----------|---------------|------------|------|
| **Your current** (3 free, no payment) | $0.012 | Lower | Low |
| **Subscription trial** (15 quota, payment required) | $0.06 | Higher | Medium |
| **Unlimited trial** (no limits) | $4.00-20.00+ | Higher | **Very High** ❌ |

**Conclusion:** Even with subscription trials, you still control API costs through quotas. The payment barrier increases conversion, making the higher per-user cost worthwhile.

---

## FAQ

### Q: Can I offer both usage-based trial AND subscription trial?
**A:** Yes, but it's unusual. Most apps choose one approach. If you want both:
- Usage-based trial for users who don't want to commit
- Subscription trial as an upgrade option

### Q: What if a user cancels during the 3-day trial?
**A:** 
- They keep access until trial ends
- No charge occurs
- Access ends when trial expires
- RevenueCat sends `CANCELLATION` webhook

### Q: Can I change the trial length later?
**A:** 
- You can update future subscriptions
- Existing trials continue with original terms
- New users get the new trial length

### Q: What's the minimum trial length?
**A:** 
- Google Play: **1 day minimum** (3 days is common)
- App Store: **1 day minimum** (same)
- Most apps use 3, 7, or 14 days

### Q: How do I prevent users from using multiple trials?
**A:**
- Google Play/App Store automatically prevent this
- One trial per Google/Apple account
- RevenueCat tracks this via `original_app_user_id`

---

## Next Steps

1. **Decide if subscription trial fits your business model**
2. **Set up products in Google Play Console** with 3-day trials
3. **Link to RevenueCat products**
4. **Test thoroughly in sandbox**
5. **Update app UI** to show trial status
6. **Launch and monitor** conversion rates

---

## Resources

- [Google Play Billing Subscriptions](https://developer.android.com/google/play/billing/billing_subscriptions)
- [RevenueCat Introductory Offers](https://docs.revenuecat.com/docs/introductory-offers)
- [Play Store Trial Policies](https://support.google.com/googleplay/android-developer/answer/9888379)

---

**Last Updated:** January 2025  
**Related Docs:** `REVENUECAT_SETUP.md`, `REVENUECAT_PURCHASE_TESTING.md`

