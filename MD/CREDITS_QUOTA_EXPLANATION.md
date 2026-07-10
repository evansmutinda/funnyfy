# How Credits/Quota Are Calculated in FunnyFy

## Quick Answer

**No, $0.04 is NOT 1 credit.**

Instead:
- **1 Credit = 1 Generation** (regardless of cost)
- Credits are **NOT tied to dollar amounts**
- Each tier gets a **fixed number of generations** per month

---

## How It Actually Works

### Credits = Generations (Not Dollar Amounts)

In your system, "credits" are simply **generations**. Each time a user generates an image, it counts as **1 credit/generation**, regardless of:
- Which style they choose
- Which AI model is used
- What the API cost is

### Example:

```
User generates 1 image → Uses 1 credit
User generates 1 image → Uses 1 credit  
User generates 1 image → Uses 1 credit

Total: 3 generations = 3 credits used
```

---

## Subscription Tier Quotas

Each subscription tier has a **fixed monthly quota** (generations per month):

| Tier | Monthly Quota | What This Means |
|------|---------------|-----------------|
| **Trial** | 3 generations (lifetime) | Free trial users get 3 free generations total |
| **Starter** | 50 generations/month | 50 images per month, resets each billing cycle |
| **Popular** | 100 generations/month | 100 images per month, resets each billing cycle |
| **Pro** | 250 generations/month | 250 images per month, resets each billing cycle |

### Code Reference

From `api/enqueue.ts`:
```typescript
const TIER_QUOTAS: Record<string, number> = {
  'starter': 50,    // 50 generations per month
  'popular': 100,   // 100 generations per month
  'pro': 250,       // 250 generations per month
};
```

---

## API Costs vs. User Credits

### Important Distinction:

**What YOU Pay (API Costs):**
- Each generation costs you $0.04 (flux-kontext-pro model)
- Different models have different costs
- This is tracked in `cost_tracking` table for monitoring

**What USERS Get (Credits/Quota):**
- Users get fixed generation limits per month
- **NOT tied to dollar amounts**
- All styles cost the same: **1 generation = 1 credit**

### Example Breakdown:

**Starter Tier User:**
- Pays: **$5/month** subscription
- Gets: **50 generations/month**
- Cost per generation (to you): $0.04
- **Your cost for their usage**: 50 × $0.04 = **$2.00/month**
- **Your profit**: $4.99 - $2.00 = **$2.99/month per user**

**User Perspective:**
- "I get 50 caricatures per month"
- "Each generation uses 1 of my 50 credits"
- They don't see or care about your API costs

---

## How Credits Are Tracked

### For Trial Users:

Trial users have a lifetime limit of 3 generations:

```typescript
const TRIAL_LIMIT = 3;
// Stored in: users.trial_generations_used
```

**Tracking:**
- When trial user generates: `trial_generations_used` increments
- If `trial_generations_used >= 3`: User must subscribe

### For Subscribed Users:

Subscribed users have monthly quotas tracked in `usage_tracking` table:

```sql
-- Table: usage_tracking
-- Columns: user_id, month (YYYY-MM-01), count
-- Example: user_id='abc', month='2025-01-01', count=25
```

**Tracking:**
- Each successful generation increments `count` **once per job** (via `job_usage_credits` — see below)
- Quota resets at the start of each billing month
- When `count >= quota_limit`: User cannot generate more until next month

**Code from `api/_utils/usage.ts` (called by `api/cron/process-queue.ts` after success):**
```typescript
// 1. Insert job_usage_credits (idempotent — skips if job already credited)
// 2. Then increment trial_generations_used OR usage_tracking.count
await creditUsageForJob(jobId, userId);
```

**Queue safety:** Jobs are claimed atomically with `FOR UPDATE SKIP LOCKED` so two workers cannot process the same job.

---

## Real Examples

### Example 1: Starter Tier User

**Month 1:**
- User subscribes: **$4.99/month**
- Generates: **25 images**
- Credits used: **25/50**
- Credits remaining: **25**
- Your API cost: 25 × $0.04 = **$1.00**

**Month 2 (Renewal):**
- Quota resets: **0/50**
- User generates: **50 images** (full quota)
- Credits used: **50/50**
- Credits remaining: **0**
- Your API cost: 50 × $0.04 = **$2.00**

### Example 2: Pro Tier User (Heavy User)

