# FunnyFy — backlog

**Last updated:** 18 Sep 2026

Action items only. Completed work is listed at the bottom.

---

## Production Vercel env (`funnyfyapp`)

| Variable | Status | Notes |
|----------|--------|--------|
| `CRON_SECRET` | ✅ Done | Also set on cron-job.org as `Authorization: Bearer …` |
| `JWT_SECRET` | ✅ Done | Different from staging / CRON |
| `ALLOWED_ORIGIN` | ✅ Done | `https://funnyfyapp.vercel.app` |
| `PUBLIC_API_URL` | ✅ Done | `https://funnyfyapp.vercel.app` |
| `TARGET_API_URL` | ✅ Done | `https://api.replicate.com/v1/predictions` |
| `TARGET_API_KEY` | ✅ Done | Replicate API token (`r8_…`) |
| `REPLICATE_WEBHOOK_SECRET` | ✅ Done | Webhook `?token=` |
| `REVENUECAT_WEBHOOK_SECRET` | ✅ Done | Prod webhook URL + secret |
| `SIGHTENGINE_API_USER` | ✅ Done | Same as staging |
| `SIGHTENGINE_API_SECRET` | ✅ Done | Same as staging |
| `DATABASE_URL` | ✅ Done | Prod Supabase pooler |
| `ADMIN_USER_IDS` | ✅ Done | Prod `users.id` set + redeployed |

**Prod Supabase:** schema loaded (`migrations-master` + follow-ups). Org/project created.

**Blocked / next:**
- [x] Set `SIGHTENGINE_API_USER` + `SIGHTENGINE_API_SECRET` on **funnyfyapp** (same as staging)
- [x] Set `DATABASE_URL` on Vercel **funnyfyapp** (Transaction pooler)
- [x] Smoke: `GET /api/health` → `{"ok":true}` (26 Aug 2026)
- [x] Smoke: `GET /api/db-test` → `{"ok":true,"now":"..."}` (26 Aug 2026)
- [x] **Rotate `CRON_SECRET`** — Vercel + cron-job.org + redeploy (26 Aug 2026)
- [x] Create or obtain a prod user → set `ADMIN_USER_IDS` (26 Aug 2026)
- [x] Redeploy after `ADMIN_USER_IDS`
- [x] Admin login works at `https://funnyfyapp.vercel.app/admin/login` (26 Aug 2026)

---

## Do next (Play Store prep)

| # | Task | How |
|---|------|-----|
| 1 | Finish prod env vars | ✅ Done (smoke + admin login 26 Aug 2026) |
| 2 | **Deploy API to staging** | Push/deploy Vercel staging — cron scoping, admin fail-closed, queue kick rate limit |
| 3 | **Rebuild mobile APK** | `npx expo prebuild --platform android` then `.\build-apk-local.ps1` — `expo-secure-store` is native |
| 4 | **Generate release keystore** | [MD/RELEASE_SIGNING.md](../MD/RELEASE_SIGNING.md) — run `apps/mobile/scripts/generate-release-keystore.ps1` once; back up `.jks` |
| 5 | **GitHub branch protection** | [GITHUB_BRANCH_PROTECTION.md](./GITHUB_BRANCH_PROTECTION.md) — ~2 min in repo Settings → Branches |
| 6 | **Production admin** | ✅ Done — `admin_users` seeded; `/admin/login` |

---

## Product backlog

| Task | Doc |
|------|-----|
| Closed testing free gens | [CLOSED_TESTING_QUOTA.md](./CLOSED_TESTING_QUOTA.md) |
| Remaining comparison before/after assets | [COMPARISON_ASSETS.md](./COMPARISON_ASSETS.md) |

**Comparison assets still open:**
- [ ] Pairs for enabled styles that lack curated assets
- [ ] Upload hero pairs at 832×1248 (no crossfade jump)
- [ ] `coloured_pencil` asset + enable style

---

## Optional (post-launch)

| Task | Notes |
|------|--------|
| API Sentry | [MD/SENTRY_INTEGRATION.md](../MD/SENTRY_INTEGRATION.md) |
| Supabase RLS | Defense in depth; API uses service role today |
| Redis rate limits | Only if Postgres limits become slow |
| CORS per environment | Staging vs prod |
| Remove `X-User-Id` dev bypass | Must not work in production |
| Android network pinning | Release hardening |
| Proguard/R8 | Test RevenueCat after enabling |
| Replicate circuit breaker | Pause enqueue after provider failures |

---

## Housekeeping

- [ ] **`npm audit`** — review before `audit fix --force` on Expo 52
- [ ] **Supabase restore drill** — confirm backup cadence in [MD/DISASTER_RECOVERY.md](../MD/DISASTER_RECOVERY.md)
- [ ] **Deploy API after each backend change** — smoke `/api/health` + one generate

---

## Completed (recent)

| Item | Notes |
|------|--------|
| App version gating + update banner | Built; set `LATEST_APP_VERSION` per Play release |
| Admin dashboard (`admin_users`) | Staging + prod |
| Play ↔ RC products, RTDN, CANCELING path | Internal testing |
| Hard paywall (no trial) | App + API |
