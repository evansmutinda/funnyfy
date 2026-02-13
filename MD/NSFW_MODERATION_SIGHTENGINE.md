# NSFW Content Moderation – Sightengine

**Status**: Implemented  
**Provider**: [Sightengine](https://sightengine.com/)  
**Decision**: Feb 2025

---

## Overview

Sightengine blocks NSFW content before images are sent to Replicate. Moderation runs server-side in `api/test.ts`, before the generation request.

---

## Implementation

### 1. Vercel Environment Variables
- `SIGHTENGINE_API_USER` – API User from Sightengine dashboard
- `SIGHTENGINE_API_SECRET` – API Secret from Sightengine dashboard

### 2. API Flow (api/test.ts)
1. Receive image (data URL / base64)
2. Call Sightengine Image Moderation API (nudity model)
3. If `nudity.raw >= 0.3` → return 400, user-friendly message
4. If pass → proceed to Replicate
5. If Sightengine fails (network, etc.) → fail open (proceed, log error)

### 3. Response Handling
- **Block**: `nudity.raw >= 0.3` (explicit content)
- **Allow**: `nudity.raw < 0.3` or Sightengine error (availability)

### 4. User Message
When content is rejected:
> "This image cannot be processed. Please use an appropriate photo."

### 5. Adjusting Sensitivity
Edit `NSFW_RAW_THRESHOLD` in `api/test.ts` (default: 0.3). Lower = stricter, higher = more permissive.

### 6. Infringement Tracking & Bans
- Each blocked image creates an `infringements` record.
- When a user reaches `INFRINGEMENT_BAN_THRESHOLD` (default: 3), they are banned (`users.banned_at` set).
- Banned users receive 403 with message: "Your account has been suspended due to repeated policy violations."
- **Migration required**: Run `api/migrations-infringements.sql` in Supabase before using.

---

## Docs
- [Sightengine API docs](https://sightengine.com/docs/)
- [Nudity Detection Model](https://sightengine.com/docs/nsfw-detection-model)
