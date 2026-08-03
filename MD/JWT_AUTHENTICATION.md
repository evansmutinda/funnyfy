# JWT Authentication – FunnyFy

This document explains how FunnyFy's authentication system works, end-to-end.

**Last Updated**: June 2026

---

## Overview

FunnyFy uses JWT authentication. On launch, the app gets a token from `/api/auth/token`, stores it on device, and sends it on every API call. RevenueCat is linked to the same backend user via `Purchases.logIn(userId)`.

If the backend is unavailable, the app falls back to a local UUID (limited — no JWT, subscriptions and generation fail in production until re-auth).

---

## Flow (App Startup)

1. Initialize RevenueCat SDK (anonymous ID first)
2. `initAuth(API_BASE, revenuecatUserId)` — get JWT from backend (3 retries)
3. `Purchases.logIn(backendUserId)` — link RC customer to backend UUID; transfer prior purchases
4. Splash screen waits for auth before main UI
5. `refreshSubscription()` — sync RC state to backend if needed

---

## Components

### Backend: `/api/auth/token`

- **File**: `api/auth/token.ts`
- **Method**: `POST`
- **Body**: `{ revenuecatUserId?: string }`
- Creates or finds user in Supabase; links `revenuecat_user_id` when provided
- Returns `{ ok: true, userId, token }` (JWT expires in 30 days)

### Mobile: `services/auth.js`

**Use this file only.** Do not add `auth.ts` — Metro may resolve the wrong module.

| Function | Purpose |
|----------|---------|
| `initAuth(apiBase, revenuecatUserId)` | Get or restore auth; 3× retry before local fallback |
| `forceReAuth(apiBase, revenuecatUserId)` | Clear stored auth and fetch fresh token |
| `resetAuthIfLocal()` | Clear local fallback ID on startup |
| `clearAuth()` | Logout / wipe stored credentials |

**Storage**: `.funnyfyauth.json` in app document directory (not AsyncStorage)

### Mobile: `App.js` helpers

| Function | Purpose |
|----------|---------|
| `ensureAuthenticated()` | Wait for init; re-auth if no JWT |
| `syncSubscriptionToBackend(customerInfo)` | POST `/api/sync-subscription` after RC purchase |

### RevenueCat: `services/revenuecat.js`

| Function | Purpose |
|----------|---------|
| `loginUser(appUserId)` | `Purchases.logIn` — link RC to backend UUID |
| `getActiveSubscriptionDetails()` | Read entitlements for sync |

### API Calls

All protected endpoints require:

```
Authorization: Bearer <token>
x-user-id: <userId>
```

In **production**, only the JWT is accepted (not query/body `userId`). Backend: `requireAuth()` in `api/_utils/auth.ts`.

---

## Local Fallback

When backend/DB is down:

- `{ userId: localUuid, token: null, isLocal: true }` is stored
- App shows "Server unavailable" toast
- Purchases and `/api/enqueue` fail with `AUTHENTICATION_REQUIRED`
- `resetAuthIfLocal()` + restart fixes once backend is back

---

## Environment Variables (Backend)

```bash
JWT_SECRET=your-long-random-secret-key
DATABASE_URL=postgresql://...   # Must match Supabase — production was broken if auth returns TOKEN_GENERATION_FAILED
```

---

## Testing Auth

```powershell
# Staging (working)
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/auth/token" -Method POST -ContentType "application/json" -Body "{}"

# Expect: ok=true, userId, token
```

Metro logs to verify in app:

```
[AUTH_DEBUG] hasToken: true
[RevenueCat] Linked to backend user: <uuid>
```

---

## Limitations

- Anonymous users only — no email/password login
- No cross-device account sync (reinstall = new user unless RevenueCat restore)
- Future: Supabase Auth or Clerk

---

## Security Notes

- JWT signed with HS256 via `JWT_SECRET`
- Token expiry: 30 days (`TOKEN_EXPIRATION` in `api/auth/token.ts`)
- Production rejects unauthenticated requests (no `x-user-id`-only bypass)

---

**See also**: `SECURITY.md`, `REVENUECAT_PURCHASE_TESTING.md`, `api/auth/token.ts`, `apps/mobile/services/auth.js`
