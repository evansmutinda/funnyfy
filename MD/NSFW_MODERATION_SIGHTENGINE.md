# NSFW Content Moderation – Sightengine

**Status**: Implemented & Active
**Provider**: [Sightengine](https://sightengine.com/)
**Decision**: February 2026

---

## Overview

Sightengine screens uploaded images for explicit content **before** they are sent to Replicate for caricature generation. This runs server-side in `api/test.ts`.

---

## Full Flow

1. User uploads image in the app
2. App sends image (base64) to `/api/test`
3. `api/test.ts` validates image (MIME type, size, magic bytes) — see SECURITY.md
4. `api/test.ts` calls Sightengine nudity detection API
5. If `nudity.raw >= 0.3` → return 400, show user-friendly message, log infringement
6. If clean → proceed to Replicate
7. If Sightengine is unavailable → fail open (proceed, log warning)

---

## Implementation Details

### Environment Variables (Vercel)
```
SIGHTENGINE_API_USER=your-api-user
SIGHTENGINE_API_SECRET=your-api-secret
```

### Threshold
```ts
const NSFW_RAW_THRESHOLD = 0.3; // in api/test.ts
// Lower = stricter, Higher = more permissive
```

### User-Facing Message (when blocked)
> "This image cannot be processed. Please use an appropriate photo."

Displayed as a Toast notification in the app (not a system Alert).

---

## Infringement Tracking & Bans

Each blocked image creates a record in the `infringements` Supabase table.

```sql
-- infringements table columns:
id, user_id, infringement_type ('nsfw'), details (JSONB nudity scores), created_at
```

When a user reaches **3 violations** (`INFRINGEMENT_BAN_THRESHOLD`):
- `users.banned_at` is set to current timestamp
- All subsequent requests return **403**:
  > "Your account has been suspended due to repeated policy violations."

**Migration required**: Run `api/migrations-infringements.sql` in Supabase SQL editor before using this feature.

---

## Adjusting Sensitivity

Edit `NSFW_RAW_THRESHOLD` in `api/test.ts`:

| Value | Effect |
|-------|--------|
| 0.1 | Very strict — blocks borderline content |
| 0.3 | Default — blocks explicit nudity |
| 0.5 | Permissive — only blocks very explicit content |

---

## Changing Ban Threshold

Edit `INFRINGEMENT_BAN_THRESHOLD` in `api/test.ts`:

```ts
const INFRINGEMENT_BAN_THRESHOLD = 3; // ban after 3 violations
```

---

## Docs
- [Sightengine API docs](https://sightengine.com/docs/)
- [Nudity Detection Model](https://sightengine.com/docs/nsfw-detection-model)

---

**Last Updated**: May 2026
**See also**: `SECURITY.md`, `DATABASE_SCHEMA.md` (infringements table)
