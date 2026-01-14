# Fix APK Issues - User Authentication & RevenueCat Keys

## Issue 1: User Verification Failed

**Problem**: The app uses `test-user-123` but the backend requires a UUID format and the user doesn't exist in the database.

**Solution**: Create a test user in your database with a UUID that matches the app.

---

## Fix Issue 1: Create Test User in Database

### Option A: Using SQL (Recommended)

Run this SQL in your database to create the test user:

```sql
-- Create test user (using UUID format)
INSERT INTO users (
  id,
  revenuecat_user_id,
  subscription_tier,
  subscription_status,
  trial_generations_used,
  billing_date,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),  -- Generate a new UUID
  'test-user-123',    -- This matches what the app sends
  'trial',            -- Start as trial user
  'trial',
  0,                  -- No generations used yet
  CURRENT_DATE,       -- Billing date (for trial, this is just a placeholder)
  NOW(),
  NOW()
)
ON CONFLICT (revenuecat_user_id) 
DO UPDATE SET
  subscription_status = 'trial',
  trial_generations_used = 0,
  updated_at = NOW();
```

### Option B: Using the Test Endpoint

You can also create the user by calling your test webhook endpoint:

```bash
curl -X POST https://funnyfyapp.vercel.app/api/test-revenuecat-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "tier": "starter",
    "platform": "test"
  }'
```

**Note**: The backend validation requires UUID format, but since the user lookup allows `revenuecat_user_id`, we need to ensure the user exists with that ID.

---

## Issue 2: RevenueCat SDK Keys Missing

**Problem**: Environment variables (`EXPO_PUBLIC_REVENUECAT_*`) are not included in the APK build.

**Solution**: Set them as EAS secrets so they're included in builds.

---

## Fix Issue 2: Set EAS Secrets for RevenueCat Keys

### Step 1: Get Your RevenueCat Keys

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Select your project
3. Go to **Settings** → **API Keys**
4. Copy your keys:
   - **Apple App Store** key (iOS)
   - **Google Play Store** key (Android)

For testing, you can use test keys (they start with `test_`).

### Step 2: Set EAS Secrets

Open PowerShell in the project root and run:

```powershell
cd apps/mobile

# Set Android key (for preview/testing builds)
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "your-android-key-here" --type string

# Set iOS key (for preview/testing builds)
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "your-ios-key-here" --type string

# Optional: Set API URL if different
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://funnyfyapp.vercel.app" --type string
```

**Important Notes**:
- Replace `your-android-key-here` and `your-ios-key-here` with your actual RevenueCat keys
- These secrets will be available to all builds (preview and production)
- For production builds, you can set production-specific secrets using `--environment production`

### Step 3: Rebuild the APK

After setting the secrets, rebuild your APK:

```powershell
.\build-apk.ps1
```

The new APK will include the RevenueCat keys.

---

## Quick Fix Script

I'll create a PowerShell script to automate the EAS secret setup. But first, make sure you have your RevenueCat keys ready.

---

## Verification Steps

After fixing both issues:

1. **Test User Created**: 
   - Query your database: `SELECT * FROM users WHERE revenuecat_user_id = 'test-user-123';`
   - Should return one user record

2. **RevenueCat Keys Set**:
   - Run: `eas secret:list` (in apps/mobile directory)
   - Should show `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` and `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

3. **Rebuild APK**:
   - Run: `.\build-apk.ps1`
   - Install new APK
   - Try generating an image (should work now)
   - Try opening subscription screen (should not show missing key error)

---

## Alternative: Update Test User ID to UUID

If you prefer to use a UUID in the app instead, you can:

1. Generate a UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
2. Update `apps/mobile/App.js`:
   ```javascript
   const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
   ```
3. Create user in database with that UUID as the `id` and `revenuecat_user_id`

But the current approach (using `test-user-123` as revenuecat_user_id) should work once the user exists in the database.

---

## Need Help?

- **Database access**: Check your Vercel project dashboard for database connection string
- **RevenueCat keys**: Make sure you're copying the correct keys from RevenueCat dashboard
- **EAS secrets**: Run `eas secret:list` to see what secrets are currently set

