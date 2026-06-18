# FunnyFy App

A mobile application for generating caricatures using AI/ML technology via the Replicate API.

## Project Overview

FunnyFy is a React Native mobile app (Android & iOS) that transforms user photos into caricatures using AI. The app uses a serverless backend on Vercel to securely handle API calls to Replicate.

## Project Structure

- `apps/mobile/` - React Native mobile app (Expo SDK 52)
- `apps/mobile/services/` - Auth and RevenueCat service modules
- `api/` - Vercel serverless functions (backend API)
- `api/_utils/` - Shared backend utilities (auth, security, validation, middleware)
- `api/auth/` - JWT authentication endpoint
- `api/webhooks/` - RevenueCat webhook handler
- `api/user/` - User subscription endpoints
- `api/admin/` - Admin dashboard backend
- `build-apk.ps1` - EAS cloud APK build (uses quota)
- `build-apk-local.ps1` - Local Gradle APK build (no EAS quota)
- `MD/` - Development documentation and planning files

## Key Documentation Files

| File | Purpose |
|------|---------|
| `STATUS.md` | **Current app status and launch checklist** ⭐ |
| `DEVELOPMENT_PLAN.md` | Complete development plan and architecture |
| `PRICING_STRATEGY.md` | Pricing tiers and revenue projections |
| `DATABASE_SCHEMA.md` | Full Supabase schema reference |
| `SECURITY.md` | Security features and middleware guide |
| `REVENUECAT_SETUP.md` | RevenueCat SDK + webhook setup |
| `NSFW_MODERATION_SIGHTENGINE.md` | NSFW blocking implementation |
| `BUILD_APK_GUIDE.md` | EAS and **local Gradle** APK build instructions |
| `REVENUECAT_PURCHASE_TESTING.md` | Subscription purchase + sync testing |
| `TESTING.md` | API and mobile testing guide |
| `USER_GUIDELINES.md` | Communication preferences for AI assistance |

## Current Status

**✅ Production-Ready – Awaiting App Store Submission**

**Version**: 1.0.2 (Android versionCode: 5, iOS buildNumber: 2)

### Implemented Features
- ✅ React Native mobile app (Android & iOS via Expo SDK 52)
- ✅ 21 caricature styles available
- ✅ Image upload (camera & gallery)
- ✅ Style selection with preview images
- ✅ Real-time generation with pulsing progress indicator
- ✅ Before/after comparison slider
- ✅ Save and share functionality
- ✅ Gallery screen (view saved caricatures, full-screen viewer)
- ✅ RevenueCat subscriptions with backend sync (`Purchases.logIn` + `/api/sync-subscription`)
- ✅ Usage tracking and quota enforcement (Supabase)
- ✅ Retry up to 3 times on generation failure; billing confirmation on max retries
- ✅ Save-before-navigate prompt when leaving result screen
- ✅ Plan badge as progress bar (Upload & Result screens)
- ✅ Toast notification system (replaces system Alert dialogs)
- ✅ ConfirmDialog component (with optional 3-button layout)
- ✅ Full Privacy Policy & Terms of Service (13 sections each, in-app)
- ✅ NSFW content moderation (Sightengine) with infringement tracking and bans
- ✅ JWT authentication (backend-issued token, stored on device)
- ✅ Auth service with local UUID fallback (app works even if DB is down)
- ✅ Restore Purchases button (Play Store policy requirement)
- ✅ Subscription cancellation endpoint (production-ready)
- ✅ Admin dashboard (login, queue stats, security logs)
- ✅ Image upload validation (MIME type, size limit, magic byte verification)
- ✅ HTTPS enforcement for API calls
- ✅ Vercel serverless backend
- ✅ Protected API keys (server-side only)
- ✅ Style configuration (server-side, no app updates needed)

### Backend Infrastructure
- **Hosting**: Vercel (serverless functions)
- **Database**: Supabase (users, subscriptions, usage_tracking, jobs, infringements, security_logs, cost_tracking)
- **API**: Node.js/TypeScript serverless functions
- **Styles**: 21 styles (flux-kontext-pro and nano-banana models)
- **Security**: API keys server-side, prompts protected, NSFW moderation, JWT auth, input validation
- **Staging URL**: `https://funnyfy-staging.vercel.app` ← use for development/testing
- **Production URL**: `https://funnyfyapp.vercel.app` (fix `DATABASE_URL` on Vercel before release)

### Pricing Tiers (Finalized)
- **Starter**: $5/month = 50 images/month
- **Popular**: $10/month = 100 images/month
- **Pro**: $25/month = 250 images/month
- No yearly plans initially

### App Identifiers
- **App name**: FunnyFy
- **Package**: `com.evansks.funnyfyapp`
- **Version**: 1.0.2 (Android versionCode: 5, iOS buildNumber: 2)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 52) |
| Backend | Vercel serverless (Node.js/TypeScript) |
| Database | Supabase (Postgres) |
| AI Generation | Replicate API |
| Subscriptions | RevenueCat |
| Auth | Custom JWT (backend-issued) |
| NSFW Moderation | Sightengine |
| Notifications | Custom Toast/ConfirmDialog system |

## Next Steps for Launch
1. ✅ Subscription management (RevenueCat)
2. ✅ Database and usage tracking (Supabase)
3. ✅ Quota enforcement
4. ✅ Privacy policy & terms of service (in-app)
5. ✅ NSFW moderation
6. ✅ JWT authentication
7. ✅ Toast notifications and UX polish
8. [ ] App store submission (Google Play)
9. [ ] App store assets (screenshots, descriptions, icon)

---

**Last Updated**: June 2026
**Status**: Feature-complete, ready for app store submission
