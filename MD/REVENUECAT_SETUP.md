# RevenueCat Configuration Guide for FunnyFy

This guide documents how FunnyFy is wired to RevenueCat (mobile SDK + backend webhooks), and the exact configuration steps in the RevenueCat dashboard.

---

## 1. Create / Use RevenueCat Project

1. Go to `https://app.revenuecat.com`.
2. Create a **new project** (e.g. `FunnyFy`) or select your existing one.
3. Under **API Keys**, note:
   - **Secret API Key** (`rc_secret_...`) → used **only on the backend** (not yet wired).
   - **SDK API Key** (Test Store) → used in the **mobile app**.

For now we are using **one Test Store SDK key** for both iOS and Android.

---

## 2. Configure SDK Keys for the Mobile App

In `apps/mobile/.env` (or via your shell environment when running Expo), set:

```env
EXPO_PUBLIC_API_URL=https://funnyfyapp.vercel.app

EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=test_kXXXX...   # Your RevenueCat Test SDK key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_kXXXX...       # Same key is fine for now
```

Notes:

- These `EXPO_PUBLIC_*` vars are read by Expo and exposed as `process.env.EXPO_PUBLIC_...` in `App.js`.
- The mobile SDK is configured in `apps/mobile/services/revenuecat.js` using these keys.

---

## 3. Product Catalog: Entitlements, Products, Offerings

RevenueCat’s **Product Catalog** has three main pieces we use:

- **Entitlements** – “rights” a user gets (e.g. `starter`, `popular`, `pro`).
- **Products** – store products (Test Store, App Store, Play Store).
- **Offerings** – bundles of products that the app shows to the user.

Our app calls `Purchases.getOfferings()` and uses the **current offering’s packages** to show subscription options.

### 3.1 Create Entitlements

In RevenueCat:

1. Go to **Product Catalog → Entitlements**.
2. Click **New entitlement**.
3. Create at least:
   - `starter`
   - `popular`
   - `pro`

These names correspond to the tiers we use on the backend.

### 3.2 Create Test Store Products

In **Product Catalog → Products**:

1. Click **New product**.
2. For each tier, create a **Test Store** product:

   Example:

   - **Product 1**
     - Store: **Test**
     - Product ID: `starter_monthly`
     - Entitlement: `starter`
     - Price: e.g. `$4.99`

   - **Product 2**
     - Store: **Test**
     - Product ID: `popular_monthly`
     - Entitlement: `popular`
     - Price: e.g. `$9.99`

   - **Product 3**
     - Store: **Test**
     - Product ID: `pro_monthly`
     - Entitlement: `pro`
     - Price: e.g. `$24.99`

3. Save each product and ensure it is linked to the correct entitlement.

### 3.3 Configure an Offering

In **Product Catalog → Offerings**:

1. Open the default offering (or create one) – for example, name it `default`.
2. Make sure this offering is marked as **Current** (this is what `getOfferings().current` returns).
3. Inside the offering, add **Packages**:

   Example configuration:

   - Package 1:
     - Identifier: `monthly`
     - Product: `starter_monthly` (entitlement `starter`)

   Optionally, you can add more packages (e.g. `popular_monthly`, `pro_monthly`) depending on how you want to present plans in the app.

4. Save the offering.

After this, `Purchases.getOfferings()` in the app should return:

- `offerings.current` = `default`
- `offerings.current.availablePackages` = list containing at least the `monthly` package.

The app currently picks the **first package** and calls `purchasePackage` on it.

---

## 4. Webhook Configuration (Backend Sync)

We use a RevenueCat webhook to keep the backend database in sync with subscription events.

### 4.1 Create Webhook in RevenueCat

In RevenueCat → **Integrations → Webhooks**:

1. Click **Add Webhook** / **Create Webhook**.
2. Fill out:

   - **Webhook Name**:
     ```text
     FunnyFy Staging Webhook
     ```
   - **Webhook URL (staging)**:
     ```text
     https://funnyfy-staging.vercel.app/api/webhooks/revenuecat
     ```
   - **Authorization header value**:
     - Choose any long random secret, e.g.:
       ```text
       my-super-secret-rc-token
       ```
     - RevenueCat will send:
       ```http
       Authorization: my-super-secret-rc-token
       ```
   - **Environment**:
     - Use **Sandbox** for staging/testing.
   - **Events**: enable at least:
     - `INITIAL_PURCHASE`
     - `RENEWAL`
     - `CANCELLATION`
     - `UNCANCELLATION`
     - `EXPIRATION`
     - `BILLING_ISSUE` (optional but recommended)

3. Save the webhook.

### 4.2 Add Matching Secret to Vercel (Staging)

In the **staging** Vercel project (`funnyfy-staging`):

1. Go to **Settings → Environment Variables**.
2. Add or update:

   ```text
   REVENUECAT_WEBHOOK_SECRET=my-super-secret-rc-token
   ```

3. Select **Production** and **Preview** environments.
4. Click **Save** and **Redeploy** the staging project.

Our backend handler in `api/webhooks/revenuecat.ts` reads:

- `req.headers['authorization']` (full value)
- Compares it to:
  - `REVENUECAT_WEBHOOK_SECRET` (bare), or
  - `Bearer ${REVENUECAT_WEBHOOK_SECRET}`

So either of these are valid Authorization header values in RevenueCat:

```text
my-super-secret-rc-token
Bearer my-super-secret-rc-token
```

Just make sure the **env var in Vercel** contains the bare secret (`my-super-secret-rc-token`).

### 4.3 Verify Webhook

1. From RevenueCat → Webhooks → your FunnyFy webhook → **Send test event**.
2. In Vercel logs (staging project), you should see:

   ```text
   [revenuecat-webhook] Received event: TEST
   [revenuecat-webhook] Unhandled event type: TEST
   ```

   (No more “Invalid signature” errors.)

3. When real purchases happen (`INITIAL_PURCHASE`, `RENEWAL`, etc.), the handler will:
   - Upsert users in the `users` table.
   - Create/update rows in `subscriptions`.
   - Log history in `subscription_history`.
   - Reset usage quotas on renewals using `usage_tracking`.

---

## 5. How the Pieces Fit Together

High-level flow:

1. **User installs app** → App initializes RevenueCat SDK with Test Store key.
2. **User opens “Manage Subscription”**:
   - App calls `Purchases.getOfferings()` → gets current offering + packages.
   - User purchases a package via RevenueCat Test Store.
3. **RevenueCat processes purchase**:
   - Sends webhook to `https://funnyfy-staging.vercel.app/api/webhooks/revenuecat` with event.
   - Backend updates `users` / `subscriptions` / `usage_tracking`.
4. **App checks subscription status**:
   - Calls `GET /api/user/subscription` (with `x-user-id` / auth) to see current tier and remaining usage.

This MD file is the canonical reference for setting up RevenueCat for FunnyFy (staging); for production, repeat with production keys, products, and URLs.

---

**Last Updated**: January 2025

