# FunnyFy App Development Plan

## Overview
This document outlines the development plan and current status of FunnyFy — a React Native mobile application for generating AI caricatures.

---

## Current Implementation Status

### ✅ Completed (Feature-Complete)
- **Mobile App**: React Native (Expo SDK 52) — Android & iOS compatible
- **Backend**: Vercel serverless functions (Node.js/TypeScript)
- **Styles**: 21 caricature styles implemented
- **Core Features**: Image upload, style selection, generation, save/share, gallery
- **Security**: API keys and prompts protected server-side; JWT auth; NSFW moderation; image validation; HTTPS enforcement
- **Subscriptions**: RevenueCat (Starter $5, Popular $10, Pro $25); tier selection fix; restore purchases; cancellation
- **Database**: Supabase (users, subscriptions, usage_tracking, jobs, infringements, security_logs, cost_tracking)
- **UI/UX**: Toast notification system, ConfirmDialog, full Privacy Policy & Terms in-app, Gallery screen, progress bar badge
- **Auth**: JWT-based auth service (`services/auth.js`), backend creates real user in DB on first launch, local UUID fallback

### 🚧 Deferred (Post-Launch)
- Formal real authentication (Supabase Auth / Clerk) — current JWT system is functional but uses anonymous IDs
- Error tracking (Sentry)
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
  - `POST /api/test` – generation (polls Replicate, returns result)
  - `GET /api/user/subscription` – subscription + usage
  - `POST /api/sync-subscription` – RevenueCat sync
  - `POST /api/auth/token` – JWT auth (creates user in Supabase, issues token)
  - `POST /api/cancel-subscription` – cancel active subscription
  - `POST /api/webhooks/revenuecat` – RevenueCat event handler

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
- AsyncStorage for style/UI preferences
- expo-file-system for auth token persistence

### 2.2 Screens
1. **Style Selection** — grid of 21 styles, tap to select
2. **Upload** — camera or gallery, plan badge progress bar
3. **Result** — before/after slider, save/share, plan badge
4. **Gallery** — saved caricature grid, full-screen viewer
5. **Subscription** — current plan, usage, plan selection, restore/refresh/cancel

### 2.3 Notification System
- **ToastNotification**: Floating in-app toast (success, error, info)
- **ConfirmDialog**: Modal with 2 or 3 buttons (e.g. Save / Discard / Cancel)
- **NotificationContext**: Provider wraps the whole app; all screens share notification state
- All `Alert.alert` calls have been migrated to this system

### 2.4 Auth Flow
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
- 21 styles
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
- Admin dashboard
- versionCode: 4

### 📋 Phase 3: Launch Preparation (Current)
- [ ] App store assets (screenshots, descriptions, icon)
- [ ] Host Privacy Policy on public URL
- [ ] Google Play Store submission
- [ ] Apple App Store submission

### 📋 Phase 4: Post-Launch (Planned)
- Analytics integration
- Error tracking (Sentry)
- User history / favorites
- Subscription trial (3-day via Play Store)
- Formal security audit

---

## 4. Style Catalog (21 Styles)

Models:
- **Primary**: `black-forest-labs/flux-kontext-pro` (most styles)
- **Secondary**: `google/nano-banana` (neanderthal, hand-drawn, superhero, villain, cyborg)

Styles are configured server-side in `api/styles-config.ts`. New styles can be added without an app update.

---

## 5. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Expo SDK 52 (not 53/54) | expo-file-system v19 has breaking changes; SDK 53 jumps to React 19; RevenueCat compatibility; ship what works |
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

**Last Updated**: May 2026
**Version**: Feature-complete, pre-submission
