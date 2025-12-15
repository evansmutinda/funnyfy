# Funnyfy App Development Plan

## Overview
This document outlines the development plan for converting the web POC into production-ready Android and iOS mobile applications, starting with Android.

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

## 2. Android App Development (Phase 1)

### 2.1 Tech Stack
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM (ViewModel + StateFlow)
- **Networking**: Retrofit + OkHttp
- **Image Loading**: Coil
- **Local Storage**: DataStore (for preferences)
- **Async**: Coroutines + Flow
- **Dependency Injection**: Hilt or Koin

### 2.2 Core Features

#### Home Screen
- Image upload (camera or gallery)
- Style selector (dropdown/picker)
- Optional prompt override
- Model version override (advanced)
- Exaggeration slider
- "Generate" button

#### Result Screen
- Side-by-side before/after preview
- Download button
- Share button
- "Try Another Style" button
- Job status indicator (processing/completed/failed)

#### Settings Screen
- Remember API key (optional, for testing)
- Default style preference
- Image quality settings

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

## 3. Backend Development

### 3.1 Technology Options
- **Node.js**: Express/Fastify (matches current POC)
- **Python**: FastAPI (good for ML/AI workflows)
- **Go**: High performance, good for concurrent requests

### 3.2 Core Components

#### Image Upload Handler
- Accept multipart form data
- Validate file type and size
- Upload to S3/GCS
- Return signed URL or image URL

#### Replicate Proxy
- Accept job request with image URL
- Call Replicate API with proper authentication
- Handle polling internally
- Store job status in database
- Return job ID to client

#### Job Status Manager
- Store jobs in database (PostgreSQL/MongoDB)
- Poll Replicate API for status updates
- Update database as status changes
- Clean up old jobs (retention policy)

#### Style Manager
- Maintain style catalog (JSON file or database)
- Provide style metadata to clients
- Handle prompt generation

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

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Set up backend project structure
- [ ] Implement image upload endpoint
- [ ] Implement Replicate proxy endpoint
- [ ] Set up database and job tracking
- [ ] Implement style catalog endpoint
- [ ] Add basic error handling and logging
- [ ] Deploy to staging environment

### Phase 2: Android MVP (Week 3-5)
- [ ] Set up Android project (Kotlin + Compose)
- [ ] Implement image picker/camera
- [ ] Implement API client (Retrofit)
- [ ] Build home screen UI
- [ ] Build result screen UI
- [ ] Implement job polling
- [ ] Add error handling
- [ ] Basic testing

### Phase 3: Android Polish (Week 6-7)
- [ ] Add settings screen
- [ ] Implement image compression
- [ ] Add loading states and animations
- [ ] Improve error messages
- [ ] Add result caching
- [ ] Performance optimization
- [ ] UI/UX refinements

### Phase 4: iOS Development (Week 8-10)
- [ ] Set up iOS project (Swift + SwiftUI)
- [ ] Implement feature parity with Android
- [ ] iOS-specific optimizations
- [ ] App Store preparation

### Phase 5: Production Readiness (Week 11-12)
- [ ] Backend production deployment
- [ ] Rate limiting and monitoring
- [ ] Security audit
- [ ] Performance testing
- [ ] Beta testing (Android + iOS)
- [ ] Bug fixes and improvements
- [ ] Documentation

---

## 6. Style Catalog

### Current Styles (from POC)
1. **90s Cartoon**: `Make this a 90s cartoon`
2. **Colored Pencil**: `Make caricature in colored pencil`
3. **Chibi**: `Make this a chibi caricature`
4. **Manga**: `Make this a manga caricature`
5. **Black & White Pencil**: `Make this a black and white pencil caricature`
6. **Big Head Colored Pencil**: `Colored-pencil caricature of picture with big head, random expression, small body, rando shirt, rando trousers, random shoes, random background`
7. **Big Head Oil Pencil**: `Colored-pencil caricature of picture with big head, random expression, small body, rando shirt, rando trousers, random shoes, random background`
8. **American Comic**: `make an american comic`
9. **American Comic (Full Body)**: `make an american comic, full body`
10. **European Comic**: `make an american comic`
11. **European Comic (Full Body)**: `make an american comic, full body`
12. **Genndy Tartakovsky**: `make a Genndy Tartakovsky-stylized 2D caricature character with long exaggerated noses, elongated faces, and sharp angular features. Bold clean lineart, and dramatic noir-inspired shading. Character in suit and vintage outfit, placed inside a vertical color panel. Big expressive eyes, strong eyebrows, and a retro detective cartoon vibe. High-contrast, graphic, stylized character design`

### Default Model
- **Model**: `black-forest-labs/flux-kontext-pro`
- **Output Format**: `jpg` (can be made configurable)

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

### 7.3 Why Android First?
- **Market Share**: Larger user base
- **Development Speed**: More flexible deployment/testing
- **Learning**: Can refine approach before iOS

---

## 8. Future Enhancements

### Short Term
- [ ] User accounts and history
- [ ] Favorite styles
- [ ] Batch processing
- [ ] Social sharing integration

### Medium Term
- [ ] Custom prompt builder
- [ ] Style mixing/blending
- [ ] Video caricature support
- [ ] AR preview (try style before generating)

### Long Term
- [ ] On-device model (edge AI)
- [ ] Subscription tiers
- [ ] Community styles marketplace
- [ ] API for third-party integrations

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

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Planning Phase

