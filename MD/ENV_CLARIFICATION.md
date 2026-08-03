# Environment Variables Clarification

## Replicate API vs Replicate Webhooks

### ❌ We DON'T Use Replicate Webhooks

**Replicate API** (`TARGET_API_URL` + `TARGET_API_KEY`):
- **What it is**: We make HTTP requests **TO** Replicate to generate images
- **Direction**: FunnyFy → Replicate
- **How it works**: 
  1. We send a POST request to Replicate API
  2. Replicate returns a job ID
  3. We **poll** Replicate's API to check job status (we don't wait for webhooks)
  4. When done, we get the result

**Replicate Webhooks** (NOT USED):
- **What it would be**: Replicate sends HTTP requests **TO US** when jobs complete
- **Direction**: Replicate → FunnyFy
- **Status**: We don't use this - we poll instead

---

## RevenueCat Webhooks (Different Service)

**RevenueCat Webhooks** (`REVENUECAT_WEBHOOK_SECRET`):
- **What it is**: RevenueCat sends HTTP requests **TO US** about subscription events
- **Direction**: RevenueCat → FunnyFy
- **Events**: Subscription purchases, renewals, cancellations, etc.
- **Why we need it**: To sync subscription status from RevenueCat to our database
- **Endpoint**: `/api/webhooks/revenuecat`

---

## Summary

| Service | Type | Direction | Environment Variable |
|---------|------|-----------|---------------------|
| **Replicate API** | API (we call them) | FunnyFy → Replicate | `TARGET_API_KEY`, `TARGET_API_URL` |
| **Replicate Webhooks** | Webhooks (they call us) | Replicate → FunnyFy | ❌ **NOT USED** |
| **RevenueCat Webhooks** | Webhooks (they call us) | RevenueCat → FunnyFy | `REVENUECAT_WEBHOOK_SECRET` |

---

## How We Use Replicate

```typescript
// 1. We call Replicate API to start a job
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${TARGET_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ version: model, input: {...} })
});

// 2. Replicate returns a job ID
const { id } = await response.json();

// 3. We poll Replicate API to check status (we don't wait for webhooks)
while (status !== 'succeeded' && status !== 'failed') {
  const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${id}`);
  const { status } = await statusResponse.json();
  await sleep(2000); // Poll every 2 seconds
}

// 4. When done, we get the result
const result = await statusResponse.json();
```

**Note**: We poll Replicate's API instead of using webhooks because:
- Simpler setup (no webhook endpoint needed)
- More control over polling frequency
- Works well for our use case

---

## Environment Variables You Need

### For Replicate (Image Generation)
- ✅ `TARGET_API_URL` - Replicate API endpoint
- ✅ `TARGET_API_KEY` - Your Replicate API token
- ❌ ~~`REPLICATE_WEBHOOK_SECRET`~~ - **NOT NEEDED** (we don't use Replicate webhooks)

### For RevenueCat (Subscriptions)
- ✅ `REVENUECAT_WEBHOOK_SECRET` - To verify RevenueCat webhook signatures

---

## Quick Answer

**Q: Is Replicate webhook the same as Replicate API?**

**A: No.**
- **Replicate API** = We call Replicate (uses `TARGET_API_KEY`)
- **Replicate Webhooks** = Replicate calls us (we don't use this)
- **RevenueCat Webhooks** = RevenueCat calls us (uses `REVENUECAT_WEBHOOK_SECRET`)

You only need:
- `TARGET_API_KEY` for Replicate (to generate images)
- `REVENUECAT_WEBHOOK_SECRET` for RevenueCat (to receive subscription events)
