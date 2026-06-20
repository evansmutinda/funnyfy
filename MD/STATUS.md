# FunnyFy App - Current Status

**Last Updated**: June 2026  
**Version**: 1.0.4 (in development; `version.json` still 1.0.3 until next build bump)  
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
- ✅ **Discovery tiles** (`MediaTile`): labels below image (3-line captions); `PressScale` on taps
- ✅ **18 enabled caricature styles** (160 in catalog; placeholders disabled until prompts/thumbnails ready)
- ✅ **Two-step upload flow**: UploadScreen (comparison fade + Gallery/Camera) → PhotoReviewScreen (confirm + Generate); native crop in dev/APK via `react-native-image-crop-picker`
- ✅ **Photo tips sheet**: full-screen dark overlay (not Modal) on Upload + Review
- ✅ Before/after comparison slider on result + **4-phase job loading** (submit → queue → moderation → generate; title **Creating your {style}**)
- ✅ **Try another style**: Regenerate same photo with a new style (restyle flow)
- ✅ Save to device functionality (no system prompt)
- ✅ Share functionality
- ✅ Error handling and user feedback
- ✅ **Offline UX**: NetInfo connectivity, non-blocking top banner, generate/purchase guards, auto-refresh on reconnect
- ✅ **Content-policy dialog** for NSFW blocks: **Content not permitted** + **Understood** CTA; clears photo and returns to upload (Sightengine, pre-Replicate)
- ✅ Safe area handling: Bottom insets prevent overlap with navigation bar
- ✅ **Gallery screen**: Dark theme; grid of saved caricatures, full-screen viewer
- ✅ **Save toast**: "View in Gallery" action after successful save
- ✅ **Toast notification system**: Beautiful in-app toasts replace all system Alert.alert calls
- ✅ **ConfirmDialog component**: Custom modal with optional neutral 3rd button
- ✅ **NotificationContext**: App-wide toast/notification state via React Context
- ✅ **Full Privacy Policy** and **Terms of Service** (13 sections each, in-app)
- ✅ **Menu** (`MenuModal.js`): Dark bottom sheet from StyleScreen burger — Gallery, Subscription, Privacy, Terms, About
- ✅ **Dark-first UI** (`#0B0F19`): Style, Upload, Review, Result, Gallery, Info, Subscription, Splash, app shell
- ✅ **Trial soft warnings**: Banner/toast when 1 free generation remains
- ✅ **Auto versioning**: `version.json` + bump scripts; About screen shows runtime version

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
- ✅ **160 styles in catalog**; **18 enabled** with protected prompts
- ✅ Usage tracking, quota enforcement, **idempotent per-job credits** (`job_usage_credits`)
- ✅ Queue worker: **atomic job claim** (`FOR UPDATE SKIP LOCKED`)
- ✅ **JWT auth** (`/api/auth/token`)
- ✅ **NSFW moderation** (Sightengine) in `api/process-job.ts`
- ✅ **Image upload validation** in `api/enqueue.ts`
- ✅ **Admin dashboard** (`/admin/login`)

### Database (Supabase)
- ✅ `users`, `subscriptions`, `usage_tracking`, `job_usage_credits`, `jobs`
- ✅ `rate_limits`, `infringements`, `subscription_history`, `cost_tracking`, `security_logs`

### Styles — Enabled (18 legacy)

| Id | Label | Category | Thumbnail |
|----|-------|----------|-----------|
| `90s-cartoon` | 90s | Cartoons | `toon.jpg` |
| `chibi` | Chibi | Cartoons | `chibi.jpg` |
| `neon` | Neon | Art | `neon.png` |
| `anime` | Anime | Anime & Manga | `anime.jpg` |
| `custom1` | Custom 1 | Trending | `custom1.jpg` |
| `custom2` | Custom 2 | Trending | `custom2.jpg` |
| `3dclay` | 3D Clay | 3D Characters | `3dclay.jpg` |
| `oil-paint` | Oil Paint | Paintings | `oilpaint.jpg` |
| `low-poly` | Low-Poly Cartoon | Art | `lowpoly.jpg` |
| `water-color` | Water Color | Paintings | `wc.jpg` |
| `pixar-like` | Pixar-like | 3D Characters | `pxl.jpg` |
| `funko-pop` | Funko Pop | 3D Characters | `funko.jpg` |
| `neandc` | Neanderthal | Fantasy & Mythical | `neandc.jpeg` |
| `neand3d` | Neanderthal 3D | Fantasy & Mythical | `neand3d.jpeg` |
| `handd` | Hand-Drawn | Caricatures | `handd.jpeg` |
| `superhero` | Superhero | Video Games | `superhero.jpeg` |
| `villian` | Super Villain | Video Games | `villian.jpeg` |
| `cyborg` | Cyborg | Video Games | `cyborg.jpeg` |

**Models**: `black-forest-labs/flux-kontext-pro` (most styles), `google/nano-banana` (custom2, neand3d, handd, superhero, villian, cyborg)

**Catalog**: 160 styles from spreadsheet — enable individually in `api/_utils/styles-config.ts` as prompts and thumbnails are ready.

---

## 📱 Recent Changes (June 2026)

| Change | Description |
|--------|-------------|
| **UI redesign (June 2026)** | Netflix-style StyleScreen, Upload→Review flow, dark theme app-wide, `pwd*` paywall — see `MD/UI_REDESIGN_2026_06.md` |
| **Dead code cleanup** | Removed CropScreen, PhotoChooserScreen; pruned ~440 unused styles; `scripts/prune-unused-styles.js` |
| **Menu + header polish** | Dark bottom sheet menu; style picker header + burger chip buttons |
| **Result screen** | Three-band layout, real job progress, local preview cache, pinned actions |
| **Style catalog expansion** | 16 categories, 160 styles; Netflix row navigation |
| **Auto versioning** | `version.json`, `bump-version.js`, build script integration |
| **90s label** | Renamed display label from "90s Cartoon" to **90s** |
| **Usage counter fix** | `job_usage_credits` + atomic queue claim |
| **Subscription sync fix** | `Purchases.logIn`, post-purchase sync, auth gating |
| **Local APK builds** | `build-apk-local.ps1` + Gradle (`assembleDebug`) |
| **Offline UX** | NetInfo banner, upload guard, reconnect refresh |
| **Local APK testing** | Prefer `build-apk-local.ps1` over Expo Go (SDK lock, RevenueCat, NetInfo) |

---

## 🚧 Deferred / Future

- [ ] Enable more catalog styles (thumbnails + prompts per style)
- [ ] Style tile before/after auto-sliders (curated demo assets)
- [ ] E003 high-demand error: friendly "generators busy" message
- [ ] Error tracking (**Sentry**) — see `To do/SENTRY_INTEGRATION.md`; Analytics
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
- [ ] Error tracking (Sentry) — `To do/SENTRY_INTEGRATION.md`
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
- **Version source**: `apps/mobile/version.json` (bump via `scripts/bump-version.js` or build scripts)
- **Staging**: `https://funnyfy-staging.vercel.app`
- **Production**: `https://funnyfyapp.vercel.app`
- **Expo SDK**: 52 (not upgraded to 53/54 — breaking changes)

---

**Status**: Feature-complete. Ready for app store submission and production launch.
