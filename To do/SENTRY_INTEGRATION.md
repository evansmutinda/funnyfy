# Sentry integration (error reporting)

**Status:** Not started — planned for mobile app + optional API backend.

---

## Goals

- Capture **JS crashes** and unhandled promise rejections in the React Native app
- Report **API / generation failures** with useful context (user id, job id, screen — no photo data)
- Separate **dev** vs **production** environments in Sentry
- Free tier is sufficient to start ([sentry.io](https://sentry.io) — 5k errors/month on Developer plan)

---

## Mobile app (`apps/mobile`)

### 1. Create Sentry project

1. Sign up / log in at [sentry.io](https://sentry.io)
2. Create project → **React Native**
3. Copy the **DSN** (public — safe in app, but use env vars anyway)

### 2. Install (Expo SDK 52)

```powershell
cd apps/mobile
npx expo install @sentry/react-native
```

Follow [Expo + Sentry wizard](https://docs.expo.dev/guides/using-sentry/) or manual setup below.

### 3. Env vars

Add to `apps/mobile/.env` (and EAS secrets for release builds):

```env
EXPO_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
```

Optional:

```env
EXPO_PUBLIC_SENTRY_ENV=development   # or staging / production
```

Add placeholders to `env.example` at repo root / mobile README — **never commit real DSN to public repos** if the project is public (DSN is low-risk but still prefer env).

### 4. Wire init (early in boot)

Init in `apps/mobile/index.js` **after** `./polyfills` and **before** `App`:

```javascript
import * as Sentry from '@sentry/react-native';

if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENV ?? __DEV__ ? 'development' : 'production',
    enabled: !__DEV__, // or true in dev with a separate Sentry project
    tracesSampleRate: 0.2,
  });
}
```

Wrap root export if using Sentry’s recommended pattern:

```javascript
export default Sentry.wrap(App);
```

### 5. `app.config.js` plugin

```javascript
plugins: [
  [
    '@sentry/react-native/expo',
    {
      organization: 'YOUR_ORG_SLUG',
      project: 'funnyfy-mobile',
      // url: 'https://sentry.io/'  // self-hosted only
    },
  ],
  // ...existing plugins
],
```

Requires `SENTRY_AUTH_TOKEN` locally / in EAS for source map upload on release builds.

### 6. What to capture manually (optional polish)

| Area | Suggestion |
|------|------------|
| `App.js` `callApi` catch | `Sentry.captureException(err, { tags: { flow: 'generate' } })` — skip NSFW/content-policy (expected user errors) |
| Auth init failure | `captureException` if `performAuthInit` fails after retries |
| RevenueCat | Log purchase errors; don’t send PII |
| User context | `Sentry.setUser({ id: userId })` after auth — **no email unless user opts in** |

Use `utils/contentErrors.js` → `isNsfwContentError()` to **avoid** sending moderation blocks as errors.

### 7. Native rebuild

Sentry adds native modules → after install:

```powershell
cd apps/mobile
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

See also: `To do/ENTRY_INTEGRATION.md` for entry / prebuild checklist.

---

## API backend (optional, Vercel)

For server-side errors in `api/process-job.ts`, `api/enqueue.ts`, etc.:

```bash
npm install @sentry/node --workspace-root   # or in api package if split
```

Init once in a shared util; `Sentry.captureException(err)` in catch blocks. Use same Sentry org, **separate project** (e.g. `funnyfy-api`).

Set `SENTRY_DSN` in Vercel env vars (not `EXPO_PUBLIC_`).

---

## Privacy / compliance

- Do **not** attach uploaded images, base64, or Sightengine scores to Sentry events
- Scrub `Authorization` headers and JWTs in `beforeSend` if logging request context
- Mention third-party error reporting in Privacy Policy when enabled (`InfoScreen` / `constants.js`)

---

## Checklist

- [ ] Sentry org + projects created (mobile; optional API)
- [ ] `@sentry/react-native` installed + Expo plugin in `app.config.js`
- [ ] DSN via `EXPO_PUBLIC_SENTRY_DSN` (+ EAS secret for production)
- [ ] Init in `index.js`; `Sentry.wrap(App)` or error boundary
- [ ] Filter NSFW / expected user errors from reports
- [ ] Source maps uploaded on release build (`SENTRY_AUTH_TOKEN` in EAS)
- [ ] Test: throw test error in dev build → appears in Sentry dashboard
- [ ] Update Privacy Policy + `MD/STATUS.md` when live

---

## References

- [Expo: Using Sentry](https://docs.expo.dev/guides/using-sentry/)
- [@sentry/react-native docs](https://docs.sentry.io/platforms/react-native/)
- Existing mentions: `MD/STATUS.md`, `MD/DEVELOPMENT_PLAN.md`, `MD/SERVER_ARCHITECTURE_EXPLANATION.md`
