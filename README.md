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

**✅ MVP Complete - Ready for Launch**

### Implemented Features
- ✅ React Native mobile app (Android & iOS via Expo)
- ✅ 21 caricature styles available
- ✅ Image upload (camera & gallery)
- ✅ Style selection with preview images
- ✅ Real-time generation with progress tracking
- ✅ Before/after comparison slider
- ✅ Save and share functionality
- ✅ Vercel serverless backend
- ✅ Protected API keys (server-side only)
- ✅ Style configuration (server-side, no app updates needed)

### Backend Infrastructure
- **Hosting**: Vercel (serverless functions)
- **API**: Node.js/TypeScript serverless functions
- **Styles**: 21 styles configured (mix of flux-kontext-pro and nano-banana models)
- **Security**: API keys protected on server, prompts server-side only

### Pricing Tiers (Finalized)
- **Starter**: $5/month = 50 images/month
- **Popular**: $10/month = 100 images/month  
- **Pro**: $25/month = 250 images/month
- No yearly plans (monitoring API usage first)

### Next Steps for Launch
1. ✅ Implement subscription management (RevenueCat/Stripe)
2. ✅ Add database for usage tracking and queue management
3. ✅ Implement quota/throttle system on Vercel
4. ✅ Add user authentication
5. ✅ Deploy to app stores (Google Play & App Store)

## Resources

- **Replicate API**: For caricature generation
- **Backend**: Vercel serverless functions (Node.js/TypeScript)
- **Mobile**: React Native (Expo) - Android & iOS
- **Database**: TBD (Vercel Postgres or Supabase recommended)

---

**Last Updated**: January 2025  
**Status**: MVP Complete, Pre-Launch

