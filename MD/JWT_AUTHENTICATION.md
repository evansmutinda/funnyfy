# JWT Authentication – FunnyFy

This document explains how FunnyFy's authentication system works, end-to-end.

---

## Overview

FunnyFy uses a lightweight JWT (JSON Web Token) authentication system. On first launch, the app calls the backend to create a real user record in Supabase and get a token. That token is stored on the device and used for all subsequent API calls.

If the backend is unavailable, the app generates a local ID and keeps working (graceful fallback).

---

## How It Works (Plain English)

Think of JWT authentication like a hotel key card:
- The **backend** is the front desk — it checks your identity and gives you a key card (JWT token)
- The **app** stores the key card and shows it to every door (API endpoint)
- Each door checks the key card is valid before letting you in

---

## Components

### Backend: `/api/auth/token`
- **File**: `api/auth/token.ts`
- **Method**: `POST`
- **Request body**: `{ revenuecatUserId?: string }`
- **What it does**:
  1. Checks if a user with this RevenueCat ID already exists in Supabase
  2. If not, creates a new user row (`subscription_tier: 'trial'`, `trial_generations_used: 0`)
  3. Signs a JWT with `JWT_SECRET` containing the user's UUID
  4. Returns `{ ok: true, userId, token }`

### Mobile: `services/auth.js`
- **Function**: `initAuth(apiBase, revenuecatUserId)`
- **Called on**: App startup, after RevenueCat initialises
- **What it does**:
  1. Checks device for stored auth (`.funnyfyauth.json`)
  2. If found, returns stored `{ userId, token, isLocal }`
  3. If not found, calls `/api/auth/token` to get real credentials
  4. If backend fails, generates a local UUID (fallback)
  5. Stores result on device filesystem

### API Calls
All API calls from the app include:
```
x-user-id: <userId>
Authorization: Bearer <token>
```

Backend endpoints use `requireAuth(req, res)` from `api/utils/auth.ts` to verify these.

---

## Local Fallback

If the backend or database is down:
- `isLocal: true` is set on the auth object
- A UUID is generated locally and stored
- The app continues to work (generation, quota display, etc.)
- When the backend recovers, call `resetAuthIfLocal()` to get a real auth on next launch

```js
// In auth.js
export async function resetAuthIfLocal() {
  const stored = await readStored();
  if (stored?.isLocal) {
    await FileSystem.deleteAsync(AUTH_FILE, { idempotent: true });
  }
}
```

---

## Environment Variables Required

```bash
JWT_SECRET=your-long-random-secret-key
DATABASE_URL=your-supabase-connection-string
```

---

## Limitations (Known)

- The current system uses **anonymous user IDs** — there is no email/password login
- Users cannot sign in across devices (a reinstall gets a new user ID)
- Full user accounts (email/password, cross-device sync) are planned for a future version using Supabase Auth or Clerk

---

## Security Notes

- JWT tokens are signed with `JWT_SECRET` using HS256
- Tokens do not expire currently (add expiry in future)
- Tokens are stored on device filesystem, not AsyncStorage (slightly more secure)
- All API endpoints validate the token using `requireAuth()`

---

**Last Updated**: May 2026
**See also**: `SECURITY.md`, `api/auth/token.ts`, `apps/mobile/services/auth.js`
