# FunnyFy App Development Plan

## Overview
This document outlines the development plan and current status of FunnyFy - a React Native mobile application for generating AI caricatures.

## Current Implementation Status

### ✅ Completed (MVP)
- **Mobile App**: React Native (Expo) - Android & iOS compatible
- **Backend**: Vercel serverless functions (Node.js/TypeScript)
- **Styles**: 21 caricature styles implemented
- **Core Features**: Image upload, style selection, generation, save/share
- **Security**: API keys and prompts protected server-side
- **UI/UX**: Complete with splash screen, style selection, upload, and result screens

### 🚧 In Progress (Pre-Launch)
- Subscription management integration
- Database setup for usage tracking
- Queue and throttle system implementation
- User authentication

### 📋 Planned (Post-Launch)
- Analytics integration
- User accounts and history
- Advanced features (batch processing, favorites)

---

## 1. Architecture Overview

### 1.1 Backend Requirements
- **Purpose**: Keep Replicate API keys server-side (never expose to clients)
- **Core Functions**:
  - Proxy requests to Replicate API
  - Handle image uploads/storage
  - Manage job queues and status polling
  - Provide style/prompt presets
  - Rate limiting and error handling

### 1.2 Storage Strategy
- **Object Storage**: Use S3/GCS for input/output images
- **Signed URLs**: Generate temporary signed URLs for secure upload/download
- **Database**: Store job metadata (status, URLs, timestamps, errors)

### 1.3 API Contract

#### Endpoints

**POST /api/caricature**
- Request:
  ```json
  {
    "style": "90s-cartoon",
    "prompt": "optional override",
    "modelVersion": "optional override",
    "imageUrl": "s3://...",
    "params": { "exaggeration": 0.7 }
  }
  ```
- Response:
  ```json
  {
    "jobId": "uuid",
    "status": "queued",
    "estimatedTime": 30
  }
  ```

**GET /api/caricature/{jobId}**
- Response:
  ```json
  {
    "status": "processing|completed|failed",
    "outputUrl": "s3://...",
    "logs": ["..."],
    "error": null
  }
  ```

**GET /api/styles**
- Response:
  ```json
  {
    "styles": [
      {
        "id": "90s-cartoon",
        "label": "90s Cartoon",
        "prompt": "Make this a 90s cartoon",
        "defaultModelVersion": "black-forest-labs/flux-kontext-pro",
        "params": {}
      }
    ]
  }
  ```

**POST /api/upload**
- Request: Multipart form data (image file)
- Response:
  ```json
  {
    "uploadId": "uuid",
    "signedUploadUrl": "https://...",
    "imageUrl": "s3://..."
  }
  ```

---

## 2. Mobile App Development (IMPLEMENTED)

### 2.1 Tech Stack (Current)
- **Framework**: React Native (Expo)
- **Language**: JavaScript/TypeScript
- **UI**: React Native components with custom styling
- **Image Handling**: Expo ImagePicker, FileSystem, MediaLibrary
- **Networking**: Fetch API
- **State Management**: React Hooks (useState, useEffect)
- **Platform**: Cross-platform (Android & iOS from single codebase)

### 2.1.1 Why React Native Instead of Native?
- ✅ Faster development (single codebase for both platforms)
- ✅ Faster time to market
- ✅ Easier maintenance
- ✅ Can migrate to native later if needed

### 2.2 Core Features (IMPLEMENTED)

#### Splash Screen ✅
- App branding with "FunnyFy" logo
- 2-second splash before main screen

#### Style Selection Screen ✅
- Grid display of all 21 styles with preview images
- Visual style cards with images
- Tap to select style
- Shows style count

#### Upload Screen ✅
- Camera capture option
- Gallery selection option
- Image preview
- Generate button (disabled until image selected)

#### Result Screen ✅
- Before/after comparison slider (drag to compare)
- Progress bar with percentage
- Status messages (Starting, Processing, Almost done)
- Save to device functionality
- Share functionality
- Back and home navigation

### 2.3 User Flow
1. User opens app → Home screen
2. User selects/captures image
3. User picks style (or uses default)
4. User taps "Generate"
5. App uploads image → receives job ID
6. App polls job status every 2-3 seconds
7. When complete, show result screen
8. User can download/share or generate again

### 2.4 Performance Optimizations
- **Image Compression**: Downscale images to max 1024px before upload
- **Lazy Loading**: Load previews on-demand
- **Caching**: Cache recent results locally
- **Background Processing**: Continue polling in background (WorkManager)

### 2.5 Error Handling
- Network failures → Retry with exponential backoff
- Job failures → Show error message with retry option
- Timeout handling → Show "taking longer than expected" message
- Offline detection → Disable generate button with message

### 2.6 Security
- **Never store Replicate API key in app**
- Use backend API key for authentication
- Secure local storage for user preferences only
- Validate image file types and sizes

### 2.7 Testing Strategy
- **Unit Tests**: ViewModels, use cases, API mocks
- **UI Tests**: Critical user flows (upload → generate → result)
- **Integration Tests**: API integration with mock server
- **Performance Tests**: Image compression, memory usage

---

