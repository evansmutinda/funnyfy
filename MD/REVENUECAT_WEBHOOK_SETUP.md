# How to Get RevenueCat Webhook Secret

## Step-by-Step Instructions

### Step 1: Log into RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Log in with your account

### Step 2: Select Your Project

1. If you have multiple projects, select the one for FunnyFy
2. If you don't have a project yet, create one:
   - Click **"New Project"**
   - Enter project name: "FunnyFy"
   - Select your app (iOS/Android) or create a new app

### Step 3: Navigate to Webhooks Settings

1. In the left sidebar, click **"Integrations"**
2. Click on **"Webhooks"** tab (or section)
3. Or go directly: **Integrations → Webhooks**

### Step 4: Find or Create Webhook

#### Option A: If Webhook Already Exists

1. You'll see a list of webhooks
2. Find your webhook (or create one - see Option B)
3. Click on the webhook to view details
4. Look for **"Webhook Secret"**, **"Signing Secret"**, or **"Secret"**
5. Copy the secret (it looks like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### Option B: Create New Webhook

1. Click **"Add Webhook"** or **"Create Webhook"** button
2. Fill in the required fields:

   **Webhook Name:**
   ```
   FunnyFy Production Webhook
   ```
   (For staging: `FunnyFy Staging Webhook`)

   **Webhook URL:**
   ```
   https://funnyfyapp.vercel.app/api/webhooks/revenuecat
   ```
   (For staging: `https://funnyfy-staging.vercel.app/api/webhooks/revenuecat`)

   **Authorised Header:**
   ```
   Authorization
   ```
   (This is the header name that will contain the webhook secret)

   **Environment to send events for:**
   - Select **Production** (for production webhook)
   - Or **Sandbox** (for testing/staging)

   **Event Filter:**
   - Select the events you want to receive:
     - ✅ `INITIAL_PURCHASE` - When user first subscribes
     - ✅ `RENEWAL` - When subscription auto-renews
     - ✅ `CANCELLATION` - When user cancels subscription
     - ✅ `UNCANCELLATION` - When user reactivates cancelled subscription
     - ✅ `EXPIRATION` - When subscription expires
     - ✅ `BILLING_ISSUE` - When payment fails (optional but recommended)

3. Click **"Save"** or **"Create"**
4. After creating, the webhook secret will be displayed
5. **Copy it immediately** - you may not be able to see it again!

### Step 5: Copy the Webhook Secret

The webhook secret will look like:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or sometimes:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: 
- Copy the entire string (including `whsec_` prefix)
- This is what you'll use for `REVENUECAT_WEBHOOK_SECRET`

---

## Visual Guide

```
RevenueCat Dashboard
├─ Projects
│  └─ FunnyFy Project
│     └─ Integrations (left sidebar)
│        └─ Webhooks Tab
│           ├─ Webhook URL: https://funnyfyapp.vercel.app/api/webhooks/revenuecat
│           └─ Webhook Secret: whsec_xxxxxxxxxxxxx ← Copy this!
```

---

## Add to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Enter:
   - **Key**: `REVENUECAT_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxx` (the secret you copied)
   - **Environments**: Select Production, Preview, Development
4. Click **"Save"**
5. **Redeploy** your project for changes to take effect

---

## Verify Webhook is Working

### Test the Webhook Endpoint

```bash
# Test if endpoint is accessible
curl https://funnyfyapp.vercel.app/api/webhooks/revenuecat

# Should return: {"ok":false,"error":"Method not allowed"} (because it requires POST)
```

### Test with RevenueCat

1. In RevenueCat Dashboard → Webhooks
2. Click **"Test Webhook"** or **"Send Test Event"**
3. Check your Vercel logs to see if the webhook was received
4. Check your database to see if subscription was created/updated

---

## Troubleshooting

### "Webhook Secret Not Found"

**Solution**:
- If you created the webhook but didn't copy the secret, you may need to:
  1. Delete the webhook
  2. Create a new one
  3. Copy the secret immediately

### "Invalid Webhook Signature"

**Solution**:
- Verify `REVENUECAT_WEBHOOK_SECRET` in Vercel matches the secret in RevenueCat
- Make sure you copied the entire secret (including `whsec_` prefix)
- Redeploy after adding the secret

### "Webhook Not Receiving Events"

**Solution**:
- Verify webhook URL is correct in RevenueCat
- Check that webhook URL is publicly accessible (not behind auth)
- Check Vercel function logs for errors
- Verify events are enabled in RevenueCat webhook settings

### "Can't See Webhook Secret"

**Solution**:
- Some RevenueCat interfaces hide the secret after creation
- You may need to:
  1. Regenerate the secret (if option available)
  2. Or delete and recreate the webhook
  3. Copy the secret immediately when it's shown

---

## Security Notes

1. **Never commit** the webhook secret to git
2. **Use different secrets** for staging and production
3. **Rotate secrets** if you suspect they're compromised
4. **Keep secrets secure** - treat them like passwords

---

## Alternative: If Webhook Secret is Not Visible

If RevenueCat doesn't show a webhook secret:

1. **Check RevenueCat Documentation**: They may have changed the interface
2. **Contact RevenueCat Support**: They can help you find or regenerate the secret
3. **Check API Keys Section**: Sometimes secrets are in a different section
4. **Use API to Get Secret**: RevenueCat API may have an endpoint to retrieve it

---

## Quick Checklist

- [ ] Logged into RevenueCat Dashboard
- [ ] Selected correct project
- [ ] Navigated to Integrations → Webhooks
- [ ] Created webhook with correct URL
- [ ] Copied webhook secret
- [ ] Added `REVENUECAT_WEBHOOK_SECRET` to Vercel
- [ ] Redeployed Vercel project
- [ ] Tested webhook endpoint

---

## Need More Help?

- [RevenueCat Webhooks Documentation](https://docs.revenuecat.com/docs/webhooks)
- [RevenueCat Support](https://www.revenuecat.com/support)
- Check your Vercel function logs for webhook errors

---

**Last Updated**: January 2025
