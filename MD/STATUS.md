# FunnyFy App - Current Status

**Last Updated**: July 2026  
**Version**: see [`apps/mobile/version.json`](../apps/mobile/version.json) (single source of truth — do not hardcode semver in docs)  
**Status**: Feature-Complete – Ready for App Store Submission

---

## 🎯 Overview

FunnyFy is a React Native mobile application that transforms user photos into AI-generated caricatures using the Replicate API. The app has subscription integration via RevenueCat, usage tracking, quota enforcement, NSFW moderation, JWT authentication, and a fully polished UI.

---

## ✅ Completed Features

### Mobile App (React Native/Expo SDK 52)
- ✅ Cross-platform app (Android & iOS)
- ✅ **Native splash** (`expo-splash-screen`): solid `#0B0F19` until fonts + auth; no in-app splash component
- ✅ **Netflix-style style picker**: category rows + horizontal tiles + "See all" grid; dark `#0B0F19` shell
- ✅ **Discovery tiles** (`MediaTile`): image-only on style picker; **curated before/after crossfade** on 55 styles; row-focus sequencing on home and **See all** category grid
- ✅ **Enabled styles** (160 in catalog; see [`MD/STYLES.md`](STYLES.md) / [`MD/PROMPTS.md`](PROMPTS.md) for current count)
- ✅ **Two-step upload flow**: UploadScreen (comparison fade + Gallery/Camera) → PhotoReviewScreen (confirm + Generate); OS crop via `expo-image-picker`
- ✅ **Upload/Review header** (`UploadFlowHeader.js`): back + **style pill** (left) + **usage pill** (right); no Photo tips chip
- ✅ **Photo tips sheet**: auto-opens on Upload per style; "Do not show again" per style; pictorial placeholders
- ✅ Before/after comparison slider on result + **4-phase job loading** (submit → queue → moderation → generate; title **Creating your {style}**)
- ✅ **Try another style**: Regenerate same photo with a new style (restyle flow)
- ✅ **Try another photo**: From result, pick a new photo for the same style
- ✅ Save to device functionality (Funnyfy album on Android/iOS; write-only path on Android)
- ✅ Share functionality (result + menu share sheet)
- ✅ Error handling and user feedback
- ✅ **Offline UX**: NetInfo connectivity, **orange global overlay** banner (non-blocking), generate/purchase guards, auto-refresh on reconnect
- ✅ **Content-policy dialog** for NSFW blocks: **Content not permitted** + **Understood** CTA; clears photo and returns to upload (Sightengine, pre-Replicate)
- ✅ Safe area handling: Bottom insets prevent overlap with navigation bar
- ✅ **Gallery screen**: Dark theme; grid of saved caricatures, full-screen viewer
- ✅ **Save toast**: "View in Gallery" action after successful save
- ✅ **Toast notification system**: Beautiful in-app toasts replace all system Alert.alert calls
- ✅ **ConfirmDialog component**: Custom modal with optional neutral 3rd button
- ✅ **NotificationContext**: App-wide toast/notification state via React Context
- ✅ **Full Privacy Policy** and **Terms of Service** (13 sections each, in-app)
- ✅ **Menu** (`MenuModal.js`): Gallery, Usage, Subscription, **Share app**, **Request a style**, Privacy, Terms, About, Contact us
- ✅ **Dark-first UI** (`#0B0F19`): Style, Upload, Review, Result, Gallery, Info, Subscription, Splash, app shell
- ✅ **Trial soft warnings**: Banner/toast when 1 free generation remains
- ✅ **Auto versioning**: `version.json` + bump scripts + Cursor rule; About screen shows runtime version
- ✅ **Android nav bar**: solid `#0B0F19` (matches app shell)

