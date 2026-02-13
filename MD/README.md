# FunnyFy App

A mobile application for generating caricatures using AI/ML technology via the Replicate API.

## Project Overview

FunnyFy is a React Native mobile app (Android & iOS) that transforms user photos into caricatures using AI. The app uses a serverless backend on Vercel to securely handle API calls to Replicate.

## Project Structure

- `apps/mobile/` - React Native mobile app (Expo)
- `api/` - Vercel serverless functions (backend API)
- `MD/` - Development documentation and planning files
  - `STATUS.md` - **Current app status and launch checklist** ⭐
  - `DEVELOPMENT_PLAN.md` - Complete development plan and architecture
  - `PRICING_STRATEGY.md` - Pricing tiers and revenue projections
  - `SERVER_ARCHITECTURE_EXPLANATION.md` - Server setup and cost breakdown
  - `REPLICATE_VERCEL_BENEFITS.md` - **Benefits of Replicate + Vercel connection** 🔗
  - `GITHUB_SETUP_GUIDE.md` - Git and GitHub setup instructions
  - `USER_GUIDELINES.md` - Development guidelines

## Current Status

**✅ MVP + Subscription Complete – Ready for Production Testing**

### Implemented Features
- ✅ React Native mobile app (Android & iOS via Expo)
- ✅ 21 caricature styles available
- ✅ Image upload (camera & gallery)
- ✅ Style selection with preview images
- ✅ Real-time generation with progress tracking
- ✅ Before/after comparison slider
- ✅ Save and share functionality
- ✅ RevenueCat subscriptions (Starter $5, Popular $10, Pro $25)
- ✅ Usage tracking and quota enforcement (Supabase)
- ✅ Retry up to 3 times on generation failure; billing confirmation on max retries
- ✅ Save-before-navigate prompt when leaving result screen
- ✅ Plan badge as progress bar (Upload & Result screens)
- ✅ Pulsing "Processing…" indicator during generation
- ✅ Vercel serverless backend
- ✅ Protected API keys (server-side only)
- ✅ Style configuration (server-side, no app updates needed)

### Backend Infrastructure
- **Hosting**: Vercel (serverless functions)
- **Database**: Supabase (users, subscriptions, usage_tracking, jobs)
- **API**: Node.js/TypeScript serverless functions
- **Styles**: 21 styles (flux-kontext-pro and nano-banana models)
- **Security**: API keys server-side, prompts protected

### Pricing Tiers (Finalized)
- **Starter**: $5/month = 50 images/month
- **Popular**: $10/month = 100 images/month  
- **Pro**: $25/month = 250 images/month
- No yearly plans initially

### Next Steps for Launch
1. ✅ Subscription management (RevenueCat)
2. ✅ Database and usage tracking (Supabase)
3. ✅ Quota enforcement
4. [ ] Privacy policy & terms of service
5. [ ] App store submission (Google Play & App Store)

## Resources

- **Replicate API**: Caricature generation
- **Backend**: Vercel serverless (Node.js/TypeScript)
- **Mobile**: React Native (Expo) – Android & iOS
- **Database**: Supabase (Postgres)
- **Subscriptions**: RevenueCat

---

**Last Updated**: February 2025  
**Status**: MVP + Subscription Complete, Pre-Launch Testing

