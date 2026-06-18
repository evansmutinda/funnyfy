# Security Implementation Guide

This document outlines the security features implemented and how to use them.

---

## ✅ Implemented Security Features

### 1. JWT Authentication (`api/auth/token.ts` + `apps/mobile/services/auth.js`)

The app now has a real authentication system:

- **Backend** (`/api/auth/token`): Creates or looks up a user in Supabase, issues a JWT signed with `JWT_SECRET`
- **Mobile** (`services/auth.js`): On first launch, calls the backend to get a real user ID and token; stores them on device
- **Fallback**: If the backend/DB is unavailable, the app generates a local UUID and keeps working
- **RevenueCat link**: The RevenueCat anonymous user ID is passed to the backend on auth, linking the subscription to the database user

**Auth service API:**
```js
import { initAuth, resetAuthIfLocal, forceReAuth } from './services/auth.js';

const auth = await initAuth(API_BASE, revenuecatUserId);
// Returns: { userId, token, isLocal }

await forceReAuth(API_BASE, revenuecatUserId); // clear + fresh token
await resetAuthIfLocal(); // clear local fallback only
```

After auth, `Purchases.logIn(userId)` links RevenueCat to the backend user.

### 2. Input Validation (`api/_utils/validation.ts`)
- **Zod schemas** for all input types
- **UUID validation** for user IDs
- **URL validation** with protocol checks
- **Style ID validation** (alphanumeric, lowercase, hyphens only)
- **Request body validation** helpers

### 3. Image Upload Validation (`api/enqueue.ts` + middleware)
Before a job is enqueued:
- **MIME type check**: Only `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **File size limit**: 10MB maximum
- **Magic byte verification**: File header bytes checked (prevents fake MIME types)

### 4. NSFW Content Moderation (`api/process-job.ts` + Sightengine)
- Images screened by Sightengine **before** sending to Replicate
- Threshold: `nudity.raw >= 0.3` → blocked (adjustable via `NSFW_RAW_THRESHOLD`)
- Blocked images create an `infringements` record in Supabase
- After 3 violations (`INFRINGEMENT_BAN_THRESHOLD`), user is banned (`users.banned_at` set)
- Banned users receive 403: "Your account has been suspended due to repeated policy violations."

### 5. HTTPS Enforcement (`apps/mobile/App.js`)
- App checks `API_BASE` on startup; throws an error if HTTP is used in non-localhost environments
- Prevents accidental misconfiguration sending data over unencrypted connections

### 6. Security Headers (`api/_utils/security.ts`)
- **HSTS** (HTTP Strict Transport Security)
- **Content Security Policy** (CSP)
- **X-Content-Type-Options** (prevent MIME sniffing)
- **X-XSS-Protection**
- **Referrer-Policy**
- **Permissions-Policy**

### 7. Input Sanitization (`api/_utils/security.ts`)
- **String sanitization** (removes XSS vectors)
- **URL sanitization** (validates protocol, length)
- **Max length limits**

### 8. Safe Error Handling (`api/_utils/security.ts`)
- Production hides internal error details
- Development mode shows full details for debugging

### 9. Rate Limiting
- Per-IP and per-user rate limiting
- Burst protection by tier
- Daily safety limits

### 10. Middleware Helpers (`api/_utils/middleware.ts`)
- Combined CORS, security headers, and OPTIONS handling
- Request body parsing with error handling
- Request validation helpers

---

## 🔧 Environment Variables

```bash
# JWT
JWT_SECRET=your-secret-key-here

# CORS
ALLOWED_ORIGIN=https://funnyfyapp.vercel.app

# NSFW Moderation
SIGHTENGINE_API_USER=your-api-user
SIGHTENGINE_API_SECRET=your-api-secret

# RevenueCat Webhook
REVENUECAT_WEBHOOK_SECRET=your-webhook-secret

# Database
DATABASE_URL=your-supabase-url

# Cost Protection
DAILY_SPENDING_CAP=100
```

---

## 🚨 Security Checklist

- [x] Input validation (Zod)
- [x] Authentication middleware (JWT)
- [x] Auth service with local fallback (mobile)
- [x] Security headers
- [x] Input sanitization
- [x] Safe error handling
- [x] Image MIME/size/magic byte validation
- [x] NSFW moderation (Sightengine)
- [x] Infringement tracking and user bans
- [x] HTTPS enforcement (mobile)
- [x] Rate limiting
- [x] Security logging (Supabase security_logs table)
- [ ] JWT token generation for admin (in progress)
- [ ] Redis-based rate limiting (planned)
- [ ] Formal security audit (pre-launch)

---

## 📚 Dependencies

```json
{
  "zod": "^3.22.4",
  "jsonwebtoken": "^9.0.2",
  "@types/jsonwebtoken": "^9.0.5"
}
```

---

**Last Updated**: June 2026
