# RevenueCat Key Types - Which One Do I Need?

## Quick Answer: SDK API Keys (Public Keys)

For your mobile app, you need **SDK API Keys** (also called Public Keys).

---

## Key Types Explained

### ✅ SDK API Keys (Public Keys) - **USE THESE**

**What they are:**
- Public keys that are safe to include in your mobile app
- Used by the RevenueCat SDK in your React Native app
- Can be embedded in the app bundle (APK/IPA)

**Where to find:**
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Select your project
3. Go to **Settings** → **API Keys**
4. Look for **"SDK Keys"** or **"Public API Keys"** section

**Format:**
- Android: Starts with `goog_` (production) or `test_goog_` (testing)
- iOS: Starts with `appl_` (production) or `test_appl_` (testing)

**Example:**
```
Android: goog_xxxxxxxxxxxxxxxxxxxxx
iOS: appl_xxxxxxxxxxxxxxxxxxxxx
```

**Use for:**
- Setting `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- Setting `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- Including in EAS secrets for builds

---

### ❌ Secret API Keys - **DO NOT USE THESE**

**What they are:**
- Private keys for server-side operations only
- Used for webhooks, REST API calls, admin operations
- Should NEVER be included in mobile apps

**Where to find:**
- Same location (Settings → API Keys) but in a different section
- Usually labeled as "Secret API Key" or "Server-Side Key"

**Format:**
- Usually starts with `sk_` or similar
- Much longer than SDK keys

**Use for:**
- Backend webhook verification (`REVENUECAT_WEBHOOK_SECRET`)
- Server-side API calls
- Admin operations

---

## Visual Guide

In RevenueCat Dashboard → Settings → API Keys, you'll see:

```
┌─────────────────────────────────────┐
│ SDK Keys (Public)                  │
│ ✅ Use these for mobile app         │
├─────────────────────────────────────┤
│ Google Play Store SDK Key:          │
│ goog_xxxxxxxxxxxxxxxxxxxxx          │
│                                     │
│ Apple App Store SDK Key:            │
│ appl_xxxxxxxxxxxxxxxxxxxxx          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Secret API Key                      │
│ ❌ Do NOT use in mobile app         │
├─────────────────────────────────────┤
│ Secret Key:                          │
│ sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx    │
│ (Use for webhooks/server only)      │
└─────────────────────────────────────┘
```

---

## For Your Setup

When running `setup-eas-secrets.ps1` or manually setting secrets:

```powershell
# ✅ Use SDK Keys (Public Keys)
eas secret:create --scope project \
  --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY \
  --value "goog_xxxxxxxxxxxxxxxxxxxxx" \
  --type string

eas secret:create --scope project \
  --name EXPO_PUBLIC_REVENUECAT_IOS_KEY \
  --value "appl_xxxxxxxxxxxxxxxxxxxxx" \
  --type string
```

---

## Testing vs Production

**For Testing:**
- Use test SDK keys (start with `test_goog_` or `test_appl_`)
- These work with sandbox/test purchases

**For Production:**
- Use production SDK keys (start with `goog_` or `appl_`)
- These work with real App Store/Play Store purchases

---

## Summary

| Key Type | Use In Mobile App? | Format | Purpose |
|----------|-------------------|--------|---------|
| **SDK Keys (Public)** | ✅ YES | `goog_...` or `appl_...` | Mobile app SDK |
| **Secret API Keys** | ❌ NO | `sk_...` | Server/webhooks only |

**For your APK build, use SDK Keys (Public Keys)!**

