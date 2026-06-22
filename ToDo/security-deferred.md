# FunnyFy — deferred work

**Last updated:** June 2026  
**Done recently:** see `ToDo/06-security-audit-followups.md` and `MD/CHANGELOG.md`

---

## Error tracking — Sentry

- [x] **Mobile Sentry** — org `funnyfy`, project `react-native`; see `To do/SENTRY_INTEGRATION.md`
- [ ] **API Sentry** (optional) — `@sentry/node` on Vercel for server-side errors

---

## Security — launch blockers

- [ ] **Production release keystore** — replace debug signing for `release` APK builds
- [ ] **JWT → `expo-secure-store`** — migrate `apps/mobile/services/auth.js`
- [ ] **Cron queue hardening** — per-user rate limit + scope JWT kick to caller’s pending job
- [ ] **Admin fail-closed** — deny login when `ADMIN_USER_IDS` empty (after IDs set on staging + prod)
- [ ] **GitHub branch protection** — require PR + passing CI on `main` (manual in GitHub Settings)

---

## Security — defense in depth (post-launch OK)

- [ ] **Supabase RLS** — baseline policies on `users`, `jobs`, `usage_tracking` (API uses service role today)
- [ ] **Redis / Upstash rate limits** — if Postgres-backed limits become a bottleneck
- [ ] **CORS** — `ALLOWED_ORIGIN` per environment (staging vs prod)
- [ ] **Remove dev auth bypass** — `X-User-Id` in `api/_utils/security.ts` (local `vercel dev` only)
- [ ] **Android network security config** — pin API hosts in release APK
- [ ] **Proguard/R8** — enable for release; smoke-test RevenueCat + Expo
- [ ] **Replicate circuit breaker** — pause enqueue after consecutive provider failures
- [ ] **Rotate local secrets** — if `.env` files were shared outside this machine

---

## Dependencies & audit

- [ ] **`npm audit` fixes** — review before `audit fix --force` on Expo 52 (may jump major SDK)
- [ ] **Supabase restore drill** — fill backup cadence in `MD/DISASTER_RECOVERY.md`

---

## Mobile / ops

- [ ] **Rebuild APK** after `allowBackup: false` (`expo prebuild` + `build-apk-local.ps1`)
- [ ] **Deploy API** to staging after each backend change; smoke `/api/health` + generate flow

---

## Applied (June 2026) — do not re-do

- [x] `GET /api/health` — public liveness probe
- [x] `MD/DISASTER_RECOVERY.md` — RTO/RPO + runbooks
- [x] `.github/workflows/ci.yml` — `tsc` + `npm audit` on push/PR
- [x] DB pool `max: 1` (override `DATABASE_POOL_MAX`); SSL `rejectUnauthorized: true` (escape hatch `DATABASE_SSL_REJECT_UNAUTHORIZED=false`)
- [x] Rate-limit fail-open → `security_logs` event `rate_limit_fail_open`
- [x] Webhook idempotency fallback → `crypto.randomUUID()` (not `Date.now()`)
- [x] Stale `rate_limits` purge on cron tick
- [x] Mobile Sentry (`@sentry/react-native`, staging environment)

---

## Suggested order

1. Deploy + verify staging (`/api/health`, generate, admin)  
2. Secure-store + production keystore  
3. Cron scoping + admin fail-closed  
4. Optional API Sentry + RLS, Redis, CORS, Proguard as needed
