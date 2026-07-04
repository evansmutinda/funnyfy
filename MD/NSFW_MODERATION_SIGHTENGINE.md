# Content Moderation (Sightengine + Replicate)

**Last Updated**: July 2026

---

## Overview

Uploaded images are screened for policy violations **before** Replicate generation (Sightengine). Replicate model rejections (e.g. E005 sensitive content) are mapped to the same user-facing flow.

Runs in the async job worker (`api/_utils/process-job.ts`).

---

## Flow

1. User uploads image → `POST /api/enqueue`
2. Queue worker runs `api/_utils/process-job.ts`
3. Image validated at enqueue time (MIME, size, magic bytes) — see `SECURITY.md`
4. **Sightengine** multi-model check on base64 image data
5. If blocked: job fails with `CONTENT_NOT_ALLOWED`; infringement recorded; user sees content-policy dialog in app
6. If passed: Replicate generation proceeds
7. If Replicate rejects for sensitive/content policy (E005): same block + infringement path

---

## Sightengine Models

Single API call with:

```
nudity-2.1,gore-2.0,weapon,violence,offensive-2.0,self-harm
```

| Category | What is blocked |
|----------|-----------------|
| **Nudity** | Sexual activity, sexual display, erotica (except normal bikini/swimwear), very suggestive (except swimwear), sex toys |
| **Gore / death** | Blood, corpses, skulls, serious injury, organs |
| **Weapons** | Firearms (excluding toy guns), knives |
| **Violence** | Physical violence, firearm threats (combat sports allowed) |
| **Hate / offensive** | Nazi, terrorist, confederate, supremacist, swastika imagery |
| **Self-harm** | Self-injury indicators |

Implementation: `api/_utils/sightengine-moderation.ts`

**Age / minors:** We do **not** use Sightengine `face-age` (no blanket block on photos of children). Nudity, violence, weapons, gore, hate, and self-harm rules apply to **all** uploads regardless of who is in the photo. Replicate may still reject some edge cases (E005).

**Bikinis / swimwear:** Bikinis, one-piece swimwear, and male swimwear are **allowed** when Sightengine classifies them as the dominant suggestive signal. Explicit nudity (`sexual_activity`, `sexual_display`) and lingerie/underwear still block. A bikini photo with actual explicit content still fails.

---

## Thresholds

Default score threshold: **0.3** (0–1 confidence from Sightengine).

| Env var | Default | Effect |
|---------|---------|--------|
| `MODERATION_NUDITY_THRESHOLD` | `0.3` | sexual_activity, sexual_display, erotica, sextoy |
| `MODERATION_VERY_SUGGESTIVE_THRESHOLD` | `0.5` | very_suggestive (allows normal swimwear in many cases) |
| `MODERATION_GORE_THRESHOLD` | `0.3` | gore / death imagery |
| `MODERATION_WEAPON_THRESHOLD` | `0.3` | firearms, knives |
| `MODERATION_VIOLENCE_THRESHOLD` | `0.3` | physical_violence, firearm_threat |
| `MODERATION_OFFENSIVE_THRESHOLD` | `0.3` | hate / offensive symbols |
| `MODERATION_SELF_HARM_THRESHOLD` | `0.3` | self-harm |
| `INFRINGEMENT_BAN_THRESHOLD` | `3` | Set `users.banned_at` after N violations |

---

## Environment Variables

```bash
SIGHTENGINE_API_USER=your_user
SIGHTENGINE_API_SECRET=your_secret
```

If Sightengine credentials are missing, the check is skipped. If the Sightengine API call fails, the worker **fail-opens** (proceeds to Replicate) and logs a warning.

---

## Database

Violations recorded in `infringements` table (`infringement_type`: `nsfw`). Details JSON includes violation category and scores. Banned users get 403 on enqueue.

---

## User Experience

- **While generating:** Result overlay shows **Checking content guidelines…** during moderation.
- **On block:** Friendly dialog — **This photo can't be used**; acknowledges false alarms; account-limit note only after repeat flags. Violations logged in server `infringements`, locally on device, and as Sentry info events (not crashes).
- Replicate E005 / sensitive rejections show the same dialog (not a generic generation error).
- No retry limit on content-policy errors (user can pick a different photo).

**Mobile helpers:** `apps/mobile/utils/contentErrors.js`, `apps/mobile/utils/jobProgress.js`

---

**See also**: `SECURITY.md`, `api/_utils/sightengine-moderation.ts`, `api/_utils/process-job.ts`, `api/enqueue.ts`
