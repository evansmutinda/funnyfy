# Security Audit — Deferred Follow-ups

**Source:** `MD/SECURITY_AUDIT.md` (2026-06-22)  
**Status:** Mostly complete — see [security-deferred.md](./security-deferred.md) for remaining work  
**Priority:** Sentry + launch blockers before Play Store

---

## Already applied

### Security batch (2026-06-22)
- [x] Gate sensitive mobile `console.log` behind `__DEV__` (`App.js`, `auth.js`)
- [x] `android:allowBackup: false` in `app.config.js` (requires `expo prebuild` + APK rebuild)
- [x] Admin login rate limiting (`checkAdminLoginRateLimit`, 10 attempts / IP / 15 min)
- [x] Parameterized `LIMIT` / `OFFSET` in admin user/job list queries
- [x] `/api/db-test` requires `Authorization: Bearer <CRON_SECRET>`

### Infra batch (2026-06-22)
- [x] `GET /api/health` — public liveness probe
- [x] `MD/DISASTER_RECOVERY.md` — RTO/RPO + runbooks
- [x] `.github/workflows/ci.yml` — `npm run typecheck` + `npm audit`
- [x] DB pool `max: 1` (`DATABASE_POOL_MAX`); SSL verify on by default
- [x] Rate-limit fail-open → `security_logs` (`rate_limit_fail_open`)
- [x] Webhook idempotency fallback → `crypto.randomUUID()`
- [x] Purge stale `rate_limits` rows on cron tick

**Health checks:**
```bash
curl https://funnyfy-staging.vercel.app/api/health
curl -H "Authorization: Bearer $CRON_SECRET" https://funnyfy-staging.vercel.app/api/db-test
```

---

## Still deferred

See **[security-deferred.md](./security-deferred.md)** — Sentry (guided setup next), RLS, Redis rate limits, secure-store, release keystore, cron hardening, branch protection, etc.

**Short checklist:** [security-deferred.md](./security-deferred.md)