## 3. Backend Development (IMPLEMENTED)

### 3.1 Technology (Current)
- **Platform**: Vercel serverless functions
- **Language**: TypeScript/Node.js
- **Architecture**: Serverless (auto-scaling, pay-per-use)
- **API Style**: RESTful endpoints

### 3.2 Core Components (IMPLEMENTED)

#### API Endpoints ✅
- **GET /api/styles**: Returns list of available styles (prompts hidden)
- **POST /api/test**: Processes caricature generation request
  - Accepts: `{ payload: { styleId: string, imageUrl: string } }`
  - Validates styleId server-side
  - Uses protected prompts from server config
  - Polls Replicate API until completion
  - Returns final result with image URL

#### Style Configuration ✅
- **File**: `api/styles-config.ts`
- 21 styles configured
- Each style has: id, label, description, prompt, model, enabled, premium flags
- Prompts are protected (never sent to client)
- Models: `black-forest-labs/flux-kontext-pro` and `google/nano-banana`

#### Security ✅
- API keys stored in Vercel environment variables
- Prompts protected on server (client only sends styleId)
- CORS configured
- Error handling with generic messages (no internal details exposed)

### 3.2.1 TODO: Queue & Throttle System
- [ ] Database setup (Vercel Postgres or Supabase)
- [ ] User subscription tracking
- [ ] Usage quota enforcement (50/100/250 per month)
- [ ] Rate limiting per tier
- [ ] Job queue management
- [ ] Cost protection mechanisms

### 3.3 Database Schema

**jobs**
- id (UUID, primary key)
- user_id / session_id (string)
- style (string)
- prompt (text)
- model_version (string)
- input_image_url (string)
- output_image_url (string, nullable)
- status (enum: queued, processing, completed, failed)
- created_at (timestamp)
- completed_at (timestamp, nullable)
- error_message (text, nullable)
- replicate_prediction_id (string, nullable)

### 3.4 Rate Limiting
- Per IP: 10 requests/minute
- Per user (if authenticated): 50 requests/hour
- Per job: Max 5 minutes processing time

### 3.5 Monitoring & Logging
- Structured logging (JSON format)
- Request/response logging
- Error tracking (Sentry or similar)
- Performance metrics (response time, queue depth)
- Replicate API usage tracking

---

## 4. iOS App Development (Phase 2)

### 4.1 Tech Stack
- **Language**: Swift
- **UI Framework**: SwiftUI
- **Architecture**: MVVM (ObservableObject/StateObject)
- **Networking**: URLSession + async/await
- **Image Loading**: Kingfisher or Nuke
- **Local Storage**: UserDefaults or Core Data
- **Async**: async/await + Combine

### 4.2 Feature Parity
- Match Android feature set
- Same API endpoints
- Similar UI/UX patterns
- Consistent error handling

### 4.3 iOS-Specific Considerations
- **Camera**: Use UIImagePickerController or AVFoundation
- **Permissions**: Request camera/photo library access
- **Background Tasks**: Use background URLSession for polling
- **App Store**: Prepare for review (privacy policy, terms)

---

## 5. Development Phases

### ✅ Phase 1: MVP Development (COMPLETED)
- [x] Set up React Native project (Expo)
- [x] Implement Vercel serverless backend
- [x] Implement style catalog endpoint
- [x] Implement Replicate proxy endpoint
- [x] Build mobile app UI (splash, style selection, upload, result)
- [x] Implement image picker (camera & gallery)
- [x] Implement generation with progress tracking
- [x] Add save and share functionality
- [x] Deploy to Vercel
- [x] Configure 21 styles

### 🚧 Phase 2: Pre-Launch (IN PROGRESS)
- [ ] Set up database (Vercel Postgres or Supabase)
- [ ] Implement user authentication
- [ ] Integrate subscription management (RevenueCat/Stripe)
- [ ] Implement usage tracking and quota system
- [ ] Add queue and throttle management
- [ ] Implement cost protection mechanisms
- [ ] Add error tracking (Sentry)
- [ ] Set up analytics

### 📋 Phase 3: Launch Preparation
- [ ] App store assets (screenshots, descriptions)
- [ ] Privacy policy and terms of service
- [ ] Beta testing with real users
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Submit to Google Play Store
- [ ] Submit to Apple App Store

### 📋 Phase 4: Post-Launch (PLANNED)
- [ ] User accounts and history
- [ ] Favorite styles
- [ ] Batch processing
- [ ] Social sharing integration
- [ ] Analytics dashboard
- [ ] User feedback system

---

## 6. Style Catalog (21 Styles - IMPLEMENTED)

