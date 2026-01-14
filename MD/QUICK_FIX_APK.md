# Quick Fix for APK Issues

## Issue 1: User Verification Failed
**Fix**: Create test user in database

## Issue 2: RevenueCat Keys Missing  
**Fix**: Set EAS secrets

---

## Quick Fix Steps

### Step 1: Create Test User in Database

Run this SQL in your database (via Vercel dashboard or database client):

```sql
INSERT INTO users (
  revenuecat_user_id,
  subscription_tier,
  subscription_status,
  trial_generations_used,
  billing_date,
  created_at,
  updated_at
)
VALUES (
  'test-user-123',
  'trial',
  'trial',
  0,
  CURRENT_DATE,
  NOW(),
  NOW()
)
ON CONFLICT (revenuecat_user_id) 
DO UPDATE SET
  subscription_status = 'trial',
  trial_generations_used = 0,
  updated_at = NOW();
```

**Or use the SQL file**: Run `api/create-test-user.sql` in your database.

---

### Step 2: Set RevenueCat Keys as EAS Secrets

**Option A: Use the setup script (Easiest)**

```powershell
.\setup-eas-secrets.ps1
```

The script will prompt you for your RevenueCat keys.

**Option B: Manual setup**

```powershell
cd apps/mobile

# Get your keys from: https://app.revenuecat.com/ → Settings → API Keys
# If you only see test_xxxxx (universal test key), use the same key for both Android and iOS

# Set Android key (use test key for both if that's all you have)
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "test_xxxxxxxx" --type string --force

# Set iOS key (use the same test key)
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "test_xxxxxxxx" --type string --force

# Set API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://funnyfyapp.vercel.app" --type string --force
```

**Note**: If you only have one test key (e.g., `test_xxxxxxxx`), use the same key for both Android and iOS. This is normal for testing!

---

### Step 3: Rebuild APK

```powershell
.\build-apk.ps1
```

---

### Step 4: Install and Test

1. Install the new APK
2. Try generating an image → Should work now
3. Try opening subscription screen → Should not show missing key error

---

## Get Your RevenueCat Keys

**IMPORTANT: You need SDK API Keys (Public Keys), NOT Secret API Keys!**

1. Go to https://app.revenuecat.com/
2. Select your project
3. Go to **Settings** → **API Keys**
4. Look for the **SDK Keys** section (NOT the Secret API Keys section)
5. Copy the SDK key(s):
   - **If you see separate keys**: Copy Google Play Store key (Android) and Apple App Store key (iOS)
   - **If you only see `test_xxxxx`**: This is a universal test key - use the same key for both Android and iOS (this is normal for testing!)

**Key Formats:**
- Test keys: `test_xxxxxxxx` (universal, works for both platforms) OR `test_goog_...` / `test_appl_...` (platform-specific)
- Production keys: `goog_...` (Android) and `appl_...` (iOS) - these are platform-specific

**For Testing:**
- ✅ Use `test_xxxxxxxx` for both Android and iOS if that's what you have
- ✅ This is perfectly fine - test keys can be universal

**Key Types:**
- ✅ **SDK Keys** (Public) - Use these! Safe to include in mobile apps
- ❌ **Secret API Keys** - Do NOT use these! These are for server-side only

---

## Verify Everything Works

**Check secrets are set:**
```powershell
cd apps/mobile
eas secret:list
```

**Check user exists in database:**
```sql
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
-- OR
SELECT * FROM users WHERE revenuecat_user_id = 'test-user-123';
```

---

## Need Help?

- **Database**: Access via Vercel dashboard → Your project → Storage/Postgres
- **RevenueCat**: Make sure you're copying SDK keys (not API keys)
- **EAS**: Make sure you're logged in (`eas login`)

