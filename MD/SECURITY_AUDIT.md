# Security Audit — FunnyFy App

**Date:** 2026-06-22
**Scope:** Full repository (React Native/Expo mobile app + Node.js/Vercel serverless backend)
**Method:** Read-only static review. No code was modified as part of this audit.

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | 1 |
| 🟠 High | 7 |
| 🟡 Medium | 6 |

Note: an earlier pass of this audit flagged hardcoded secrets in `.env.local` and `apps/mobile/.env` as critical/high. This was verified and **downgraded** — both files are matched by `.gitignore` (`.env*` rule, line 33) and `git log --all` confirms neither was ever committed to repo history. Risk is limited to local-machine/manual-sharing exposure, not repo/clone exposure. Rotating these secrets out of caution is still reasonable if the file was ever shared outside the local machine (chat, email, synced cloud folder, screen share).

---

## 🔴 Critical

### 1. SSL certificate verification disabled on database connection
- **File:** [api/_utils/db.ts:29](../api/_utils/db.ts#L29)
- **Issue:** `ssl: { rejectUnauthorized: false }` disables certificate validation, allowing man-in-the-middle attacks against the Postgres connection.
- **Impact:** Credentials and all data in transit can be intercepted on a compromised/untrusted network path.
- **Recommendation:** Set `rejectUnauthorized: true` and supply the correct CA chain if the managed Postgres provider requires one.

---

## 🟠 High

### 2. Admin login has no rate limiting and weak role check
- **File:** [api/admin/index.ts:43-85](../api/admin/index.ts#L43)
- **Issue:** No throttling on `/api/admin?resource=login` attempts. Admin check (`api/admin/index.ts:68`) is `ADMIN_USER_IDS.includes(userId)` — if `ADMIN_USER_IDS` is empty or misconfigured, behavior is unsafe.
- **Recommendation:** Add rate limiting (e.g. 5 attempts/IP/min), log all admin login attempts, and fail closed (deny) when `ADMIN_USER_IDS` is empty rather than relying on absence-of-check.

### 3. Unauthenticated diagnostic endpoint
- **File:** [api/db-test.ts:12-65](../api/db-test.ts#L12)
- **Issue:** `/api/db-test` returns DB connection status and query examples with no auth check.
- **Recommendation:** Require JWT auth, or remove the route entirely from production builds.

### 4. Cron queue endpoint accepts any user JWT, not just the cron secret
- **File:** [api/cron/process-queue.ts:27-37](../api/cron/process-queue.ts#L27)
- **Issue:** `isCron || isUser` — any authenticated user can trigger queue processing outside the schedule, bypassing intended rate limiting.
- **Recommendation:** Restrict this endpoint to `CRON_SECRET` only; remove the user-JWT fallback.

### 5. Auth tokens stored in plaintext on device
- **File:** [apps/mobile/services/auth.js:20-25, 68-69](../apps/mobile/services/auth.js#L20)
- **Issue:** JWT persisted via `expo-file-system` (`FileSystem.writeAsStringAsync`), unencrypted at rest.
- **Recommendation:** Migrate to `expo-secure-store` (uses Keychain on iOS, Keystore-backed EncryptedSharedPreferences on Android).

### 6. Release APK signed with the debug keystore
- **File:** [apps/mobile/android/app/build.gradle:95-115](../apps/mobile/android/app/build.gradle#L95)
- **Issue:** `release { signingConfig signingConfigs.debug }` — production builds use the well-known debug keystore (`android`/`android` password).
- **Impact:** Anyone with the debug keystore (it's the same on every Android dev machine) can sign an APK that impersonates FunnyFy.
- **Recommendation:** Generate a dedicated release keystore, store it outside git (CI secret / EAS credentials), and point `release` signing config at it.

### 7. `android:allowBackup="true"` in manifest
- **File:** [apps/mobile/android/app/src/main/AndroidManifest.xml:18](../apps/mobile/android/app/src/main/AndroidManifest.xml#L18)
- **Issue:** App data (including cached tokens) can be included in Android Auto Backup / `adb backup`.
- **Recommendation:** Set `android:allowBackup="false"`, or scope an explicit `dataExtractionRules`/`fullBackupContent` XML that excludes auth/session data.

### 8. Sensitive data in production console logs
- **Files:** [apps/mobile/App.js:162, 194-196, 282](../apps/mobile/App.js#L162)
- **Issue:** `console.log` statements print user IDs, auth debug state, and subscription sync results.
- **Recommendation:** Strip or gate these behind a `__DEV__`/debug flag before release builds; avoid logging identifiers or auth state unconditionally.

---

## 🟡 Medium

### 9. Template-literal LIMIT/OFFSET in admin SQL queries
- **File:** [api/admin/index.ts:257, 307](../api/admin/index.ts#L257)
- **Issue:** `LIMIT ${limit} OFFSET ${offset}` interpolated directly rather than parameterized. Currently safe because values are `Number()`-cast first, but it's a fragile pattern.
- **Recommendation:** Pass `limit`/`offset` as bound parameters (`$N`) consistent with the rest of the query.

### 10. Permissive CORS in staging
- **File:** `apps/mobile/.env.local` — `ALLOWED_ORIGIN="*"`
- **Recommendation:** Scope to the specific staging origin even in non-prod environments.

### 11. Development auth bypass fallbacks
- **File:** [api/_utils/security.ts:118-135](../api/_utils/security.ts#L118)
- **Issue:** Non-production builds accept `X-User-Id` header, or `userId` in body/query, as alternatives to a verified JWT.
- **Recommendation:** Gate this hard on a build-time flag that cannot be flipped by an environment variable typo in production; consider removing entirely and using a seeded test JWT instead.

### 12. No Android network security config
- **Expected location:** `apps/mobile/android/app/src/main/res/xml/network_security_config.xml` (missing)
- **Recommendation:** Add a config pinning allowed API domains and explicitly disabling cleartext traffic, referenced via `android:networkSecurityConfig` in the manifest.

### 13. Proguard/minification disabled in release build
- **File:** [apps/mobile/android/app/build.gradle:112](../apps/mobile/android/app/build.gradle#L112)
- **Issue:** `enableProguardInReleaseBuilds` defaults to `false`, leaving release APK bytecode easily decompiled.
- **Recommendation:** Enable Proguard/R8 for release builds and maintain a `proguard-rules.pro` covering RN/Expo requirements.

### 14. Dependency audit not run
- **File:** `apps/mobile/package.json`, root `package.json`
- **Recommendation:** Run `npm audit` (and `npm audit fix` where safe) before each release; consider Dependabot/Renovate for ongoing tracking.

---

## Immediate Action Checklist

- [ ] Set `rejectUnauthorized: true` in [api/_utils/db.ts](../api/_utils/db.ts) — **done** (default true; set `DATABASE_SSL_REJECT_UNAUTHORIZED=false` to roll back)
- [x] Add rate limiting + security logging on admin login in [api/admin/index.ts](../api/admin/index.ts)
- [x] Auth-gate [api/db-test.ts](../api/db-test.ts) with `CRON_SECRET`
- [ ] Restrict [api/cron/process-queue.ts](../api/cron/process-queue.ts) to scoped user kick + `CRON_SECRET` (see [ToDo/06-security-audit-followups.md](../ToDo/06-security-audit-followups.md))
- [ ] Migrate mobile token storage to `expo-secure-store`
- [ ] Generate and wire up a production release keystore
- [x] Set `android:allowBackup="false"` (via `app.config.js`; rebuild APK)
- [x] Strip sensitive `console.log` calls from [apps/mobile/App.js](../apps/mobile/App.js) (`__DEV__` gating)
- [x] Parameterize LIMIT/OFFSET in admin queries
- [ ] Add `network_security_config.xml`
- [ ] Enable Proguard/R8 for release builds
- [ ] Run `npm audit`
- [ ] (Precautionary) Rotate `.env.local` / `apps/mobile/.env` secrets if the files were ever shared outside this machine

**Deferred detail:** [ToDo/06-security-audit-followups.md](../ToDo/06-security-audit-followups.md) · [todo/security-deferred.md](../todo/security-deferred.md)

---

## Infrastructure Audit — by Category

A second pass organized by infra category, covering areas not fully broken out above. Items already marked done/deferred in the checklist are referenced rather than repeated.

### 1. APIs & Backend Logic
- Zod-validated inputs (`api/_utils/validation.ts`), parameterized queries, security headers via `api/_utils/security.ts`. Webhook idempotency exists ([api/webhooks/revenuecat.ts:190-217](../api/webhooks/revenuecat.ts#L190)) but falls back to `${eventType}_${Date.now()}` when `eventId` is absent — not collision-proof at sub-second event rates. **Medium.** *Recommendation:* derive fallback key from `eventType + subscription_id` instead of a timestamp.
- LIMIT/OFFSET interpolation — already fixed (see checklist item 9/#12 above).

### 2. Database & Storage
- Postgres via Supabase, pooled connection (`api/_utils/db.ts:27-33`), `max: 10`. Schema in `api/migrations-master.sql` with indexes and FKs (`ON DELETE CASCADE/SET NULL`).
- **No backup/restore runbook in-repo.** Supabase manages backups, but there's no documented RTO/RPO or restore drill. **Medium.** *Recommendation:* add a short `MD/DISASTER_RECOVERY.md` stating backup cadence and restore steps.
- `rate_limits` table rows are never purged — unbounded growth. **Low.** *Recommendation:* scheduled `DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 hours'`.
- SSL verification disabled — already tracked as Critical #1 above.

### 3. Auth & Permissions
- See High #2 (admin fail-open), #5 (plaintext JWT), Medium #11 (dev auth bypass) above.
- **Additional gap:** no token revocation/refresh — a stolen 30-day JWT stays valid until expiry with no logout-side invalidation. **Low.** *Recommendation:* add a server-side token blocklist or short-lived JWT + refresh token pair.

### 4. Hosting & Deployment
- Vercel, branch-based deploys (`Staging` / `main`/production). `vercel.json` sets per-function timeouts (10–60s) but has no env-specific config split (CORS, rate limits are env vars, which is fine, but undocumented).
- **No documented rollback procedure.** **Medium.** *Recommendation:* document `git revert` + push as the rollback path, or use Vercel's "Promote previous deployment."
- Debug-keystore release signing — already tracked as High #6 above.

### 5. Cloud & Compute
- Job queue (`api/cron/process-queue.ts`) driven by an external cron-job.org trigger calling the endpoint with `CRON_SECRET`, not Vercel's native Cron. **Medium** — vendor lock-in / single point of failure outside Vercel's SLA. *Recommendation:* migrate to Vercel Cron if plan allows, or document the external dependency explicitly.
- No circuit breaker around the Replicate API — if Replicate is degraded, jobs keep getting submitted and failing rather than pausing. **Medium.** *Recommendation:* track consecutive failures and pause submission past a threshold.
- Cost-protection cap exists (`api/_utils/cost-protection.ts`) — good control already in place.

### 6. CI/CD & Version Control
- **No `.github/workflows` — no automated tests, type-checking, lint, or `npm audit` on push/PR.** **High.** *Recommendation:* add a minimal CI workflow running `tsc --noEmit` and `npm audit` at minimum.
- **No branch protection confirmed** on `main`/production — can't be verified from the repo alone; check in GitHub settings. **High** (assume unprotected until confirmed). *Recommendation:* require PR review + passing CI before merge to `main`.
- `.gitignore` correctly catches all `.env*` variants (verified earlier in this doc).

### 7. Security & RLS
- **No Supabase Row-Level Security policies anywhere in `api/migrations-master.sql`.** All authorization is enforced at the API layer (JWT + explicit `WHERE user_id = $1` clauses), which is workable since clients never talk to Supabase directly — but it means a leaked Supabase service key or direct DB access bypasses every app-level check. **Medium.** *Recommendation:* add baseline RLS policies (e.g., `users`, `jobs`, `usage_tracking` scoped to `auth.uid()`) as defense-in-depth, even though the app's own service-role connection would still need a bypass policy.
- NSFW moderation thresholds are hardcoded constants in `api/_utils/process-job.ts` rather than env-configurable. **Low.**

### 8. Rate Limiting
- Implemented in `api/_utils/ratelimit.ts`: per-IP burst (60/min default), per-tier burst, daily cap, admin-login throttle — backed by a **Postgres table**, not Redis/in-memory. **Medium** — adds DB round-trip latency to every request and won't survive well under high concurrency.
- **Fails open on DB error** (`api/_utils/ratelimit.ts:92-96, 137-139`) — if the rate-limit check itself errors, requests are allowed through. **Medium**, intentional-availability trade-off but should be a documented decision, not an implicit one. *Recommendation:* keep fail-open for now given serverless constraints, but log a security event every time it triggers so silent fail-open isn't invisible.

### 9. Caching & CDN
- Static assets served via Vercel's default CDN; no custom cache headers on API responses (appropriate — API data shouldn't be cached). **Not implemented / not needed.**
- *Recommendation:* explicitly set `Cache-Control: no-store` on `/api/auth/*` and `/api/admin/*` for clarity, though absence of caching is already the safe default.

### 10. Load Balancing & Scaling
- Vercel auto-scales functions, but the shared Postgres pool is capped at `max: 10` ([api/_utils/db.ts:30](../api/_utils/db.ts#L30)) while serverless concurrency can spike well past that. **High.** This is the classic serverless + traditional-pool pitfall — many concurrent function instances each holding/competing for a small fixed pool causes `ECONNREFUSED`/connection-exhaustion under load, even though Supabase's pgBouncer pooler (port 6543, transaction mode) is already correctly in use ([api/_utils/db.ts:35-39](../api/_utils/db.ts#L35)).
  *Recommendation:* raise `max` to align with expected concurrent function count and confirm Supabase's pooler connection limit supports it; consider Supabase's "Supavisor" session vs transaction mode tradeoffs for this workload.
- Queue worker processes jobs one at a time per cron tick despite `MAX_CONCURRENT_JOBS=10` being configured — throughput-limited. **Medium.** *Recommendation:* batch-process up to the concurrency limit per invocation.

### 11. Error Tracking & Logs
- No Sentry/error-tracking integration found — failures are visible only in Vercel's function logs and the app's own `security_logs` table. **High.** *Recommendation:* integrate Sentry (or similar) for unhandled exceptions and release tracking before wider rollout.
- Logging is unstructured `console.log`/`console.error` calls rather than structured JSON — harder to query/alert on at scale. **Medium.**
- Mobile `console.log` of sensitive data — already tracked as High #8 above (now `__DEV__`-gated per checklist).

### 12. Availability & Recovery
- `recoverStaleProcessingJobs()` ([api/cron/process-queue.ts:42-49](../api/cron/process-queue.ts#L42)) re-syncs jobs stuck in `processing` for 2+ minutes against Replicate — good self-healing, but the 2-minute window may be too aggressive under load and double-recover concurrently. **Low.**
- No public, unauthenticated `/api/health` endpoint — the only DB health check (`api/db-test.ts`) now requires `CRON_SECRET`, which is correct for security but means there's no lightweight uptime-monitor target. **Medium.** *Recommendation:* add a minimal `/api/health` returning `200 OK` with no DB query (or a cheap `SELECT 1`), safe to expose publicly for uptime monitoring.
- No documented disaster-recovery plan (backup cadence, restore steps, RTO/RPO) — same gap noted under Database & Storage above. **High** in aggregate, given there's currently no written recovery procedure at all.

### Infra Audit — Checklist

- [x] Add `.github/workflows` CI (type-check + `npm audit` minimum) — confirm branch protection on `main` in GitHub Settings
- [x] Add public `/api/health` endpoint for uptime monitoring
- [x] Write disaster-recovery doc — `MD/DISASTER_RECOVERY.md`
- [x] Postgres pool `max: 1` per serverless instance (`DATABASE_POOL_MAX` override); SSL verify on (`DATABASE_SSL_REJECT_UNAUTHORIZED=false` escape hatch)
- [ ] Add baseline Supabase RLS policies as defense-in-depth
- [ ] Integrate Sentry — see `To do/SENTRY_INTEGRATION.md` + `todo/security-deferred.md`
- [x] Scheduled cleanup of stale `rate_limits` rows (cron worker)
- [ ] Add a circuit breaker around Replicate API failures
- [x] Webhook idempotency fallback uses `crypto.randomUUID()` (not `Date.now()`)
- [x] Rate-limit fail-open logged to `security_logs` (`rate_limit_fail_open`)

**Deferred:** [todo/security-deferred.md](../todo/security-deferred.md)

---

*This document is diagnostic only. No source files were modified during this audit.*
