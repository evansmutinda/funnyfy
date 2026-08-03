# FunnyFy App Development Plan

## Overview
This document outlines the development plan and current status of FunnyFy — a React Native mobile application for generating AI caricatures.

---

## Current Implementation Status

### ✅ Completed (Feature-Complete)
- **Mobile App**: React Native (Expo SDK 52) — Android & iOS compatible
- **Backend**: Vercel serverless functions (Node.js/TypeScript)
- **Styles**: 160 in catalog; enabled count in `MD/STYLES.md` / `MD/PROMPTS.md`
- **Style UX**: Netflix-style category rows on dark background; image-only `MediaTile` on picker (category headers only)
- **Core Features**: Image upload, style selection, generation, save/share, gallery, restyle
- **Upload header**: `UploadFlowHeader` — `[ ← back ] [ style pill ] ···· [ usage pill ]` on Upload + Review (see `MD/UI_REDESIGN_2026_06.md` §6)
- **Security**: API keys and prompts protected server-side; JWT auth; NSFW moderation; image validation
- **Subscriptions**: RevenueCat; split paywall UI (hero marquee + plans sheet)
- **Versioning**: `apps/mobile/version.json` + auto-bump on APK builds (do not hardcode semver in docs)
- **Database**: Supabase (users, subscriptions, usage_tracking, jobs, infringements, etc.)
- **UI/UX**: Toast system, ConfirmDialog, Privacy Policy & Terms, Gallery screen
- **Auth**: JWT-based auth service (`services/auth.js`), local UUID fallback
- **Error tracking**: Sentry mobile (`utils/sentry.js`, staging environment)

### 🚧 Deferred (Post-Launch)
- Formal real authentication (Supabase Auth / Clerk) — current JWT system is functional but uses anonymous IDs
- Analytics (Firebase/Mixpanel)
- Subscription trial (time-based 3-day trial via Play Store)
- E003 "generators busy" friendly error

### 📋 Remaining Before Launch
- App store submission (Google Play, then App Store)
- App store assets (screenshots, icon, descriptions)
- Host Privacy Policy on public URL (required for Play Store listing page)

---

## 1. Architecture Overview

### 1.1 Backend
- **Platform**: Vercel serverless functions
- **Language**: TypeScript/Node.js
- **Functions**:
  - `GET /api/styles` – style catalog
  - `POST /api/enqueue` – create job; client polls `GET /api/job?id=...`
  - `GET /api/user/subscription` – subscription + usage
  - `POST /api/sync-subscription` – RevenueCat sync
  - `POST /api/auth/token` – JWT auth (creates user in Supabase, issues token)
  - `POST /api/cancel-subscription` – cancel active subscription
  - `POST /api/webhooks/revenuecat` – RevenueCat event handler
  - `GET/POST /api/admin?resource=…` – Admin API (stats, finance, growth, users, jobs, moderation, security-logs, queue-stats)
  - `GET /api/admin?page=login|dashboard` – Admin UI HTML/JS
  - `GET /api/health` – Public uptime check
  - `GET /api/db-test` – DB connectivity (requires `CRON_SECRET`)

### 1.2 Mobile App
- **Framework**: React Native (Expo SDK 52)
- **Services**: `services/auth.js` (JWT auth), `services/revenuecat.js` (RevenueCat SDK)
- **State**: React Hooks + Context (NotificationContext for toasts)
- **Image handling**: expo-image-picker, expo-file-system, expo-image-manipulator, expo-media-library
- **Gallery**: react-native-image-viewing

### 1.3 Database (Supabase)
See `MD/DATABASE_SCHEMA.md` for full schema.

Key tables:
- `users` – accounts, subscription tier, trial usage, `banned_at`
- `subscriptions` – active subscriptions (RevenueCat sync)
- `usage_tracking` – monthly generation counts
- `jobs` – generation queue
- `infringements` – NSFW violations
- `cost_tracking` – Replicate API costs per job

---

## 2. Mobile App

### 2.1 Tech Stack
- React Native (Expo SDK 52) — intentionally not upgraded to 53/54 (breaking changes in expo-file-system and image picker)
- JavaScript
- React Context for notification state
- AsyncStorage for style/UI preferences and in-app gallery index (`@funnyfy_gallery`)
- expo-file-system for auth token persistence and optional `documentDirectory/gallery/` copies
- Device saves: **`DCIM/Funnyfy/`** via `expo-media-library` (`funnyfyAlbum.js`) — not direct file writes

### 2.2 Screens
1. **Style Selection** — Netflix-style category rows on dark background; "See all" → 2-column grid
2. **Upload** — `UploadFlowHeader`: back + style pill (left) + usage pill (right); Gallery/Camera; photo tips auto-sheet
3. **Review / Generate** — same header pills; confirm photo; Generate CTA
4. **Result** — before/after slider + auto-demo, save/share, try another style
5. **Gallery** — saved caricature grid, full-screen viewer; loads from **`DCIM/Funnyfy/`** (see `MD/GALLERY_SCREEN.md`)
6. **Subscription** — full-bleed dark paywall (`#0B0F19`); usage card, tier cards, pinned CTA

