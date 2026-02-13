# FunnyFy App - Current Status

**Last Updated**: February 2025  
**Version**: 1.0.1 (Android versionCode: 2)  
**Status**: Post-MVP – Subscription & UI Polish Complete

---

## 🎯 Overview

FunnyFy is a React Native mobile application that transforms user photos into AI-generated caricatures using the Replicate API. The app has subscription integration via RevenueCat, usage tracking, quota enforcement, and a polished UI.

---

## ✅ Completed Features

### Mobile App (React Native/Expo)
- ✅ Cross-platform app (Android & iOS)
- ✅ Splash screen with branding
- ✅ Style selection screen with 21 styles and preview images
- ✅ Image upload (camera & gallery)
- ✅ Real-time generation with progress tracking
- ✅ Before/after comparison slider
- ✅ Save to device functionality
- ✅ Share functionality
- ✅ Error handling and user feedback
- ✅ **Retry logic**: Up to 3 attempts on failure; after 3rd, shows "Please try again later" with billing confirmation (failed runs not charged)
- ✅ **Save before navigate**: Prompts to save when leaving result screen with unsaved image (Back, Home, hardware back)
- ✅ **Processing indicator**: Pulsing "Processing…" text during generation
- ✅ **Plan badge as progress bar**: Combined badge + quota progress in one pill (Upload & Result screens)
- ✅ **RevenueCat integration**: Subscriptions, trial, tier management
- ✅ **Safe area handling**: Bottom insets prevent overlap with navigation bar (48px Android, 34px iOS min)

### Paywall / Subscription UI
- ✅ Subscription screen with Current Plan, Usage This Month, Available Plans
- ✅ Pricing: $5 / $10 / $25 (no .99)
- ✅ Plan benefits removed; quota-only display
- ✅ Date format: dd/mmm/yyyy (e.g. 10/Feb/2025)
- ✅ "Most popular" ribbon on Popular tier
- ✅ Polished paywall: light background, header tagline, card shadows, consistent styling

### Backend (Vercel Serverless)
- ✅ Serverless API endpoints
- ✅ Style catalog API (`/api/styles`)
- ✅ Generation API (`/api/test`) – polls Replicate, returns completed result
- ✅ User subscription API (`/api/user/subscription`)
- ✅ Sync subscription, RevenueCat webhook handling
- ✅ 21 styles with protected prompts
- ✅ Usage tracking, quota enforcement
- ✅ Replicate status handling: succeeded/failed/canceled; usage incremented only on success

### Database (Supabase)
- ✅ `users` – user accounts, trial/subscription state
- ✅ `subscriptions` – active subscriptions, tier, period end
- ✅ `usage_tracking` – monthly generation count per user
- ✅ `jobs` – generation job tracking
- ✅ `rate_limits` – IP rate limiting

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

## 📱 Recent UI/UX Changes (Feb 2025)

| Change | Description |
|--------|-------------|
| **Retry flow** | 3 retries on failure; after 3rd, user-friendly message + billing confirmation |
| **Save before leave** | Alert (Save / Discard / Cancel) when navigating away with unsaved result |
| **Processing pulse** | "Processing…" text fades in/out (800ms cycle) during generation |
| **Badge as progress bar** | Plan badge (e.g. Popular • 89/100) doubles as a filled progress bar |
| **Running low** | Removed intrusive "Running low - Upgrade now" banner; kept progress bar + badge |
| **Bottom insets** | Fixed overlap with navigation bar (Android 48px, iOS 34px minimum) |
| **Paywall** | Polished UI, prices $5/$10/$25, benefits removed, date format dd/mmm/yyyy |
| **Subscription cards** | Usage card matches plan card styling (border, shadows, typography) |

---

## 🚧 In Progress / Planned

### Deferred / Future
- [ ] E003 high-demand error: friendly "generators busy" message (vs generic error)
- [ ] Save notification: system notification with full path, tap to open photo
- [x] NSFW content blocking (Sightengine – server-side before Replicate)

### Pre-Production
- [ ] Error tracking (e.g. Sentry)
- [ ] Analytics
- [ ] Security audit

---

## 📋 Launch Checklist

### Technical
- [x] Database integration (Supabase)
- [x] Subscription tiers (RevenueCat)
- [x] Usage quota system (50/100/250 per month)
- [x] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Analytics
- [ ] Performance optimization
- [ ] Security audit

### Business
- [x] Finalize pricing ($5/$10/$25)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] App store assets
- [ ] Marketing materials

### App Store
- [ ] Google Play Store listing (APK/AAB built)
- [ ] Apple App Store listing
- [ ] App store optimization (ASO)
- [ ] Submission and review

---

## 💰 Pricing (Finalized)

| Tier   | Price | Images/Month | Cost   | Profit | Margin |
|--------|-------|--------------|--------|--------|--------|
| Starter | $5   | 50           | $2.00  | $3.00  | 60%    |
| Popular | $10  | 100          | $4.00  | $6.00  | 60%    |
| Pro     | $25  | 250          | $10.00 | $15.00 | 60%    |

**Note**: No yearly plans initially.

---

## 🏗️ Architecture

### Current Stack
- **Mobile**: React Native (Expo)
- **Backend**: Vercel serverless (Node.js/TypeScript)
- **API**: Replicate for image generation
- **Database**: Supabase (Postgres)
- **Subscriptions**: RevenueCat
- **Hosting**: Vercel (API + Admin dashboard)

### Key Endpoints
- `GET /api/styles` – style catalog
- `POST /api/test` – generation (sync poll)
- `GET /api/user/subscription` – subscription + usage
- `POST /api/sync-subscription` – RevenueCat sync

---

## 📊 Key Metrics (Post-Launch)

- API response time, job completion rate
- App crash rate, upload success rate
- DAU/MAU, subscription conversion, MRR
- Generations per user, popular styles

---

## 📝 Notes

- **App name**: FunnyFy  
- **Package**: `com.evansks.funnyfyapp`  
- **Staging**: `https://funnyfy-staging.vercel.app`  
- **Production**: `https://funnyfyapp.vercel.app`  
- **Admin**: `/admin/login`  
- **Cost per generation**: ~$0.04  
- **Failed Replicate runs**: Not billed (see `MD/REPLICATE_BILLING_FAILED_RUNS.md`)

---

**Status**: Subscription and core UX complete; ready for production testing and app store submission.
