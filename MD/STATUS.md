# FunnyFy App - Current Status

**Last Updated**: June 2026
**Version**: 1.0.2 (Android versionCode: 5, iOS buildNumber: 2)
**Status**: Feature-Complete – Ready for App Store Submission

---

## 🎯 Overview

FunnyFy is a React Native mobile application that transforms user photos into AI-generated caricatures using the Replicate API. The app has subscription integration via RevenueCat, usage tracking, quota enforcement, NSFW moderation, JWT authentication, and a fully polished UI.

---

## ✅ Completed Features

### Mobile App (React Native/Expo SDK 52)
- ✅ Cross-platform app (Android & iOS)
- ✅ Splash screen with branding
- ✅ Style selection screen with 21 styles and preview images
- ✅ Image upload (camera & gallery)
- ✅ **Pulsing squares loading animation** (4 squares fading black→grey in sequence)
- ✅ Before/after comparison slider (drag to compare)
- ✅ Save to device functionality (no system prompt)
- ✅ Share functionality
- ✅ Error handling and user feedback
- ✅ **Modal dialog for NSFW errors** (white card style, "Try again" returns to upload)
- ✅ **Network error dialog** on app launch with no connectivity
- ✅ Safe area handling: Bottom insets prevent overlap with navigation bar
- ✅ **Gallery screen**: Grid of saved caricatures, full-screen viewer, ✕ to close, 🗑 to clear all
- ✅ **Toast notification system**: Beautiful in-app toasts replace all system Alert.alert calls
- ✅ **ConfirmDialog component**: Custom modal with optional neutral 3rd button (e.g., Save / Discard / Cancel)
- ✅ **NotificationContext**: App-wide toast/notification state, shared across all screens via React Context
- ✅ **Full Privacy Policy**: 13-section comprehensive policy, hosted in-app
- ✅ **Full Terms of Service**: 13-section comprehensive terms, hosted in-app
- ✅ **Menu with Feather icons**: Thin-stroke outline icons, clean styling
- ✅ **Centered style labels**: Style picker text centered under cards with improved typography

### Auth System
- ✅ `services/auth.js` — JWT auth service, persisted on device (use `auth.js` only; do not add `auth.ts`)
- ✅ Backend creates real user in Supabase DB on first launch (`/api/auth/token`)
- ✅ JWT token stored in device filesystem (not AsyncStorage)
- ✅ Auth retries 3× before local fallback; `forceReAuth()` on stale/missing token
- ✅ `ensureAuthenticated()` before purchases, generation, and API calls
- ✅ Splash waits for auth to finish (prevents purchase before userId is set)
- ✅ `Purchases.logIn(backendUserId)` links RevenueCat to backend UUID (transfers purchases)
- ✅ Local UUID fallback only if backend/DB is unreachable
- ✅ `resetAuthIfLocal()` clears local fallback when DB recovers

### Paywall / Subscription UI
- ✅ Subscription screen with Current Plan, Usage This Month, Available Plans
- ✅ **Purchase → sync → refresh flow working** (manual sync via `/api/sync-subscription` + auto refresh)
- ✅ Pricing: $5 / $10 / $25 (no .99)
- ✅ Plan benefits removed; quota-only display
- ✅ Date format: dd/mmm/yyyy (e.g. 10/Feb/2025)
- ✅ "Most popular" ribbon on Popular tier
- ✅ Polished paywall: light background, header tagline, card shadows, consistent styling
- ✅ **Restore Purchases button**: Black button, required for Play Store policy
- ✅ **Refresh button**: Black button, refreshes subscription status from RevenueCat
- ✅ **Tier selection fix**: handleSubscribe correctly matches selected plan to RevenueCat package
- ✅ **Subscription cancellation**: Production-ready `/api/cancel-subscription` endpoint

