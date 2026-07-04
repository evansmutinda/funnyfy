# Disaster recovery & operations

**Last updated:** June 2026  
**Scope:** FunnyFy API (Vercel) + Supabase Postgres + mobile app (Expo)

---

## Targets (initial)

| Metric | Target | Notes |
|--------|--------|--------|
| **RTO** (time to restore service) | 4 hours | Redeploy API + verify DB; longer if full DB restore needed |
| **RPO** (max data loss) | 24 hours | Supabase Free: daily backups; Pro: PITR — confirm your plan |

Adjust after you confirm Supabase backup settings in the dashboard.

---

## What runs where

| Component | Provider | Recovery lever |
|-----------|----------|----------------|
| API / admin static HTML | Vercel | Redeploy or **Promote** previous deployment |
| Postgres | Supabase | Dashboard backup / restore / PITR |
| Job queue worker | cron-job.org → `/api/cron/process-queue` | Re-enable cron; check `CRON_SECRET` |
| AI generation | Replicate | No local queue persistence beyond `jobs` table |
| Subscriptions | RevenueCat + webhooks | RevenueCat is source of truth; replay webhooks if needed |
| Secrets | Vercel env vars | Password manager + `scripts/generate-secrets.js` |

---

## Health checks

| Endpoint | Auth | Use |
|----------|------|-----|
| `GET /api/health` | None | Uptime monitors (liveness only) |
| `GET /api/db-test` | `Authorization: Bearer <CRON_SECRET>` | Deep DB connectivity |

```bash
# Liveness (public)
curl https://funnyfy-staging.vercel.app/api/health

# Database (ops only)
curl -H "Authorization: Bearer $CRON_SECRET" https://funnyfy-staging.vercel.app/api/db-test
```

---

## Incident playbooks

### 1. API broken after deploy

1. Vercel → Project → **Deployments** → find last green deployment → **Promote to Production** (or redeploy staging branch).
2. Verify: `curl …/api/health` returns `{"ok":true}`.
3. Smoke: `POST /api/auth/token`, one test enqueue on staging app.
4. Root-cause from Vercel function logs; fix forward on branch, PR with CI green.

### 2. Database unreachable

1. Supabase dashboard → **Database** → connection status / pause (free tier sleeps).
2. Confirm `DATABASE_URL` uses **pooler** (port **6543**, transaction mode) in Vercel env.
3. If SSL errors after hardening: temporary rollback env `DATABASE_SSL_REJECT_UNAUTHORIZED=false`, redeploy, then fix CA per Supabase docs.
4. If data corruption suspected → restore from Supabase backup (see below).

### 3. Leaked `DATABASE_URL` or `JWT_SECRET`

1. **Rotate immediately** in Supabase (reset DB password) and Vercel env.
2. Redeploy all environments.
3. Users keep old JWTs until expiry (30d) — consider shortening JWT TTL in a future release or forced re-auth.
4. Review `security_logs` for abuse.

### 4. RevenueCat / subscription drift

1. User taps **Refresh** in app (syncs via `/api/sync-subscription`).
2. Check RevenueCat dashboard for customer state.
3. Replay or fix webhook delivery; verify `REVENUECAT_WEBHOOK_SECRET` matches dashboard.

### 5. Queue stuck (jobs pending forever)

1. Confirm cron-job.org job is **enabled** and URL + `CRON_SECRET` header correct.
2. Manually kick: `curl -X GET -H "Authorization: Bearer $CRON_SECRET" …/api/cron/process-queue`
3. Check `jobs` table for `processing` rows; stale recovery runs at start of each cron tick.

---

## Supabase backup & restore

1. **Project Settings → Database → Backups** — note schedule and retention for your plan.
2. **Restore:** Supabase UI → restore to new project or point-in-time (Pro PITR).
3. After restore: update `DATABASE_URL` in **all** Vercel environments; redeploy.
4. Run `db-test` with `CRON_SECRET`; verify row counts for `users`, `jobs`.

Document your actual backup cadence here once confirmed:

- [ ] Backup frequency: ___________
- [ ] PITR enabled: yes / no
- [ ] Last restore drill date: ___________

---

## Vercel rollback

```text
Dashboard → Deployments → (previous good build) → ⋮ → Promote to Production
```

Or git:

```bash
git revert <bad-commit>
git push origin main   # or Staging
```

**GitHub:** enable branch protection on `main` — require PR + passing **CI** workflow before merge (Settings → Branches → Add rule).

---

## Rate limiting fail-open (documented trade-off)

If Postgres is down or rate-limit queries fail, the API **allows** the request and logs `rate_limit_fail_open` to `security_logs`. This prioritizes availability over abuse protection during DB incidents. Monitor that event type in admin **Security logs**.

---

## Contacts & ownership

Fill in before launch:

| Role | Owner | Contact |
|------|-------|---------|
| Vercel / DNS | | |
| Supabase | | |
| RevenueCat | | |
| cron-job.org | | |
| Google Play Console | | |

---

## Related docs

- `MD/SECURITY_AUDIT.md` — findings checklist
- `ToDo/security-deferred.md` — remaining hardening (optional API Sentry, RLS, etc.)
- `ToDo/SENTRY_INTEGRATION.md` — mobile Sentry reference (live)
