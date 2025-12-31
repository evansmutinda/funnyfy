# Where to Find RevenueCat Production Keys

## Quick Answer

Production SDK keys are in the same place as test keys, but you need to:
1. Make sure you have production products set up
2. Look for keys without "test_" prefix
3. They'll be platform-specific (`goog_...` for Android, `appl_...` for iOS)

---

## Step-by-Step: Finding Production Keys

### Step 1: Go to RevenueCat Dashboard

1. Visit: https://app.revenuecat.com/
2. Sign in to your account
3. Select your project

### Step 2: Navigate to API Keys

1. Click **"Settings"** in the left sidebar
2. Click **"API Keys"** (under Settings)

### Step 3: Look for Production SDK Keys

In the API Keys page, you'll see different sections:

#### Option A: If You See Separate Sections

```
┌─────────────────────────────────────┐
│ SDK Keys (Public)                   │
├─────────────────────────────────────┤
│ Google Play Store SDK Key:          │
│ goog_xxxxxxxxxxxxxxxxxxxxx          │ ← Production Android key
│                                     │
│ Apple App Store SDK Key:            │
│ appl_xxxxxxxxxxxxxxxxxxxxx          │ ← Production iOS key
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Test Keys                           │
├─────────────────────────────────────┤
│ test_xxxxxxxxxxxxxxxxxxxxx          │ ← Test key (universal)
└─────────────────────────────────────┘
```

**Use the keys from "SDK Keys (Public)" section** - these are production keys.

---

#### Option B: If You Only See Test Keys

If you only see `test_xxxxxxxx`, it means:
- **Production keys are not available yet** because:
  1. You haven't set up production products in App Store Connect / Google Play Console
  2. Products haven't been approved/published yet
  3. RevenueCat hasn't generated production keys yet

**To get production keys, you need to:**

1. **Set up products in app stores:**
   - Google Play Console → Your app → Monetize → Products → Subscriptions
   - App Store Connect → Your app → Subscriptions
   
2. **Create subscription products** (Starter, Popular, Pro)

3. **Link them in RevenueCat:**
   - RevenueCat Dashboard → Products
   - Add your App Store / Play Store products
   - RevenueCat will automatically generate production keys

4. **Wait for keys to appear:**
   - After products are linked and approved
   - Production SDK keys will appear in Settings → API Keys

---

## Key Formats

### Production Keys (What You're Looking For)
- **Android**: Starts with `goog_` (e.g., `goog_abc123xyz...`)
- **iOS**: Starts with `appl_` (e.g., `appl_def456uvw...`)
- Platform-specific (different keys for Android and iOS)

### Test Keys (What You Have Now)
- Format: `test_xxxxx` (universal, works for both platforms)
- Or: `test_goog_...` / `test_appl_...` (platform-specific test keys)

---

## When Do You Need Production Keys?

**Production keys are needed when:**
- ✅ Publishing to Google Play Store (production release)
- ✅ Publishing to App Store (production release)
- ✅ Using production build profile
- ✅ Testing with real purchases (not sandbox)

**Test keys are fine for:**
- ✅ Development/testing
- ✅ Preview builds
- ✅ TestFlight / Internal Testing tracks
- ✅ Sandbox purchases

---

## If Production Keys Don't Exist Yet

If you don't see production keys in RevenueCat:

1. **Check if products are set up:**
   - RevenueCat Dashboard → Products
   - Make sure you have products configured
   
2. **Check app store setup:**
   - Products need to exist in App Store Connect / Google Play Console
   - Products need to be linked in RevenueCat

3. **Wait for approval:**
   - Sometimes keys appear after products are reviewed/approved

4. **Contact RevenueCat support:**
   - If products are set up but keys don't appear
   - RevenueCat support can help generate them

---

## Setting Production Keys as EAS Secrets

Once you have production keys:

```powershell
cd apps/mobile

# Set production Android key
eas secret:create --scope project \
  --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY \
  --value "goog_xxxxxxxxxxxxxxxxxxxxx" \
  --type string --force \
  --environment production

# Set production iOS key
eas secret:create --scope project \
  --name EXPO_PUBLIC_REVENUECAT_IOS_KEY \
  --value "appl_xxxxxxxxxxxxxxxxxxxxx" \
  --type string --force \
  --environment production
```

Note: Use `--environment production` flag to set production-specific secrets.

---

## Summary

| Location | What to Look For |
|----------|------------------|
| **RevenueCat Dashboard** | Settings → API Keys |
| **Production Android Key** | `goog_xxxxxxxxxxxxxxxxxxxxx` |
| **Production iOS Key** | `appl_xxxxxxxxxxxxxxxxxxxxx` |
| **If Not Visible** | Need to set up products in app stores first |

**For now (testing):** Use test keys with preview builds - that's the correct setup!

**For production (later):** Get production keys after setting up products in app stores.

