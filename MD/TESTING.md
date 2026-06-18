# Testing Guide

## Environments

| Environment | URL |
|-------------|-----|
| Staging | `https://funnyfy-staging.vercel.app` |
| Production | `https://funnyfyapp.vercel.app` |
| Admin | `<env-url>/admin/login` |

**Note**: The mobile app `.env` file sets which backend it connects to. Default for testing is staging.

---

## Method 1: Test the API Directly (Quick Check)

### Using PowerShell (Windows)

```powershell
# Test auth (creates/returns user + JWT)
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/auth/token" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{}'

# Test styles catalog
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/styles" -Method GET

# Test subscription status (replace with real token from auth above)
$headers = @{ "Authorization" = "Bearer YOUR-TOKEN" }
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/user/subscription" `
  -Headers $headers
```

### Using curl (Linux/Mac/WSL)

```bash
curl -X POST https://funnyfy-staging.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Method 2: Test from Mobile App (Expo Go or Dev Build)

### Step 1: Set Environment

In `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://funnyfy-staging.vercel.app
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=test_kXXXX...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_kXXXX...
```

### Step 2: Install Dependencies

```bash
cd apps/mobile
npm install
```

### Step 3: Start Expo

```bash
npm start
```

Scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app (then Expo Go)

### Step 4: Test Key Flows

1. **Auth flow**: `[AUTH_DEBUG] hasToken: true` in Metro logs; no `resetAuthIfLocal is not a function`
2. **Style selection**: Tap any style, verify selection highlights
3. **Image upload**: Pick from gallery (Android 13+: system picker, no extra permission) or camera
4. **Generation**: `POST /api/enqueue` then poll `/api/job` — pulsing squares loader
5. **Result**: Slider, save (silent — no "modify photo?" on Android), share
6. **Gallery**: Saved images in in-app grid + Funnyfy device album
7. **Subscription**: Purchase updates plan without manual refresh; Restore syncs to backend

---

## Method 3: Build and Test APK (Android)

### Local build (no EAS quota)

```powershell
cd apps/mobile
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`  
See `BUILD_APK_GUIDE.md` or run `.\build-apk-local.ps1` from project root.

### EAS cloud build

```bash
cd apps/mobile
eas build --platform android --profile preview
```

---

## Testing Subscription Flows

### RevenueCat Test Store (Sandbox)
1. Use the Test Store SDK key in `.env`
2. Open the Subscription screen in the app
3. Complete purchase (RevenueCat Test Store)
4. Plan should update automatically; if not, tap **Refresh**
5. Check logs: `[subscription] Synced to backend` and `[subscription] response: ... "isTrial":false`

Manual sync endpoint (recovery):

```powershell
$headers = @{ "Authorization" = "Bearer YOUR-TOKEN"; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/sync-subscription" `
  -Method POST -Headers $headers `
  -Body '{"userId":"YOUR-USER-ID","productId":"popular_monthly","tier":"popular","platform":"android"}'
```

### Verify Webhook
```powershell
# Trigger a test event from RevenueCat dashboard → Integrations → Webhooks → Send test event
# Then check Vercel function logs for:
# [revenuecat-webhook] Received event: TEST
```

---

## Testing NSFW Moderation

Upload an image via the app. If Sightengine returns `nudity.raw >= 0.3`, you'll see the toast:
> "This image cannot be processed. Please use an appropriate photo."

Check Supabase `infringements` table to verify the record was created.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `[Auth] Backend unavailable, using local ID` | Use staging URL; fix `DATABASE_URL` on Vercel for production |
| `sync skipped — no backend userId` | Wait for splash/auth; update app (auth gating fix) |
| `AUTHENTICATION_REQUIRED` | No JWT — check auth token; use staging backend |
| `resetAuthIfLocal is not a function` | Remove `services/auth.ts` if present; use `auth.js` only |
| `Network or server error` | Check `EXPO_PUBLIC_API_URL` in `.env`; verify deployment |
| RevenueCat `sdk_initialized` error | Harmless; fixed with `react-native-url-polyfill` |
| `No offerings` | Configure products in RevenueCat dashboard |
| Subscription stuck on trial | Tap Refresh; verify `/api/sync-subscription` and `Purchases.logIn` |

---

## Quick Test Checklist

- [ ] `/api/auth/token` returns `{ ok: true, userId, token }`
- [ ] `/api/styles` returns list of styles
- [ ] `/api/user/subscription` returns plan and usage (with Bearer token)
- [ ] `/api/enqueue` + `/api/job` complete a generation
- [ ] App launches and gets user ID without errors
- [ ] Style selection works
- [ ] Image upload and generation completes
- [ ] Result screen: slider, save, share all work
- [ ] Gallery screen shows saved images
- [ ] Subscription screen shows plan cards
- [ ] Toast notifications appear (not system Alert dialogs)
- [ ] Subscription purchase updates plan (not stuck on trial)

---

**Last Updated**: June 2026