### Auth System
- ✅ `services/auth.js` — JWT auth service, persisted on device (use `auth.js` only; do not add `auth.ts`)
- ✅ Backend creates real user in Supabase DB on first launch (`/api/auth/token`)
- ✅ JWT token stored in device filesystem (not AsyncStorage)
- ✅ Auth retries 3× before local fallback; `forceReAuth()` on stale/missing token
- ✅ `ensureAuthenticated()` before purchases, generation, and API calls
- ✅ Splash waits for auth to finish (prevents purchase before userId is set)
- ✅ `Purchases.logIn(backendUserId)` links RevenueCat to backend UUID
- ✅ Local UUID fallback only if backend/DB is unreachable
- ✅ `resetAuthIfLocal()` clears local fallback when DB recovers

### Paywall / Subscription UI
- ✅ **Full-bleed dark paywall** (`SubscriptionScreen.js`): `#0B0F19` hero + `PaywallStyleMarquee`, compact tier cards, pinned white CTA, canceling state (red pill + manage link)
- ✅ Subscription screen with Current Plan, Usage This Month, Available Plans
- ✅ **Purchase → sync → refresh flow** (`/api/sync-subscription` + auto refresh)
- ✅ Pricing: $5 / $10 / $25 (no .99)
- ✅ Date format: dd/mmm/yyyy (e.g. 10/Feb/2025)
- ✅ "Most popular" ribbon on Popular tier
- ✅ **Restore Purchases** and **Refresh** buttons (Play Store policy)
- ✅ **Tier selection fix**: handleSubscribe matches selected plan to RevenueCat package
- ✅ **Subscription cancellation**: `/api/cancel-subscription` endpoint

