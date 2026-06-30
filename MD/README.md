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
- `apps/mobile/components/MediaTile.js` - Shared tile (style picker, gallery)
- `apps/mobile/components/UploadFlowHeader.js` - Shared upload/review header (back + style pill + usage pill)
- `apps/mobile/data/stylePhotoTips.js` - Per-style photo tips config for auto-show sheet
- `apps/mobile/utils/photoTipsPrefs.js` - AsyncStorage "don't show tips again" per style
- `apps/mobile/constants/fonts.js` - Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`)
- `apps/mobile/components/PaywallStyleFade.js` - Subscription hero style crossfade
- `apps/mobile/components/MenuModal.js` - Dark bottom sheet app menu
- `apps/mobile/components/ComparisonFade.js`, `PhotoTipsSheet.js`, `PressScale.js` - Upload flow UI
- `apps/mobile/hooks/useImagePicker.js` - Gallery/camera pick + OS crop (`expo-image-picker`)
- `apps/mobile/components/NetworkProvider.js` - Connectivity state + global `OfflineBanner`
- `apps/mobile/components/OfflineBanner.js` - Orange offline overlay (non-blocking)
- `apps/mobile/utils/contactSupport.js` - Menu Contact us mailto helper
- `apps/mobile/utils/` - Job progress, trial warnings, style categories, subscription dates
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
| `STYLES.md` | **Enabled styles, models, comparison pairs, deploy checklist** ⭐ |
| `UI_REDESIGN_2026_06.md` | **June 2026 mobile UI redesign reference** |
| `CHANGELOG.md` | Version history |
| `TESTING.md` | API, mobile, and versioning test guide |
| `DEVELOPMENT_PLAN.md` | Architecture and phases |
| `ADDING_MORE_STYLES_GUIDE.md` | Enable catalog styles + thumbnails (see also `STYLES.md`) |
| `BUILD_APK_GUIDE.md` | EAS and local APK builds (preferred over Expo Go) |
| `DATABASE_SCHEMA.md` | Supabase schema |
| `DISASTER_RECOVERY.md` | RTO/RPO, rollback, health checks, incident playbooks |
| `REVENUECAT_SETUP.md` | RevenueCat SDK + webhook |
| `SECURITY_AUDIT.md` | Security audit findings + checklist |
| `SECURITY.md` | Security implementation reference |

## Current Status

**✅ Production-Ready – Awaiting App Store Submission**

**Version**: 1.0.7 (`apps/mobile/version.json`) — auto-bumps on dev changes and APK builds

### Implemented Features
- ✅ React Native mobile app (Expo SDK 52)
- ✅ **160-style catalog**, **18 enabled** live styles across 16 categories
- ✅ **Netflix-style style picker**: dark `#0B0F19`, category rows + horizontal style carousels, "See all" grid
- ✅ **Upload → Review** two-screen flow with `UploadFlowHeader` (back + style pill left + usage pill right)
- ✅ **Photo tips**: auto-opens on Upload per style; "Do not show again" per style; OS crop via `expo-image-picker`
- ✅ Before/after compare on result (no Before/After badges); **Try another style** restyle flow; **Try another photo** on result
- ✅ Menu **Contact us**, **Share app**, **Request a style**; Gallery, save/share, toast notifications (`warning` = orange for offline), ConfirmDialog
- ✅ RevenueCat subscriptions + backend sync
- ✅ Usage quota, NSFW moderation, JWT auth, admin dashboard
- ✅ **Auto versioning** on local/EAS builds
- ✅ **Sentry** mobile error tracking (staging)
- ✅ **Offline UX**: orange global overlay banner; gallery/styles browse offline; generation blocked until online
- ✅ Subscription screen: full-bleed dark paywall (`#0B0F19`) + style fade hero + pinned CTA

### Recommended testing (Android)
Use a **local debug APK** (`.\build-apk-local.ps1`) instead of **Expo Go** when possible — Expo Go auto-updates from the store and may break SDK 52 compatibility. See `MD/TESTING.md` and `MD/BUILD_APK_GUIDE.md`.

### Style Picker (current UX)
1. **Home**: Netflix-style category rows on dark background; FunnyFy wordmark + icon-only burger menu
2. **See all**: 2-column discovery grid per category
3. **Restyle** (from result): flat list of enabled styles + banner

### Upload / Generate (current UX)
1. **Upload**: comparison fade background; header pills; Gallery/Camera cards; photo tips sheet auto-opens once per style
2. **Review**: same header pills; photo preview; Remove / Choose another / **Generate**
3. **Crop**: OS picker via `expo-image-picker` (`allowsEditing: true`) — all builds

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
| Error tracking | Sentry (mobile) |

---

**Last Updated**: June 2026