### Backend (Vercel Serverless)
- ✅ Serverless API endpoints
- ✅ Style catalog API (`/api/styles`)
- ✅ Async generation: `POST /api/enqueue` → poll `GET /api/job?id=...`
- ✅ Queue worker (`/api/cron/process-queue`) processes jobs via `api/process-job.ts`
- ✅ User subscription API (`/api/user/subscription`)
- ✅ Sync subscription, RevenueCat webhook handling
- ✅ 21 styles with protected prompts
- ✅ Usage tracking, quota enforcement
- ✅ Replicate status handling: succeeded/failed/canceled; usage incremented only on success
- ✅ **JWT auth endpoint** (`/api/auth/token`): Creates/returns user in Supabase, issues JWT
- ✅ **NSFW moderation** (Sightengine): in `api/process-job.ts`, blocks before Replicate
- ✅ **Image upload validation**: in `api/enqueue.ts` / middleware (MIME, size, magic bytes)
- ✅ **Cancel subscription endpoint** (`/api/cancel-subscription`): Production-ready
- ✅ **Admin dashboard** (`/admin/login`): Login, queue stats, security logs

### Database (Supabase)
- ✅ `users` – user accounts, trial/subscription state, `banned_at` for bans
- ✅ `subscriptions` – active subscriptions, tier, period end, `pending_tier`
- ✅ `usage_tracking` – monthly generation count per user
- ✅ `jobs` – generation job tracking with priority queue
- ✅ `rate_limits` – IP rate limiting
- ✅ `infringements` – NSFW violation records; 3 violations = ban
- ✅ `subscription_history` – audit trail for subscription changes
- ✅ `cost_tracking` – Replicate API cost per job
- ✅ `security_logs` – auth, rate limit, webhook security events

### Styles (21 Total)
1. 90s Cartoon
2. Chibi
3. Neon
4. Anime
5. Custom 1
6. 3D Clay
7. Oil Paint
8. Low-Poly Cartoon
9. Water Color
10. Pixar-like
11. Funko Pop
12. Custom 2
13. Neanderthal
14. Neanderthal 3D
15. Hand-Drawn
16. Superhero
17. Super Villain
18. Cyborg

**Models Used**: `black-forest-labs/flux-kontext-pro` and `google/nano-banana`

---

## 📱 Recent Changes (June 2026)

| Change | Description |
|--------|-------------|
| **Subscription sync fix** | `Purchases.logIn`, post-purchase sync, auth gating — purchases update plan immediately |
| **Staging backend** | Use `https://funnyfy-staging.vercel.app` in `.env` for testing (production auth DB needs fix) |
| **Silent gallery save** | Save directly into Funnyfy album via `createAssetAsync(uri, album)` — no Android "modify photo?" prompt |
| **Android photo picker** | Gallery pick on Android 13+ uses system picker (no extra permission prompt) |
| **Local APK builds** | `build-apk-local.ps1` + Gradle (`assembleDebug`) — no EAS quota needed |
| **URL polyfill** | `react-native-url-polyfill` fixes harmless RevenueCat `sdk_initialized` tracking error |

---

## 📱 Recent UI/UX Changes (v1.0.2)