### Backend (Vercel Serverless)
- ✅ Serverless API endpoints
- ✅ Style catalog API (`/api/styles`) — returns `categoryId` + `categories`
- ✅ Async generation: `POST /api/enqueue` → poll `GET /api/job?id=...`
- ✅ Queue worker (`/api/cron/process-queue`) via `api/process-job.ts` — scheduled externally by [cron-job.org](https://cron-job.org/) (moved off Vercel cron)
- ✅ User subscription API (`/api/user/subscription`)
- ✅ Sync subscription, RevenueCat webhook handling
- ✅ **160 styles in catalog**; enabled count in [`MD/STYLES.md`](STYLES.md) — protected prompts on server
- ✅ Usage tracking, quota enforcement, **idempotent per-job credits** (`job_usage_credits`)
- ✅ Queue worker: **atomic job claim** (`FOR UPDATE SKIP LOCKED`)
- ✅ **JWT auth** (`/api/auth/token`)
- ✅ **NSFW moderation** (Sightengine) in `api/process-job.ts`
- ✅ **Image upload validation** in `api/enqueue.ts`
- ✅ **Admin dashboard** (`/admin/login`)

### Database (Supabase)
- ✅ `users`, `subscriptions`, `usage_tracking`, `job_usage_credits`, `jobs`
- ✅ `rate_limits`, `infringements`, `subscription_history`, `cost_tracking`, `security_logs`

### Styles — Enabled (30)

Full table (ids, models, comparison pairs, deploy steps): **`MD/STYLES.md`**

**Categories with recent additions:** Art (neon, lowpoly, mural, pop art v1–v3, graffiti, banksy, mosaic, e-glow), Caricatures (editorial, exaggerated, watercolor, handd, carc1).

**Models:** `flux-kontext-pro` (default), `google/nano-banana`, `bytedance/seedream-4`.

**Pending:** `coloured_pencil` disabled until comparison asset is added.

**Catalog:** 160 styles from spreadsheet — enable individually in `api/_utils/styles-config.ts` as prompts and thumbnails are ready.

---

## 📱 Recent Changes (June 2026)

| Change | Description |
|--------|-------------|
| **UI redesign (June 2026)** | Netflix-style StyleScreen, Upload→Review flow, dark theme app-wide, `pwd*` paywall — see `MD/UI_REDESIGN_2026_06.md` |
| **Dead code cleanup** | Removed CropScreen, PhotoChooserScreen; pruned ~440 unused styles; `scripts/prune-unused-styles.js` |
| **Menu + header polish** | Dark bottom sheet menu; style picker wordmark + icon-only burger; upload/review `UploadFlowHeader` pills |
| **Result screen** | Three-band layout, real job progress, local preview cache, pinned actions |
| **Style catalog expansion** | 16 categories, 160 styles; Netflix row navigation |
| **Auto versioning** | `version.json`, `bump-version.js`, build script integration |
| **90s label** | Renamed display label from "90s Cartoon" to **90s** |
| **Usage counter fix** | `job_usage_credits` + atomic queue claim |
| **Subscription sync fix** | `Purchases.logIn`, post-purchase sync, auth gating |
| **Local APK builds** | `build-apk-local.ps1` + Gradle (`assembleDebug`) |
| **Offline UX** | Orange global overlay banner (`NetworkProvider`); upload/review generate guard; reconnect refresh |
| **Upload header pills** | `UploadFlowHeader.js` — style pill left, usage pill right; photo tips auto-sheet (no header chip) |
| **Crop picker** | `expo-image-picker` only (removed `react-native-image-crop-picker`) |
| **Local APK testing** | Prefer `build-apk-local.ps1` over Expo Go (SDK lock, RevenueCat, NetInfo) |

---

## 🚧 Deferred / Future

- [ ] Enable more catalog styles (thumbnails + prompts per style)
- [ ] Remaining style tile comparison pairs (8 of 19 enabled styles have curated assets — see `To do/COMPARISON_ASSETS.md`)
- [ ] E003 high-demand error: friendly "generators busy" message
- [ ] Analytics
- [ ] Subscription trial (time-based 3-day trial via Play Store)

---

## 📋 Launch Checklist

### Technical
- [x] Database integration (Supabase)
- [x] Subscription tiers (RevenueCat)
- [x] Usage quota system (50/100/250 per month)
- [x] NSFW moderation (Sightengine)
- [x] JWT authentication
- [x] Auto versioning for builds
- [x] Error tracking (Sentry mobile — `To do/SENTRY_INTEGRATION.md`)
- [ ] Analytics

### Business
- [x] Finalize pricing ($5/$10/$25)
- [x] Privacy policy & terms (in-app)
- [ ] Host Privacy Policy on public URL (Play Store)
- [ ] App store assets

### App Store
- [ ] Google Play Store listing
- [ ] Apple App Store listing

---

## 💰 Pricing (Finalized)

| Tier    | Price | Images/Month |
|---------|-------|--------------|
| Starter | $5    | 50           |
| Popular | $10   | 100          |
| Pro     | $25   | 250          |

---

## 🏗️ Architecture

### Current Stack
- **Mobile**: React Native (Expo SDK 52)
- **Backend**: Vercel serverless (Node.js/TypeScript)
- **API**: Replicate for image generation
- **Database**: Supabase (Postgres)
- **Subscriptions**: RevenueCat
- **Auth**: Custom JWT (`/api/auth/token`)
- **NSFW**: Sightengine
- **Hosting**: Vercel

### Key Endpoints
- `GET /api/styles` – style catalog + categories
- `POST /api/enqueue` – create generation job
- `GET /api/job?id=...` – poll job status
- `GET /api/user/subscription` – subscription + usage
- `POST /api/sync-subscription` – manual RevenueCat → DB sync
- `POST /api/auth/token` – JWT auth

---

## 📝 Notes

- **App name**: FunnyFy
- **Package**: `com.evansks.funnyfyapp`
- **Version source**: [`apps/mobile/version.json`](../apps/mobile/version.json) (bump via `apps/mobile/scripts/bump-version.js` or build scripts)
- **Staging**: `https://funnyfy-staging.vercel.app`
- **Production**: `https://funnyfyapp.vercel.app`
- **Expo SDK**: 52 (not upgraded to 53/54 — breaking changes)

---

**Status**: Feature-complete. Ready for app store submission and production launch.
