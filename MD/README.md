# FunnyFy App

A mobile application for generating caricatures using AI/ML technology via the Replicate API.

## Project Overview

FunnyFy is a React Native mobile app (Android & iOS) that transforms user photos into caricatures using AI. The app uses a serverless backend on Vercel to securely handle API calls to Replicate.

## Project Structure

- `apps/mobile/` - React Native mobile app (Expo SDK 52)
- `apps/mobile/data/styleCatalog.js` - Generated style catalog (160 styles, 16 categories)
- `apps/mobile/version.json` - App version single source of truth
- `apps/mobile/scripts/bump-version.js` - Version bump script
- `apps/mobile/services/` - Auth and RevenueCat (`auth.js`, `revenuecat.js`)
- `apps/mobile/components/MediaTile.js` - Shared tile (style picker, gallery, upload chip)
- `apps/mobile/constants/fonts.js` - Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`)
- `apps/mobile/components/PaywallStyleMarquee.js` - Scrolling style strip on subscription hero
- `apps/mobile/components/MenuModal.js` - Dark bottom sheet app menu
- `apps/mobile/components/ComparisonFade.js`, `PhotoTipsSheet.js`, `PressScale.js` - Upload flow UI
- `apps/mobile/hooks/useImagePicker.js` - Gallery/camera pick + native crop (dev/APK)
- `apps/mobile/components/NetworkProvider.js` - Connectivity state (`@react-native-community/netinfo`)
- `apps/mobile/components/OfflineBanner.js` - Non-blocking offline bar
- `apps/mobile/utils/` - Style categories, subscription dates, trial warnings
- `api/_utils/styles-config.ts` - Enabled styles + prompts (server-side)
- `api/_utils/style-catalog.ts` - Full catalog from spreadsheet
- `scripts/generate-style-catalog.py` - Regenerate catalog from xlsx
- `api/` - Vercel serverless functions
- `build-apk.ps1` - EAS cloud APK build (`apps/mobile/`)
- `build-apk-local.ps1` - Local Gradle APK build (repo root)
- `MD/` - Development documentation

## Key Documentation Files

| File | Purpose |
|------|---------|
| `STATUS.md` | **Current app status and launch checklist** ⭐ |
| `UI_REDESIGN_2026_06.md` | **June 2026 mobile UI redesign reference** |
| `CHANGELOG.md` | Version history |
| `TESTING.md` | API, mobile, and versioning test guide |
| `DEVELOPMENT_PLAN.md` | Architecture and phases |
| `ADDING_MORE_STYLES_GUIDE.md` | Enable catalog styles + thumbnails |
| `BUILD_APK_GUIDE.md` | EAS and local APK builds (preferred over Expo Go) |
| `DATABASE_SCHEMA.md` | Supabase schema |
| `REVENUECAT_SETUP.md` | RevenueCat SDK + webhook |

## Current Status

**✅ Production-Ready – Awaiting App Store Submission**

**Version**: 1.0.3 (`apps/mobile/version.json`) — auto-bumps on build

### Implemented Features
- ✅ React Native mobile app (Expo SDK 52)
- ✅ **160-style catalog**, **18 enabled** live styles across 16 categories
- ✅ **Two-level style picker**: category tiles → style grid per category
- ✅ ShotCam-style `MediaTile` tiles: white cards, gradient + Plus Jakarta Sans label with dark backdrop pill (style picker)
- ✅ Image upload with style chip; generation via enqueue + job poll
- ✅ Before/after slider + auto-demo on result; **Try another style** restyle flow
- ✅ Gallery, save/share, toast notifications, ConfirmDialog
- ✅ RevenueCat subscriptions + backend sync
- ✅ Usage quota, NSFW moderation, JWT auth, admin dashboard
- ✅ **Auto versioning** on local/EAS builds
- ✅ **Offline UX**: banner when disconnected; gallery/styles browse offline; generation blocked until online
- ✅ Subscription screen: ink hero + marquee + white scrollable sheet

### Recommended testing (Android)
Use a **local debug APK** (`.\build-apk-local.ps1`) instead of **Expo Go** when possible — Expo Go auto-updates from the store and may break SDK 52 compatibility. See `MD/TESTING.md` and `MD/BUILD_APK_GUIDE.md`.

### Style Picker (current UX)
1. **Home**: 16 category tiles (wide/compact alternation), white background, FunnyFy wordmark + menu
2. **Category**: 2-column style grid, taller white cards; labels left-aligned with dark pill behind text; e.g. Cartoons → **90s**, **Chibi**, **Anime**
3. **Restyle**: Flat list of all enabled styles with banner

### Backend
- **Staging**: `https://funnyfy-staging.vercel.app`
- **Production**: `https://funnyfyapp.vercel.app`
- **Styles API**: `GET /api/styles` returns enabled styles + `categories`

### Pricing
- Starter $5 / Popular $10 / Pro $25 per month

### App Identifiers
- **Name**: FunnyFy
- **Package**: `com.evansks.funnyfyapp`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 52) |
| Backend | Vercel serverless (TypeScript) |
| Database | Supabase |
| AI | Replicate API |
| Subscriptions | RevenueCat |
| Auth | Custom JWT |

---

**Last Updated**: June 2026
