# Sentry integration (error reporting)

**Status:** ✅ Mobile live (org `funnyfy`, project `react-native`, environment `staging`)  
**Verified:** June 2026 — events visible in Sentry Issues  
**Optional:** API backend (`@sentry/node`) not started

---

## What’s wired

| Piece | Location |
|-------|----------|
| Init + scrubbing | `apps/mobile/utils/sentry.js` |
| Boot | `apps/mobile/index.js` — `initSentry()` + `Sentry.wrap(App)` |
| Expo plugin | `apps/mobile/app.config.js` — `@sentry/react-native/expo` |
| Metro | `apps/mobile/metro.config.js` — `getSentryExpoConfig` |
| User context | `App.js` — `setSentryUser(auth.userId)` after auth |
| Generation errors | `App.js` — `captureAppError(err, { flow: 'generate', styleId })` (NSFW blocks excluded) |

---

## Env vars (`apps/mobile/.env`)

```env
EXPO_PUBLIC_SENTRY_DSN=https://YOUR_KEY@oXXXX.ingest.us.sentry.io/PROJECT_ID
EXPO_PUBLIC_SENTRY_ENV=staging
EXPO_PUBLIC_SENTRY_ENABLED=true
```

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SENTRY_DSN` | Required — React Native project DSN (not `@sentry/react` web) |
| `EXPO_PUBLIC_SENTRY_ENV` | `staging` / `production` — filter in Sentry dashboard |
| `EXPO_PUBLIC_SENTRY_ENABLED` | Set `true` for debug APKs (`__DEV__` builds otherwise skip sending) |
| `EXPO_PUBLIC_SENTRY_TEST` | Optional — one startup test message; comment out after verifying |

`EXPO_PUBLIC_*` values are **baked in at build time**. After changing `.env`, rebuild the APK.

---

## Test

1. Sentry → **funnyfy** → **react-native** → **Issues** (filter environment `staging`)
2. Optional: set `EXPO_PUBLIC_SENTRY_TEST=true`, rebuild, open app → `FunnyFy Sentry connection test`
3. Or trigger a real failure (e.g. generate with network off)

Local debug APK:

```powershell
cd D:\Claude\funnyfyapp
.\build-apk-local.ps1 -SkipPrebuild -NoVersionBump
```

If Gradle reuses an old JS bundle after `.env` changes, force rebundle:

```powershell
cd apps/mobile/android
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
.\gradlew.bat :app:createBundleDebugJsAndAssets --rerun-tasks
.\gradlew.bat :app:packageDebug :app:assembleDebug
```

---

## Release builds (later)

- Set `SENTRY_AUTH_TOKEN` in EAS / CI for source map upload
- Use separate Sentry environments or projects for staging vs production
- Do **not** attach photos, base64, or JWTs (`beforeSend` scrubs sensitive headers)

---

## Optional: API backend

For Vercel server errors (`api/process-job.ts`, etc.):

- Separate Sentry project (e.g. `funnyfy-api`)
- `SENTRY_DSN` in Vercel env (not `EXPO_PUBLIC_`)
- `@sentry/node` — see [Sentry Node docs](https://docs.sentry.io/platforms/node/)

---

## References

- [Expo: Using Sentry](https://docs.expo.dev/guides/using-sentry/)
- [@sentry/react-native docs](https://docs.sentry.io/platforms/react-native/)
- `apps/mobile/README-ENV.md`, `MD/BUILD_APK_GUIDE.md`
