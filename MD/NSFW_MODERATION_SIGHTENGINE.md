# NSFW Moderation (Sightengine)

**Last Updated**: June 2026

---

## Overview

Sightengine screens uploaded images for explicit content **before** Replicate generation. This runs in the async job worker.

---

## Flow

1. User uploads image → `POST /api/enqueue`
2. Queue worker runs `api/process-job.ts` (or `api/_utils/process-job.ts`)
3. Image validated at enqueue time (MIME, size, magic bytes) — see `SECURITY.md`
4. **Sightengine** nudity check on the image URL/data
5. If blocked: job fails with `CONTENT_NOT_ALLOWED`; user sees NSFW modal in app
6. If passed: Replicate generation proceeds

---

## Thresholds

```typescript
const NSFW_RAW_THRESHOLD = 0.3;        // in api/process-job.ts
const INFRINGEMENT_BAN_THRESHOLD = 3;  // violations → user banned
```

| Setting | Default | Effect |
|---------|---------|--------|
| `NSFW_RAW_THRESHOLD` | `0.3` | Block if `nudity.raw >= 0.3` |
| `INFRINGEMENT_BAN_THRESHOLD` | `3` | Set `users.banned_at` after 3 violations |

---

## Environment Variables

```bash
SIGHTENGINE_API_USER=your_user
SIGHTENGINE_API_SECRET=your_secret
```

---

## Database

Violations recorded in `infringements` table. Banned users get 403 on enqueue.

---

## Adjusting Sensitivity

Edit `NSFW_RAW_THRESHOLD` in `api/process-job.ts` (lower = stricter).

---

## User Experience

- **While generating:** Result overlay shows four steps — submit, queue, **Checking content guidelines…** (moderation), then **Creating your {style}** / generating. If moderation fails, the infringement dialog appears; otherwise flow continues to Replicate.
- **On block:** Dark dialog — title **Content not permitted**; message notes the upload was recorded and further violations may suspend the account; single **Understood** pill returns to upload (photo cleared).
- No retry limit on NSFW errors (user can pick a different photo).
- Not the same as generation failure retries (3× for Replicate errors).

**Mobile helpers:** `apps/mobile/utils/contentErrors.js`, `apps/mobile/utils/jobProgress.js`

---

**See also**: `SECURITY.md`, `api/process-job.ts`, `api/enqueue.ts`
