# Environment Variables Setup

## Local Development

The app uses environment variables from `.env` file in this directory (`apps/mobile/.env`).

**Important:** The `.env` file is gitignored and should never be committed. Copy `env.example` to `.env` and fill in your real values.

### Required Variables

- `EXPO_PUBLIC_API_URL` - Your backend API URL
  - **Staging**: `https://funnyfy-staging.vercel.app` (for testing)
  - **Production**: `https://funnyfyapp.vercel.app` (when ready)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` - RevenueCat Android SDK key
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` - RevenueCat iOS SDK key
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry React Native DSN (org `funnyfy`, project `react-native`)
- `EXPO_PUBLIC_SENTRY_ENV` - Sentry environment label (`staging` or `production`)
- `EXPO_PUBLIC_SENTRY_ENABLED` - Set `true` so debug APKs send events (`__DEV__` builds skip Sentry otherwise)

See `To do/SENTRY_INTEGRATION.md` for testing and optional `EXPO_PUBLIC_SENTRY_TEST`.

### Setup Steps

1. Copy the example file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` - **Start with STAGING values** (already set in `env.example`):
   ```
   # STAGING (for testing)
   EXPO_PUBLIC_API_URL=https://funnyfy-staging.vercel.app
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=test_kDONbOMshuIcMeJIywMnnVsYOxu
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_kDONbOMshuIcMeJIywMnnVsYOxu
   ```

3. **Get your staging Vercel URL:**
   - If you have a separate staging Vercel project, use that URL
   - Or use a Vercel preview deployment URL (from a staging branch)
   - Or create a staging project: `vercel --prod=false` (creates preview URL)

4. **Get your RevenueCat test keys:**
   - Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
   - Select your project
   - Go to **Project Settings** → **API Keys**
   - Copy the **Public SDK Keys** (these are safe for client-side use)
   - Use the **test/sandbox keys** for staging

5. Restart Expo (`expo start`) for changes to take effect.

### Switching Between Staging and Production

To switch environments, just update your `.env` file:

**For Staging (testing):**
```env
EXPO_PUBLIC_API_URL=https://funnyfyapp-staging.vercel.app
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=test_android_key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_ios_key
```

**For Production:**
```env
EXPO_PUBLIC_API_URL=https://funnyfyapp.vercel.app
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=prod_android_key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=prod_ios_key
```

## EAS Builds

For EAS builds, you need to set secrets via EAS CLI. **Set staging secrets first for testing:**

### Staging Secrets (for testing)

```bash
# Set staging secrets for development/preview builds
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://funnyfyapp-staging.vercel.app" --type string
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "test_android_key" --type string
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "test_ios_key" --type string
```

### Production Secrets (when ready)

```bash
# Set production secrets (use different profile or update after staging tests pass)
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://funnyfyapp.vercel.app" --type string --environment production
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "prod_android_key" --type string --environment production
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "prod_ios_key" --type string --environment production
```

**Note:** EAS secrets are automatically injected into your builds. For staging, use the `development` or `preview` build profiles. For production, use the `production` profile.

## Getting Your RevenueCat Keys

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Select your project
3. Go to **Project Settings** → **API Keys**
4. Copy the **Public SDK Keys** for iOS and Android

**Note:** Use the **Public SDK Keys** (not the Secret API Key). The Public SDK Keys are safe to use in client-side code.

