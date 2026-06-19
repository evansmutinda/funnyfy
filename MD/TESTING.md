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

## Method 2: Test on a Device

### Recommended: Local debug APK (Android)

**Prefer this over Expo Go** for day-to-day testing:

| | Local debug APK | Expo Go |
|---|-----------------|---------|
| SDK version | Locked to your project (SDK 52) | Auto-updates from Play/App Store |
| RevenueCat purchases | Works in dev APK | Limited / unreliable |
| NetInfo & native modules | Full support | May differ |
| Matches production | Closer | Looser |

```powershell
# From project root — build and install apps/mobile/android/.../app-debug.apk
.\build-apk-local.ps1
```

After installing the APK, you can still use Metro for fast refresh:

```bash
cd apps/mobile
npm start
```

See `MD/BUILD_APK_GUIDE.md` for details.

### Optional: Expo Go (quick smoke tests only)

Expo Go is fine for a quick UI check, but **it updates itself** when the Play Store or App Store auto-updates the app. That can break compatibility with SDK 52.

**Android — disable Expo Go auto-update**

1. Google Play Store → **Expo Go**
2. Tap **⋮** → uncheck **Enable auto-update**

**If Expo Go already updated and shows SDK mismatch**

- Android: install an older Expo Go APK for your SDK from [Expo’s Expo Go docs](https://docs.expo.dev/get-started/expo-go/)
- iOS: cannot downgrade; use simulator on Mac or a **development build**

**iOS — limit auto-updates**

Settings → App Store → turn off **App Updates** (global; no per-app toggle on iOS).

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

### Step 3: Start Metro (Expo Go or installed APK)

```bash
cd apps/mobile
npm start
```

- **Expo Go**: Scan QR with Expo Go (Android) or Camera → Expo Go (iOS)
- **Debug APK**: Open the installed FunnyFy app; it connects to the same Metro bundler when on the same network

### Step 4: Test Key Flows

1. **Auth flow**: `[AUTH_DEBUG] hasToken: true` in Metro logs; no `resetAuthIfLocal is not a function`
2. **Style selection**:
   - Home shows **16 category tiles** (wide/compact alternation), white background, wordmark + menu
   - Tap **Cartoons** → **90s**, **Chibi**, and **Anime** in 2-column grid (taller white cards)
   - Labels: Plus Jakarta Sans Regular, left-aligned, dark rounded backdrop behind text
   - Back button / Android hardware back returns to categories
   - **Restyle** (from result): flat list of enabled styles + banner
   - **Offline**: ink banner at top; styles use local fallback catalog; Gallery/About still work
   - **Upload offline**: Generate disabled + inline message; reconnect auto-refreshes styles/subscription
3. **Image upload**: Style chip + "Change style"; pick from gallery (Android 13+: system picker)
4. **Generation**: `POST /api/enqueue` then poll `/api/job` — pulsing squares loader; **usage counter +1 only on success**
5. **Result**: Slider auto-demo, drag compare, save (silent), share, **Try another style** → restyle banner
6. **Gallery**: Tile grid; saved images in Funnyfy device album
7. **Subscription**: Ink hero + style marquee; usage + plans in white sheet; purchase updates plan
8. **Trial warning**: At 1 generation left, banner on upload + toast after generation
9. **About**: Version matches `version.json` / `expo-constants`

---

## Testing offline behavior

FunnyFy is **network-required** for generation and purchases. Offline behavior is intentional:

| Online | Offline |
|--------|---------|
| Generate, subscribe, restore | Blocked with banner + disabled Generate |
| Fetch styles from API | `DEFAULT_ENABLED_STYLES` fallback |
| Gallery, About, Privacy, Terms | Still work |
| Reconnect | Auto-refreshes styles, subscription, auth |

**How to test**

1. Open app with Wi‑Fi on — confirm no banner
2. Enable airplane mode — ink banner: *“No connection — generation and purchases need internet”*
3. Browse categories, open Gallery — should work
4. Upload screen — **Generate** disabled; inline offline message
5. Turn Wi‑Fi back on — banner disappears; styles/subscription refresh (check Metro log: `[Network] Back online`)

**Implementation**: `NetworkProvider.js`, `OfflineBanner.js`, `utils/network.js`

---

## App versioning

Single source of truth: `apps/mobile/version.json`

| Field | Used for |
|-------|----------|
| `version` | User-facing semver (About screen, `app.config.js`) |
| `androidVersionCode` | Google Play / APK `versionCode` |
| `iosBuildNumber` | App Store build number |

**Auto-bump on build** (increments `androidVersionCode` + `iosBuildNumber`):

```powershell
# From project root — local debug/release APK
.\build-apk-local.ps1

# From apps/mobile — EAS cloud build
.\build-apk.ps1
```

Skip bump when rebuilding the same release: `-NoVersionBump`

**Manual bump** (interactive semver or build-only):

```powershell
cd apps/mobile
.\version-bump.ps1
# or
npm run version:patch   # also: version:minor, version:major, version:bump
```

After a bump, commit `version.json` (and `package.json` if semver changed) before the next store upload.

---

## Method 3: Build and Test APK (Android)

### Local build (no EAS quota)

```powershell
# From project root — bumps versionCode, prebuilds, assembles APK
.\build-apk-local.ps1
```

APK: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### EAS cloud build

```powershell
cd apps/mobile
.\build-apk.ps1
# or: eas build --platform android --profile preview
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
| Usage counter skips a number | Run migration `004-job-usage-credits.sql`; redeploy API with atomic queue claim |
| Expo Go SDK mismatch after update | Use local debug APK; or disable Expo Go auto-update (Android); see **Method 2** in `TESTING.md` |
| Offline at launch | Top banner appears; default styles load; no blocking dialog |
| Generate while offline | Button disabled on Upload; toast if triggered from restyle |

---

## Quick Test Checklist

- [ ] `/api/auth/token` returns `{ ok: true, userId, token }`
- [ ] `/api/styles` returns enabled styles with `categoryId` and `categories`
- [ ] `/api/user/subscription` returns plan and usage (with Bearer token)
- [ ] `/api/enqueue` + `/api/job` complete a generation
- [ ] App launches and gets user ID without errors
- [ ] Home category grid shows 16 categories; drill-down shows enabled styles per category
- [ ] Cartoons: **90s**, **Chibi**, **Anime** tiles visible with correct thumbnails
- [ ] Style card labels readable on light/busy images (dark backdrop pill behind text)
- [ ] Image upload and generation completes
- [ ] Result screen: slider, save, share all work
- [ ] Gallery screen shows saved images
- [ ] Subscription screen shows plan cards
- [ ] Toast notifications appear (not system Alert dialogs)
- [ ] Subscription purchase updates plan (not stuck on trial)
- [ ] Offline banner shows in airplane mode; Generate disabled on Upload
- [ ] Back online: banner clears; styles/subscription refresh

---

**Last Updated**: June 2026