| Change | Description |
|--------|-------------|
| **NSFW modal dialog** | Inappropriate images now show a clean white modal ("Image not supported" / "Try again" returns to upload) instead of amber error card + toast |
| **No save prompt** | Photos save silently to camera roll — Android "Allow Expo Go to modify?" prompt removed |
| **Pulsing squares loader** | 4 black squares pulse black→grey in sequence during generation (replaced pulsing text) |
| **Network error dialog** | White modal appears on launch if no internet: "No internet connection" with "OK" button |
| **Menu icons** | Feather thin-stroke outline icons (image, star, shield, file-text, info) with proper spacing |
| **Dialog styling** | All modals match reference style: larger bold title (20px), lighter grey message (15px), bigger buttons |
| **Style picker text** | Centered labels under cards, semibold weight (600), letter spacing 0.2 |
| **Toast error color** | Error toasts use warm amber (#F59E0B) instead of harsh red |
| **Retry limit removed** | Users can retry NSFW errors unlimited times (no 3-attempt block) |

---

## 🚧 Deferred / Future

- [ ] E003 high-demand error: friendly "generators busy" message
- [ ] Save notification: system notification with full path, tap to open photo
- [ ] Error tracking (Sentry)
- [ ] Analytics
- [ ] Security audit (formal)
- [ ] Full real authentication (Supabase Auth / Clerk) — currently using JWT with local fallback
- [ ] Subscription trial (time-based 3-day trial via Play Store)

---

## 📋 Launch Checklist

### Technical
- [x] Database integration (Supabase)
- [x] Subscription tiers (RevenueCat)
- [x] Usage quota system (50/100/250 per month)
- [x] Rate limiting
- [x] NSFW moderation (Sightengine)
- [x] JWT authentication
- [x] Image upload validation
- [x] Toast/dialog UX system
- [x] Network error handling
- [x] Silent photo saves (no system prompts)
- [ ] Error tracking (Sentry)
- [ ] Analytics
- [ ] Security audit

### Business
- [x] Finalize pricing ($5/$10/$25)
- [x] Privacy policy (in-app, full 13-section)
- [x] Terms of service (in-app, full 13-section)
- [ ] Host Privacy Policy on public URL (required for Play Store listing)
- [ ] App store assets (screenshots, icon, description)
- [ ] Marketing materials

### App Store
- [ ] Google Play Store listing (APK/AAB built)
- [ ] Apple App Store listing
- [ ] App store optimization (ASO)
- [ ] Submission and review

---

## 💰 Pricing (Finalized)

| Tier    | Price | Images/Month | Cost   | Profit | Margin |
|---------|-------|--------------|--------|--------|--------|
| Starter | $5    | 50           | $2.00  | $3.00  | 60%    |
| Popular | $10   | 100          | $4.00  | $6.00  | 60%    |
| Pro     | $25   | 250          | $10.00 | $15.00 | 60%    |

**Note**: No yearly plans initially.

---

## 🏗️ Architecture

### Current Stack
- **Mobile**: React Native (Expo SDK 52)
- **Backend**: Vercel serverless (Node.js/TypeScript)
- **API**: Replicate for image generation
- **Database**: Supabase (Postgres)
- **Subscriptions**: RevenueCat
- **Auth**: Custom JWT (backend `/api/auth/token`)
- **NSFW**: Sightengine
- **Hosting**: Vercel (API + Admin dashboard)
- **Animations**: react-native-reanimated (skeleton/pulsing loaders)

### Key Endpoints
- `GET /api/styles` – style catalog
- `POST /api/enqueue` – create generation job
- `GET /api/job?id=...` – poll job status
- `GET /api/user/subscription` – subscription + usage
- `POST /api/sync-subscription` – manual RevenueCat → DB sync
- `POST /api/auth/token` – JWT auth (creates user in DB)
- `POST /api/cancel-subscription` – cancel active subscription
- `POST /api/webhooks/revenuecat` – RevenueCat event webhook
- `GET /admin/login` – admin dashboard

---

## 📝 Notes

- **App name**: FunnyFy
- **Package**: `com.evansks.funnyfyapp`
- **Version**: 1.0.2 (versionCode: 5, buildNumber: 2)
- **Staging**: `https://funnyfy-staging.vercel.app` ← **use for dev/testing**
- **Production**: `https://funnyfyapp.vercel.app` — ⚠️ verify `DATABASE_URL` on Vercel before release (auth was failing with wrong Postgres password as of June 2026)
- **Admin**: `/admin/login`
- **Cost per generation**: ~$0.04
- **Failed Replicate runs**: Not billed (see `MD/REPLICATE_BILLING_FAILED_RUNS.md`)
- **Expo SDK**: 52 (intentionally not upgraded — SDK 53/54 have breaking changes)
- **User is non-programmer**: All AI assistance should use plain language and step-by-step explanations

---

**Status**: Feature-complete. Ready for app store submission and production launch.
