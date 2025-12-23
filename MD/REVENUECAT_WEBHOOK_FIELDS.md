# RevenueCat Webhook Fields - Quick Reference

When creating a webhook in RevenueCat, you'll need to fill in these fields:

## Required Fields

### 1. **Webhook Name**
**What to enter:**
```
FunnyFy Production Webhook
```
**For staging:**
```
FunnyFy Staging Webhook
```

**Purpose:** A friendly name to identify this webhook in the dashboard.

---

### 2. **Webhook URL**
**What to enter (Production):**
```
https://funnyfyapp.vercel.app/api/webhooks/revenuecat
```

**What to enter (Staging):**
```
https://funnyfy-staging.vercel.app/api/webhooks/revenuecat
```

**Purpose:** The endpoint where RevenueCat will send subscription events.

**Note:** Make sure this URL is publicly accessible (not behind authentication).

---

### 3. **Authorised Header**
**What to enter:**
```
Authorization
```

**Purpose:** The HTTP header name that will contain the webhook secret for verification.

**How it works:**
- RevenueCat will send webhooks with: `Authorization: Bearer whsec_xxxxx`
- Our code verifies this header to ensure the webhook is from RevenueCat

---

### 4. **Environment to send events for**
**Options:**
- **Production** - Real subscription events from App Store/Play Store
- **Sandbox** - Test events (for development/testing)

**What to select:**
- **Production webhook:** Select **Production**
- **Staging/Testing webhook:** Select **Sandbox**

**Purpose:** Filters which environment's events are sent to this webhook.

---

### 5. **Event Filter**
**What to select:**
- ✅ **INITIAL_PURCHASE** - User subscribes for the first time
- ✅ **RENEWAL** - Subscription auto-renews
- ✅ **CANCELLATION** - User cancels subscription
- ✅ **UNCANCELLATION** - User reactivates cancelled subscription
- ✅ **EXPIRATION** - Subscription expires
- ✅ **BILLING_ISSUE** - Payment fails (optional but recommended)

**Purpose:** Which subscription events you want to receive.

**Recommendation:** Select all of the above for complete subscription tracking.

---

## Example Webhook Configuration

```
Webhook Name: FunnyFy Production Webhook
Webhook URL: https://funnyfyapp.vercel.app/api/webhooks/revenuecat
Authorised Header: Authorization
Environment: Production
Event Filter: 
  ✅ INITIAL_PURCHASE
  ✅ RENEWAL
  ✅ CANCELLATION
  ✅ UNCANCELLATION
  ✅ EXPIRATION
  ✅ BILLING_ISSUE
```

---

## After Creating

1. **Copy the Webhook Secret** - It will be displayed after creation
2. **Add to Vercel** as `REVENUECAT_WEBHOOK_SECRET`
3. **Test the webhook** using RevenueCat's test feature

---

## Troubleshooting

### "Authorised Header" field
- **Use:** `Authorization` (exactly as shown)
- **Don't use:** `X-Authorization`, `Auth`, or other variations
- Our code expects: `req.headers['authorization']`

### "Webhook URL" not accessible
- Verify the URL is correct
- Check Vercel deployment is live
- Test with: `curl https://funnyfyapp.vercel.app/api/webhooks/revenuecat`
- Should return: `{"ok":false,"error":"Method not allowed"}` (means endpoint exists)

### Events not being received
- Check "Environment" matches your testing (Sandbox vs Production)
- Verify "Event Filter" includes the events you're testing
- Check Vercel function logs for errors

---

**See also:** `MD/REVENUECAT_WEBHOOK_SETUP.md` for complete setup instructions.
