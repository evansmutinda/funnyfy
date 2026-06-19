# RevenueCat Test Key Setup - Using Universal Test Keys

## You Only See `test_xxxxxxxx`? That's Fine!

If you only see a test key like `test_xxxxxxxx` in RevenueCat, that's perfectly normal for testing. This is a **universal test key** that works for both Android and iOS.

---

## What You're Seeing

In RevenueCat Dashboard → Settings → API Keys, you might see:

```
SDK Keys (Public)
─────────────────
Test Key: test_xxxxxxxxxxxxxxxxxxxxx
```

**This is a universal test key** - use the same key for both Android and iOS.

---

## How to Set It Up

### Using the Setup Script

When running `.\setup-eas-secrets.ps1`, just enter the same `test_xxxxxxxx` key for both Android and iOS prompts:

```
Enter your RevenueCat Android SDK Key:
> test_xxxxxxxxxxxxxxxxxxxxx

Enter your RevenueCat iOS SDK Key:
> test_xxxxxxxxxxxxxxxxxxxxx  (same key!)
```

### Manual Setup

```powershell
cd apps/mobile

# Use the same test key for both Android and iOS
eas secret:create --scope project \
  --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY \
  --value "test_xxxxxxxxxxxxxxxxxxxxx" \
  --type string --force

eas secret:create --scope project \
  --name EXPO_PUBLIC_REVENUECAT_IOS_KEY \
  --value "test_xxxxxxxxxxxxxxxxxxxxx" \
  --type string --force

# Set API URL
eas secret:create --scope project \
  --name EXPO_PUBLIC_API_URL \
  --value "https://funnyfyapp.vercel.app" \
  --type string --force
```

---

## Test Keys vs Production Keys

### Test Keys (What You Have Now)
- ✅ Universal: One key works for both Android and iOS
- ✅ Format: `test_xxxxxxxx` or `test_goog_...` / `test_appl_...`
- ✅ Use for: Sandbox/test purchases in **debug APK** or EAS dev builds (Expo Go is smoke-test only)
- ✅ Works with: Sandbox/test purchases (free)

### Production Keys (Later, When You Launch)
- Platform-specific: Separate keys for Android and iOS
- Format: `goog_...` (Android) and `appl_...` (iOS)
- Use for: Production app store releases
- Works with: Real purchases

---

## Verify Your Setup

After setting the secrets, verify they're set correctly:

```powershell
cd apps/mobile
eas secret:list
```

You should see:
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` = `test_xxxxxxxx`
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` = `test_xxxxxxxx` (same value)
- `EXPO_PUBLIC_API_URL` = your API URL

---

## Summary

✅ **If you only see `test_xxxxxxxx`**: Use the same key for both Android and iOS  
✅ **This is normal for testing**  
✅ **Works perfectly fine**  
✅ **You'll get platform-specific keys when you set up production products in RevenueCat**

---

## Next Steps

1. Set the same test key for both platforms using `setup-eas-secrets.ps1`
2. Rebuild your APK: `.\build-apk.ps1`
3. Test the app - RevenueCat should work now!

When you're ready for production, RevenueCat will provide platform-specific keys in the same Settings → API Keys section.