**Month 1:**
- User subscribes: **$24.99/month**
- Generates: **250 images** (full quota)
- Credits used: **250/250**
- Credits remaining: **0**
- Your API cost: 250 × $0.04 = **$10.00**
- Your profit: $24.99 - $10.00 = **$14.99/month**

### Example 3: Popular Tier User (Average User)

**Month 1:**
- User subscribes: **$9.99/month**
- Generates: **60 images**
- Credits used: **60/100**
- Credits remaining: **40**
- Your API cost: 60 × $0.04 = **$2.40**
- Your profit: $9.99 - $2.40 = **$7.59/month**

---

## Cost Tracking (What You Pay)

While users track **generations** (credits), you track **dollar costs**:

### Cost Per Generation

From `api/_utils/cost-protection.ts`:
```typescript
const MODEL_COSTS: Record<string, number> = {
  'black-forest-labs/flux-kontext-pro': 0.04,  // $0.04 per generation
  'google/nano-banana': 0.039,                 // $0.039 per generation
  'google/nano-banana-2': 0.067,               // $0.067 per generation
  'default': 0.04,                             // Default fallback
};
```

### Cost Tracking Table

```sql
-- Table: cost_tracking
-- Tracks your actual API costs per generation
-- Columns: job_id, date, cost_usd, model_version

Example:
job_id='abc123', date='2025-01-15', cost_usd=0.04, model_version='flux-kontext-pro'
```

**This is separate from user quotas!**
- Users don't see this
- This is for your internal cost monitoring
- Used for daily spending caps and analytics

---

## Frequently Asked Questions

### Q: If API cost is $0.04, why not make 1 credit = $0.05?

**A:** Because:
1. **Simplicity**: Users understand "50 images/month" better than "$0.50 worth of credits"
2. **Consistency**: All styles cost the same to users (1 generation = 1 credit)
3. **Pricing flexibility**: You can change API models without confusing users
4. **Industry standard**: Most apps use "generations" or "uses", not dollar amounts

### Q: What if different styles have different API costs?

**A:** Currently, all styles use the same quota (1 generation = 1 credit). If you want different costs:

**Option 1: Keep it simple** (Recommended)
- All styles = 1 credit
- You absorb cost differences
- Users see consistent pricing

**Option 2: Different credit costs** (Complex)
- Simple styles = 1 credit
- Complex styles = 2 credits
- Would require code changes
- More confusing for users

**Recommendation:** Keep all styles at 1 credit for simplicity.

### Q: Can I change the quota system?

**A:** Yes, you can modify:
- `TIER_QUOTAS` in `api/enqueue.ts` - Change monthly limits
- `TRIAL_LIMIT` - Change trial generation limit
- Add premium styles that cost more credits

But the fundamental system (1 generation = 1 credit) is currently fixed.

### Q: How do I track costs vs. revenue?

**A:** Your system already tracks this:

```sql
-- User revenue (from subscriptions)
SELECT COUNT(*) * 4.99 FROM subscriptions WHERE status = 'active';

-- Your API costs
SELECT SUM(cost_usd) FROM cost_tracking WHERE date >= CURRENT_DATE - INTERVAL '1 month';

-- Profit = Revenue - Costs
```

---

## Summary

| Concept | Value | Notes |
|---------|-------|-------|
| **1 Credit** | = 1 Generation | Fixed, regardless of API cost |
| **Starter Quota** | 50 credits/month | = 50 generations/month |
| **Popular Quota** | 100 credits/month | = 100 generations/month |
| **Pro Quota** | 250 credits/month | = 250 generations/month |
| **Trial Quota** | 3 credits (lifetime) | = 3 generations total |
| **API Cost (You Pay)** | $0.04/generation | Tracked separately, users don't see |
| **User Subscription** | $4.99-$24.99/month | Gives them credits, not dollars |

---

## Key Takeaways

1. ✅ **1 Credit = 1 Generation** (simple and clear)
2. ✅ **Credits are NOT dollar-based** (users get fixed generations)
3. ✅ **All styles cost 1 credit** (consistent for users)
4. ✅ **API costs are tracked separately** (for your monitoring)
5. ✅ **Users see "50 images/month"** not "$0.20 worth of credits"

---

**Last Updated:** January 2025  
**Related Files:** `api/enqueue.ts`, `api/user/subscription.ts`, `api/_utils/cost-protection.ts`

