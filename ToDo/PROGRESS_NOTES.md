# Progress Notes — Updated June 2025

**Last Updated**: June 2025 (second session — full rescan)
**Note**: This file supersedes the January 2025 notes. A full codebase scan was done and the actual state differs from earlier notes (the other tool implemented more than it recorded).

---

## ✅ FULLY COMPLETE — Do Not Re-Implement

### Authentication
- ✅ `api/auth/token.ts` — JWT token generation (new users, RevenueCat users, anonymous)
- ✅ `api/auth/refresh.ts` — Token refresh endpoint
- ✅ `api/utils/security.ts` — JWT verification, extractUserId (JWT-first, dev fallback only)
- ✅ `api/utils/auth.ts` — requireAuth / optionalAuth middleware
- ✅ `apps/mobile/services/auth.js` — Offline-first auth with JWT storage

### Async Queue System (fully wired end-to-end)
- ✅ `api/enqueue.ts` — Enqueue endpoint (auth, quota check, job creation, triggers worker)
- ✅ `api/job.ts` — Job status polling endpoint
- ✅ `api/process-job.ts` — Shared Replicate API caller (polls to completion)
- ✅ `api/cron/process-queue.ts` — Queue worker (priority, cost check, usage increment)
- ✅ `vercel.json` — Cron schedule `* * * * *` (every minute) — **added June 2025**
- ✅ `apps/mobile/services/api.js` — enqueueJob() + pollJobStatus() — mobile fully async

### Rate Limiting
- ✅ `api/utils/ratelimit.ts` — IP rate limit + tier burst limit + daily safety limit
- ✅ `checkAllRateLimits()` called in enqueue.ts

### Cost Protection
- ✅ `api/utils/cost-protection.ts` — Daily spending cap, pause queue, record job cost
- ✅ `api/utils/queue-stats.ts` — Queue depth, avg wait time, estimated wait time

### Security
- ✅ `api/utils/security.ts` — CSP, CORS, HSTS, sanitization, safeErrorResponse
- ✅ `api/utils/security-logging.ts` — Full security event logging to DB
- ✅ `api/utils/validation.ts` — Zod schemas for all inputs
- ✅ `api/utils/middleware.ts` — Combined CORS + security header middleware
- ✅ NSFW moderation via Sightengine in test.ts (now retired) — moved to process-job if needed

### Subscription Handling
- ✅ `api/webhooks/revenuecat.ts` — INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION, EXPIRATION
- ✅ `api/sync-subscription.ts` — Manual sync endpoint
- ✅ `api/user/subscription.ts` — User subscription status endpoint
- ✅ `api/usage.ts` — Usage stats endpoint (trial + subscribed)
- ✅ `apps/mobile/services/revenuecat.js` — RevenueCat SDK wrapper
- ✅ Full subscription UI in App.js (management screen, badges, quota bars)

### Mobile App
- ✅ `screens/HomeScreen.js` — Style selection
- ✅ `screens/UploadScreen.js` — Image pick + quota display
- ✅ `components/` — CompareSlider, DrawerMenu, NotificationProvider, SkeletonLoader, StyleCard
- ✅ `services/api.js` — All API calls via async enqueue+poll

### Database
- ✅ `api/migrations-master.sql` — **Created June 2025** — full schema for fresh database
- ✅ `api/migrations-infringements.sql` — NSFW ban support (ALTER TABLE, safe for existing DB)
- ✅ `api/migrations-pending-tier.sql` — Deferred tier changes (ALTER TABLE, safe for existing DB)

### Retired / Deprecated
- ✅ `api/test.ts` — Disabled (returns HTTP 410). Legacy synchronous endpoint. Keep for reference.

---

## ⚠️ INCOMPLETE / STILL NEEDED

### Admin Dashboard ✅ NOW COMPLETE
- ✅ `api/admin/login.ts` — JWT-based admin auth
- ✅ `api/admin/queue-stats.ts` — Queue depth, cost, spending 7d — **created June 2025**
- ✅ `api/admin/security-logs.ts` — Security event log viewer — **created June 2025**
- ✅ `api/admin/users.ts` — User list, search, filter, ban/unban, quota adjust, tier change — **created June 2025**
- ✅ `api/admin/stats.ts` — Overview stats: users by tier, MRR, jobs trend — **created June 2025**
- ✅ `api/admin/jobs.ts` — Job list, retry failed, cancel pending — **created June 2025**
- ✅ `public/dashboard.html` — Full working admin UI (5 pages: Overview, Users, Jobs, Queue, Security) — **replaced June 2025**

**What exists**: `api/admin/login.ts` (JWT-based admin auth, working)
**What's needed**: Admin API routes for users, jobs, stats, and a functional dashboard UI

### Production Deployment
- ❌ `migrations-master.sql` has NOT been run on production DB yet — do this before next deploy
- ❌ Live RevenueCat webhook pointing to production URL not verified
- ❌ EAS build with real store accounts not done yet
- ❌ `CRON_SECRET` env var should be set in Vercel to lock down cron endpoint

### Missing Environment Variables (must be set in Vercel)
- `JWT_SECRET` — required for all auth
- `CRON_SECRET` — recommended to secure cron endpoint
- `DAILY_SPENDING_CAP` — default is $100/day if not set
- `ADMIN_USER_IDS` — comma-separated UUIDs for admin access
- `SIGHTENGINE_API_USER` + `SIGHTENGINE_API_SECRET` — for NSFW moderation in queue
- `DATABASE_URL` — Supabase connection string
- `TARGET_API_URL` + `TARGET_API_KEY` — Replicate API

### NSFW Moderation in Queue Worker
- ⚠️ Sightengine moderation was in `test.ts` (now retired) but is NOT in `process-job.ts`
- The queue worker (`process-queue.ts` → `process-job.ts`) skips NSFW checking
- Needs to be added to `process-job.ts` before launch if NSFW enforcement is required

---

## 📋 Next Session Checklist

1. **Run `migrations-master.sql`** in Supabase SQL Editor (production DB)
2. **Set all missing env vars** in Vercel dashboard
3. **Add NSFW moderation** to `api/process-job.ts` (port from retired `test.ts`)
4. **Build admin dashboard** — at minimum: user list, ban controls, usage stats
5. **EAS production build** + live store test
6. **Verify RevenueCat webhook** pointing to production URL with correct secret

---

## 🗂️ Key File Map

| What you want to change | File |
|------------------------|------|
| Auth token generation | `api/auth/token.ts` |
| Token verification | `api/utils/security.ts` → `verifyJWT()` |
| Enqueue a generation | `api/enqueue.ts` |
| Check job status | `api/job.ts` |
| Process jobs (worker) | `api/cron/process-queue.ts` → `api/process-job.ts` |
| Rate limits | `api/utils/ratelimit.ts` |
| Cost limits | `api/utils/cost-protection.ts` |
| RevenueCat events | `api/webhooks/revenuecat.ts` |
| User subscription status | `api/user/subscription.ts` |
| Usage stats | `api/usage.ts` |
| Mobile API calls | `apps/mobile/services/api.js` |
| Mobile auth | `apps/mobile/services/auth.js` |
| DB schema (fresh) | `api/migrations-master.sql` |
| DB schema (add-ons) | `api/migrations-infringements.sql`, `api/migrations-pending-tier.sql` |
| Vercel cron + timeouts | `vercel.json` |