### 2.3 Offline / connectivity
- **`@react-native-community/netinfo`** via `NetworkProvider` — tracks online/offline
- **`OfflineBanner`** — global **orange overlay** at top when disconnected (does not shift layout)
- **Fallback styles** — `DEFAULT_ENABLED_STYLES` if `/api/styles` fails
- **Blocked offline**: generate, subscribe, restore purchases
- **Works offline**: gallery, about, legal pages, style browsing (cached/fallback catalog)
- **On reconnect**: refresh styles, subscription, re-auth if needed

### 2.4 Notification System
- **ToastNotification**: Floating in-app toast (success, error, info)
- **ConfirmDialog**: Modal with 2 or 3 buttons (e.g. Save / Discard / Cancel)
- **NotificationContext**: Provider wraps the whole app; all screens share notification state
- All `Alert.alert` calls have been migrated to this system

### 2.5 Auth Flow
1. App starts → `initRevenueCat()` → get RevenueCat anonymous user ID
2. `initAuth(apiBase, revenuecatUserId)` → POST `/api/auth/token`
3. Backend creates/finds user in Supabase, returns `{ userId, token }`
4. Stored on device filesystem (`.funnyfyauth.json`)
5. All subsequent API calls use `x-user-id` and `Authorization: Bearer <token>` headers
6. If backend unavailable → local UUID fallback (app still works)

---

## 3. Development Phases

### ✅ Phase 1: MVP (Complete)
- React Native app with Expo
- Vercel serverless backend
- Enabled styles (160 in catalog) — see `MD/STYLES.md`
- Image upload, generation, save/share
- Replicate integration

### ✅ Phase 2: Pre-Launch (Complete)
- Supabase database (users, jobs, usage, subscriptions, cost tracking, security logs)
- RevenueCat subscriptions (3 tiers)
- Usage quota enforcement
- Rate limiting
- JWT authentication (with local fallback)
- NSFW moderation (Sightengine)
- Image upload validation (MIME, size, magic bytes)
- Toast/ConfirmDialog notification system
- Gallery screen
- Full Privacy Policy & Terms in-app
- Restore Purchases + Refresh buttons
- Subscription cancellation (production-ready)
- **Admin dashboard** — `api/admin.ts` + `api/_utils/admin-pages/` (Overview, Finance, Growth, Users, Jobs, Queue, Moderation, Security)
- **Mobile UI polish (v1.0.3–1.0.4)**: MediaTile tiles, two-level categories, restyle flow, subscription marquee, auto versioning, offline UX
- versionCode: 5

### 📋 Phase 3: Launch Preparation (Current)
- [ ] App store assets (screenshots, descriptions, icon)
- [ ] Host Privacy Policy on public URL
- [ ] Google Play Store submission
- [ ] Apple App Store submission

### 📋 Phase 4: Post-Launch (Planned)
- Analytics integration
- Optional API Sentry (`@sentry/node` on Vercel)
- User history / favorites
- Subscription trial (3-day via Play Store)
- Formal security audit

---

## 4. Style Catalog

- **160 styles** in spreadsheet catalog across **16 categories**
- **Enabled styles** with live prompts — see `MD/STYLES.md` (count also in generated `MD/PROMPTS.md`)
- Models:
  - **Primary**: `black-forest-labs/flux-kontext-pro` (most styles)
  - **Secondary**: `google/nano-banana` (handd)

Styles are configured server-side in `api/_utils/styles-config.ts`. Thumbnails are bundled in `apps/mobile/assets/` via `getStyleImage()` in `constants.js`.

---

## 5. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Expo SDK 52 (not 53/54) | expo-file-system v19 has breaking changes; SDK 53 jumps to React 19; RevenueCat compatibility; ship what works |
| Local debug APK over Expo Go | SDK lock, RevenueCat, NetInfo; Expo Go auto-updates break compatibility |
| JWT auth with local fallback | App works even when DB is down; real user IDs in DB when available |
| Sightengine for NSFW | Server-side before Replicate; affordable; returns confidence scores for thresholding |
| Toast/ConfirmDialog system | Better UX than system Alert dialogs; consistent look across Android/iOS |
| No Supabase Auth / Clerk yet | Deferred due to complexity; current JWT system is sufficient for launch |
| No yearly plans initially | Monitor costs and usage first |

---

## 6. Success Metrics (Post-Launch)

- API response time < 2s
- Job completion rate > 95%
- App crash rate < 0.1%
- DAU/MAU, subscription conversion, MRR
- Churn rate < 5%/month

---

**Last Updated**: June 2026
**Version**: Feature-complete, pre-submission
