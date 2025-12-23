# Security Implementation Guide

This document outlines the security features implemented and how to use them.

## ✅ Implemented Security Features

### 1. Input Validation (`api/utils/validation.ts`)
- **Zod schemas** for all input types
- **UUID validation** for user IDs
- **URL validation** with protocol checks
- **Style ID validation** (alphanumeric, lowercase, hyphens only)
- **Request body validation** helpers

**Usage:**
```typescript
import { validateBody, generateRequestSchema } from './utils/validation';

const validation = validateBody(generateRequestSchema, req.body);
if (!validation.success) {
  return res.status(400).json({ ok: false, error: validation.error });
}
const { styleId, imageUrl } = validation.data;
```

### 2. Authentication (`api/utils/auth.ts`)
- **JWT token verification** (if `JWT_SECRET` is set)
- **Multiple auth methods**:
  - `X-User-Id` header (for development)
  - `Authorization: Bearer <token>` header (JWT)
  - `userId` in request body/query
- **UUID format validation** for user IDs

**Usage:**
```typescript
import { requireAuth } from './utils/auth';

const userId = requireAuth(req, res);
if (!userId) return; // Response already sent
```

### 3. Security Headers (`api/utils/security.ts`)
- **HSTS** (HTTP Strict Transport Security)
- **Content Security Policy** (CSP)
- **X-Content-Type-Options** (prevent MIME sniffing)
- **X-XSS-Protection**
- **Referrer-Policy**
- **Permissions-Policy**

**Usage:**
```typescript
import { setSecurityHeaders, setCorsHeaders } from './utils/security';

setSecurityHeaders(res);
setCorsHeaders(res, allowedOrigin);
```

### 4. Input Sanitization (`api/utils/security.ts`)
- **String sanitization** (removes XSS vectors)
- **URL sanitization** (validates protocol, length)
- **Max length limits**

**Usage:**
```typescript
import { sanitizeString, sanitizeUrl } from './utils/security';

const safeString = sanitizeString(userInput);
const safeUrl = sanitizeUrl(userInput);
```

### 5. Error Handling (`api/utils/security.ts`)
- **Safe error responses** (no internal details leaked)
- **Development mode** shows details, production hides them

**Usage:**
```typescript
import { safeErrorResponse } from './utils/security';

return safeErrorResponse(res, 500, 'Internal error', err.message);
```

### 6. Middleware Helpers (`api/utils/middleware.ts`)
- **Combined middleware** for CORS, security headers, OPTIONS
- **Request body parsing** with error handling
- **Request validation** helpers

**Usage:**
```typescript
import { applyMiddleware, parseBody, validateGenerateRequest } from './utils/middleware';

if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;

const bodyResult = parseBody(req);
if (!bodyResult.success) {
  return res.status(bodyResult.status).json({ ok: false, error: bodyResult.error });
}

const validation = validateGenerateRequest(bodyResult.data);
if (!validation.success) {
  return res.status(400).json({ ok: false, error: validation.error });
}
```

## 🔧 Environment Variables

Add these to your Vercel project:

```bash
# JWT Secret (for token-based auth)
JWT_SECRET=your-secret-key-here
# OR use AUTH_SECRET (alternative name)

# CORS
ALLOWED_ORIGIN=https://funnyfyapp.vercel.app
# Use '*' for development, specific origin for production
```

## 📝 Next Steps

### To Apply Security to Existing Endpoints

1. **Update `api/test.ts`**:
   ```typescript
   import { applyMiddleware, parseBody, validateGenerateRequest } from './utils/middleware';
   import { requireAuth } from './utils/auth';
   import { safeErrorResponse } from './utils/security';

   export default async function handler(req, res) {
     if (!applyMiddleware(req, res, ['POST', 'OPTIONS'])) return;
     
     const userId = requireAuth(req, res);
     if (!userId) return;
     
     const bodyResult = parseBody(req);
     if (!bodyResult.success) {
       return safeErrorResponse(res, bodyResult.status, bodyResult.error);
     }
     
     const validation = validateGenerateRequest(bodyResult.data);
     if (!validation.success) {
       return safeErrorResponse(res, 400, validation.error);
     }
     
     // ... rest of handler
   }
   ```

2. **Update `api/enqueue.ts`** (similar pattern)

3. **Update `api/usage.ts`**:
   ```typescript
   import { applyMiddleware } from './utils/middleware';
   import { requireAuth } from './utils/auth';

   export default async function handler(req, res) {
     if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) return;
     
     const userId = requireAuth(req, res);
     if (!userId) return;
     
     // ... rest of handler
   }
   ```

4. **Update `api/user/subscription.ts`** (similar pattern)

## 🔒 Security Best Practices

1. **Always validate input** using Zod schemas
2. **Always sanitize user input** before using in queries
3. **Never expose internal errors** in production
4. **Use parameterized queries** (already done via `query()` helper)
5. **Set security headers** on all responses
6. **Rate limit** all endpoints (already implemented)
7. **Require authentication** for all user-facing endpoints

## 🚨 Security Checklist

- [x] Input validation (Zod)
- [x] Authentication middleware
- [x] Security headers
- [x] Input sanitization
- [x] Safe error handling
- [ ] Apply to all endpoints (in progress)
- [ ] JWT token generation endpoint
- [ ] Rate limiting improvements (Redis-based)
- [ ] Security logging
- [ ] Admin authentication

## 📚 Dependencies Added

```json
{
  "zod": "^3.22.4",
  "jsonwebtoken": "^9.0.2",
  "@types/jsonwebtoken": "^9.0.5"
}
```

Run `npm install` to install these dependencies.
