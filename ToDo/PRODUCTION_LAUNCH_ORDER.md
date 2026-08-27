# Production launch order (chronological)

**Last updated:** 26 Aug 2026  
**Package:** `com.evansks.funnyfyapp`  
**Prod API:** `https://funnyfyapp.vercel.app` · **Staging API:** `https://funnyfy-staging.vercel.app`

Do these in order. Don’t skip ahead to Play Store uploads before the backend DB works.

---

## Phase 0 — Already done (skip)

- [x] Prod Supabase org + project + **schema loaded**
- [x] Prod Vercel env: `CRON_SECRET`, `JWT_SECRET`, `ALLOWED_ORIGIN`, `PUBLIC_API_URL`, `TARGET_API_*`, Replicate/RevenueCat webhook secrets, Sightengine
- [x] cron-job.org job for prod queue (`Bearer` + `CRON_SECRET`)
- [x] RevenueCat prod webhook URL + secret (confirm still correct in Phase 2)
- [x] **Phase 3 — Replicate** (same API token, webhook via env, credits confirmed)

---

## Phase 1 — Finish production backend

1. [x] **`DATABASE_URL`** on Vercel `funnyfyapp` (Supabase **Transaction pooler**, port 6543)
2. [x] **Redeploy** `funnyfyapp` (health OK after deploy)
3. [x] Smoke: `GET /api/health` → OK (26 Aug 2026)
4. [x] Smoke: `GET /api/db-test` → OK (26 Aug 2026)
5. [x] Rotate `CRON_SECRET` (Vercel + cron-job.org + redeploy) (26 Aug 2026)
6. [x] Create first prod user (26 Aug 2026)
7. [x] Set **`ADMIN_USER_IDS`** to that **prod** UUID → redeploy (26 Aug 2026)
8. [x] Admin login works at `https://funnyfyapp.vercel.app/admin/login` (26 Aug 2026)
9. [ ] Deploy recent API hardening to **staging** too (Secure Store is mobile-only; cron/admin fail-closed need staging deploy)

---

## Phase 2 — RevenueCat (prod) ✅ Done

8. [x] Confirm **two webhooks**: staging → staging URL (Sandbox); prod → `https://funnyfyapp.vercel.app/api/webhooks/revenuecat` (Production)
9. [x] Prod webhook secret matches Vercel `REVENUECAT_WEBHOOK_SECRET`
10. [x] Events enabled: INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION, EXPIRATION, BILLING_ISSUE
11. [x] Send **test event** to prod webhook → OK (`ok: true`, `received: true`) (26 Aug 2026)

*(App still uses `test_…` SDK keys until Phase 5 release build.)*

---

## Phase 3 — Replicate (prod) ✅ Done

12. [x] Same API token in `TARGET_API_KEY` is fine (or separate token for billing isolation)
13. [x] No Replicate dashboard webhook to add — app uses `PUBLIC_API_URL` + `REPLICATE_WEBHOOK_SECRET`
14. [x] Confirm Replicate account has credits

---

## Phase 4 — Google Play Console (create store shell)

15. [x] Google account / FunnyFy identity for Play Console (developer account done)
16. [x] Create app: package **`com.evansks.funnyfyapp`**, Free (26 Aug 2026)
17. [ ] Complete **Store listing** drafts: title, short/full description, screenshots, icon, feature graphic
18. [ ] **Privacy policy URL** + support email (must match in-app / legal)
19. [ ] Content rating questionnaire
20. [ ] Target audience / news apps / Data safety form (declare photo upload, purchases, etc.)
21. [ ] Countries / pricing (can refine later)
22. [ ] Set up **Internal testing** track (not public production yet)

---

## Phase 5 — Signing, build, upload

23. [ ] Generate **release keystore** → back up `.jks` + passwords offline ([MD/RELEASE_SIGNING.md](../MD/RELEASE_SIGNING.md))
24. [ ] EAS / local release build with:
    - `EXPO_PUBLIC_API_URL=https://funnyfyapp.vercel.app`
    - **RevenueCat production** public SDK keys (not `test_…`)
    - Sentry env `production` if used
25. [ ] Upload **AAB** to Play Console → Internal testing
26. [ ] Add yourself (and testers) to Internal testing list; install from Play link

---

## Phase 6 — Wire Google ↔ RevenueCat billing

27. [ ] Play Console → create **subscription products** matching FunnyFy tiers (Starter / Popular / Pro) and base plans
28. [ ] Create Google Cloud **service account** for Play API → download JSON
29. [ ] Play Console → Users and permissions → grant that service account access (financial + view app info as RC docs require)
30. [ ] RevenueCat → Android app → upload Play service account JSON; link package `com.evansks.funnyfyapp`
31. [ ] RevenueCat → map products → entitlement → offering (same as staging catalog if already set)
32. [ ] Add **license testers** in Play Console (License testing) so sandbox purchases work

---

## Phase 7 — End-to-end test (internal)

33. [ ] Install internal-test build → auth → styles load from **prod** API
34. [ ] Purchase (license tester) → webhook updates prod DB → usage/quota correct
35. [ ] Restore purchases; Manage/cancel opens Play subscriptions
36. [ ] Generate image → Sightengine + Replicate + job completes; usage increments once
37. [ ] Offline / error toasts still sane
38. [ ] Admin dashboard sees the test user/jobs on **prod**

---

## Phase 8 — Hardening before public

39. [ ] GitHub **branch protection** on `main`
40. [ ] Mobile rebuild after Secure Store (`expo prebuild` + APK) already used in daily builds
41. [ ] Supabase backup cadence noted ([MD/DISASTER_RECOVERY.md](../MD/DISASTER_RECOVERY.md))
42. [ ] Play Console **payout & tax** on the right identity
43. [ ] Promote Internal → Closed/Open testing if desired → then **Production** release

---

## Phase 9 — Public launch

44. [ ] Production track release approved
45. [ ] Monitor Vercel / Sentry / Replicate billing / RC charts first 48h
46. [ ] Support email watched

---

## Parallel (anytime, not blocking Phase 1)

| Item | Doc |
|------|-----|
| Comparison assets / version gating | `ToDo/COMPARISON_ASSETS.md`, `APP_VERSION_GATING.md` |
| Password manager folder for all FunnyFy secrets | — |
| GitHub org transfer | optional pre-public |

---

## You are here

**Next concrete step:** Phase 4 — Store listing + host a public **privacy policy URL** + support email. Then content rating / Data safety / Internal testing track.
