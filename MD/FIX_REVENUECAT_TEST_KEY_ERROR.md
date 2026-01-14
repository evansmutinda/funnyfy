# Fix RevenueCat "Wrong API Key" Error

## The Error

You're seeing: **"This app is using a test API key... The app will close now to protect the security of test purchases."**

## Why This Happens

RevenueCat blocks test keys in **production/release builds** as a security measure. This is normal behavior.

## Solution: Use Development Build Profile

For testing with test keys, you need to build using the **development** profile instead of **preview** or **production**.

---

## Quick Fix

### Option 1: Build Development APK (Recommended for Testing)

Update your build script or run:

```powershell
cd apps/mobile
eas build --profile development --platform android
```

**Note**: Development builds require a development client. If you don't have one set up, use Option 2.

### Option 2: Use Preview Build (Easier)

The preview profile should work with test keys. Make sure you're using the preview profile:

```powershell
.\build-apk.ps1 -Profile preview
```

Or manually:
```powershell
cd apps/mobile
eas build --profile preview --platform android
```

### Option 3: Temporarily Disable RevenueCat Check (Not Recommended)

If you need to test with production build, you can modify the app to skip RevenueCat initialization in development mode, but this is not recommended.

---

## Check Your Build Profile

Your `eas.json` has these profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**For testing with test keys:**
- ✅ Use `preview` profile (should work)
- ✅ Use `development` profile (if you have dev client)
- ❌ Don't use `production` profile (blocks test keys)

---

## Update Build Script

I can update `build-apk.ps1` to default to preview profile for testing. Would you like me to do that?

---

## Alternative: Get Production Keys (For Production Builds)

If you need to test production builds, you'll need production SDK keys from RevenueCat:

1. Go to RevenueCat Dashboard
2. Settings → API Keys
3. Look for production SDK keys (not test keys)
4. These will be platform-specific: `goog_...` for Android, `appl_...` for iOS

**But for testing, stick with preview builds and test keys!**

---

## Summary

**For Testing:**
- ✅ Use `preview` build profile
- ✅ Use test keys (`test_xxxxx`)
- ✅ This is the correct setup for testing

**For Production:**
- Use `production` build profile
- Use production SDK keys
- Test keys won't work in production builds (by design)

The error you're seeing is RevenueCat protecting you from accidentally using test keys in production. For testing, use the preview build profile.