### Current Styles
1. **90s Cartoon** - Classic 90s animated cartoon style
2. **Chibi** - Cute, big-head chibi cartoon style
3. **Neon** - Vibrant neon cartoon style
4. **Anime** - Anime-style cartoon
5. **Custom 1** - Digital cartoon illustration with vibrant colors
6. **3D Clay** - 3D Clay cartoon style
7. **Oil Paint** - Oil-paint cartoon caricature style
8. **Low-Poly Cartoon** - Low-poly cartoon style
9. **Water Color** - Water color cartoon caricature style
10. **Pixar-like** - Pixar-like cartoon style including background
11. **Funko Pop** - Funko Pop style
12. **Custom 2** - Stylized 3D cartoon caricature (supports multiple faces)
13. **Neanderthal** - Funny neanderthal cartoon maintaining facial features
14. **Neanderthal 3D** - Funny neanderthal 3D caricature (detects all humans)
15. **Hand-Drawn** - Traditional hand-drawn editorial caricature
16. **Superhero** - Superhero caricature in action
17. **Super Villain** - Super villain caricature in action
18. **Cyborg** - Cyborg cartoon caricature in futuristic city settings

### Models Used
- **Primary**: `black-forest-labs/flux-kontext-pro` (most styles)
- **Secondary**: `google/nano-banana` (neanderthal, hand-drawn, superhero, villain, cyborg)

### Style Management
- Styles configured in `api/styles-config.ts`
- Can add/disable styles without app updates
- Prompts protected on server
- Preview images in `apps/mobile/assets/`

---

## 7. Technical Decisions

### 7.1 Why Server-Side Proxy?
- **Security**: API keys never exposed to clients
- **Control**: Can add rate limiting, caching, analytics
- **Flexibility**: Can switch models/APIs without app updates

### 7.2 Why Native Apps vs Web?
- **Performance**: Better image handling, camera access
- **User Experience**: Native feel, offline capabilities
- **Distribution**: App stores provide discovery and trust

### 7.3 Why React Native?
- **Cross-Platform**: Single codebase for Android & iOS
- **Faster Development**: Build once, deploy to both platforms
- **Faster Time to Market**: Launch on both platforms simultaneously
- **Easier Maintenance**: One codebase to maintain
- **Can Migrate**: Can move to native later if needed for performance

---

## 8. Future Enhancements

### Short Term (Post-Launch)
- [ ] User accounts and generation history
- [ ] Favorite styles
- [ ] Batch processing
- [ ] Enhanced social sharing
- [ ] User feedback system

### Medium Term
- [ ] Custom prompt builder (for Pro users)
- [ ] Style mixing/blending
- [ ] Video caricature support
- [ ] AR preview (try style before generating)
- [ ] Style recommendations based on photo

### Long Term
- [ ] On-device model (edge AI) for faster processing
- [ ] Community styles marketplace
- [ ] API for third-party integrations
- [ ] White-label solution

---

## 9. Risk Mitigation

### Technical Risks
- **Replicate API Changes**: Pin specific model versions, monitor API updates
- **High Costs**: Implement rate limiting, usage tracking, cost alerts
- **Slow Processing**: Set expectations, show progress, implement timeouts

### Business Risks
- **Competition**: Focus on unique styles and quality
- **Scalability**: Design for horizontal scaling from start
- **Legal**: Ensure image rights, privacy policy, terms of service

---

## 10. Success Metrics

### Technical Metrics
- API response time < 2s
- Job completion rate > 95%
- App crash rate < 0.1%
- Image upload success rate > 99%

### User Metrics
- Daily active users
- Generation completion rate
- Average time to first generation
- User retention (Day 1, Day 7, Day 30)

---

## 11. Resources Needed

### Development
- Backend developer (Node.js/Python)
- Android developer (Kotlin)
- iOS developer (Swift) - Phase 2
- UI/UX designer (optional)

### Infrastructure
- Cloud hosting (AWS/GCP/Azure)
- Object storage (S3/GCS)
- Database (PostgreSQL/MongoDB)
- CDN for image delivery

### Services
- Replicate API account
- Error tracking (Sentry)
- Analytics (Firebase/Mixpanel)
- App store accounts

---

## 12. Next Steps

1. **Review and approve this plan**
2. **Set up backend repository and infrastructure**
3. **Begin Phase 1: Backend Foundation**
4. **Set up project management (Jira/Trello/GitHub Projects)**
5. **Create detailed technical specifications for each phase**

---

## Appendix: File Structure

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   ├── caricature.js
│   │   ├── upload.js
│   │   └── styles.js
│   ├── services/
│   │   ├── replicate.js
│   │   ├── storage.js
│   │   └── jobManager.js
│   ├── models/
│   │   └── Job.js
│   └── config/
│       └── styles.json
├── tests/
└── package.json
```

### Android
```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/funnyfy/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── result/
│   │   │   │   │   └── settings/
│   │   │   │   ├── viewmodel/
│   │   │   │   ├── data/
│   │   │   │   │   ├── api/
│   │   │   │   │   └── local/
│   │   │   │   └── domain/
│   │   │   └── res/
│   │   └── test/
│   └── build.gradle
└── build.gradle
```

### iOS
```
ios/
├── Funnyfy/
│   ├── Views/
│   │   ├── HomeView.swift
│   │   ├── ResultView.swift
│   │   └── SettingsView.swift
│   ├── ViewModels/
│   ├── Services/
│   │   ├── APIService.swift
│   │   └── ImageService.swift
│   └── Models/
└── FunnyfyTests/
```

---

**Last Updated**: January 2025
**Version**: 1.0 (MVP Complete)
**Status**: Pre-Launch (Subscription & Database Integration)

