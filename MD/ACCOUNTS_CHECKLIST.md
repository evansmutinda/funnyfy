# FunnyFy — Accounts & Ownership Checklist

**Purpose:** Track which services FunnyFy uses, who should own them, and what to set up before Play Store launch.

**Last updated:** June 2026

---

## Quick rule

| OK on personal (for now) | Move to FunnyFy before public launch |
|--------------------------|----------------------------------------|
| GitHub repo (short term), staging experiments, dev Replicate usage | Play Console, production Supabase, production Vercel, domain, support email, payout/tax identity |

You do **not** need duplicate GitHub / Vercel / Supabase logins on day one. Use **teams/projects** and a **FunnyFy email** for anything that touches users, money, or the brand.

---

## 1. Identity (do first)

| Item | Account / owner | Status | Notes |
|------|-----------------|--------|-------|
| Business email | e.g. `hello@funnyfy.com` | ⬜ | Play Console, support, account recovery |
| Password manager | Folder: **FunnyFy** | ⬜ | All logins + 2FA backup codes |
| Android package | `com.evansks.funnyfyapp` | ✅ | In `apps/mobile/app.config.js` |
| GitHub org | e.g. `github.com/funnyfy` | ⬜ | Optional now; recommended before collaborators |

---

## 2. Code & deployment

| Service | Current | Owner today | Before launch |
|---------|---------|-------------|---------------|
| **GitHub** | Personal repo, branch `Staging` | Personal | Create org → transfer repo |
| **Vercel staging** | `https://funnyfy-staging.vercel.app` | Personal OK | Keep for dev/testing |
| **Vercel production** | `https://funnyfyapp.vercel.app` | FunnyFy team/email | Fix `DATABASE_URL`; prod secrets only |
| **EAS / Expo** | Project ID in `app.config.js` | FunnyFy | Same account; FunnyFy team when needed |

**Env rule:** Staging and production must **not** share the same Supabase database or RevenueCat production keys.

See also: `MD/SETUP_VERCEL_ENV.md`, `MD/ENV_SETUP.md`

---

## 3. Data & API

| Service | Role | Status | Action |
|---------|------|--------|--------|
| **Supabase staging** | Dev / test DB | ⬜ | Confirm separate from prod |
| **Supabase production** | Real user data | ⬜ | FunnyFy-owned project before launch |
| **Replicate** | Image generation API | ⬜ | Dev on personal OK; prod billing on FunnyFy |
| **JWT auth** | `/api/auth/token` | ✅ | Use staging until prod DB is verified |

**Known blocker:** Production Vercel `DATABASE_URL` / Supabase password mismatch — fix before public release. Use **staging** until then.

See also: `MD/JWT_AUTHENTICATION.md`, `MD/DATABASE_SCHEMA.md`

---

## 4. Payments & subscriptions

| Service | Role | Status | Action |
|---------|------|--------|--------|
| **Google Play Console** | Billing, cancel, payouts | ⬜ | Create app; internal testing track (no public listing required to test) |
| **RevenueCat** | Subscriptions | ⬜ | Test keys in mobile `.env`; prod keys at launch |
| **Webhook** | `POST /api/webhooks/revenuecat` | ⬜ | Staging URL for tests → production URL at launch |
| **Cancel flow** | Opens Google Play / App Store | ✅ | App does **not** cancel locally only (see `api/cancel-subscription.ts`) |

**Minimum to test billing:** Play Console app + internal test APK + license tester account.

See also: `MD/REVENUECAT_SETUP.md`, `MD/REVENUECAT_PURCHASE_TESTING.md`, `MD/BUILD_APK_GUIDE.md`

---

## 5. Mobile app

| Item | Current | Action |
|------|---------|--------|
| Expo SDK | 52 (intentional) | Stay on 52 until post-launch upgrade |
| Dev builds | EAS + `build-apk-local.ps1` | **Prefer local debug APK** for daily testing; avoid Expo Go (auto-updates, weak RevenueCat). See `MD/TESTING.md` |
| Android signing keystore | — | ⬜ Create, back up, store in password manager |
| Play Store listing | Not linked yet | ⬜ Internal testing first |

Package: `com.evansks.funnyfyapp`  
Version: see `MD/STATUS.md`

---

## 6. Admin & ops

| Item | URL / path | Note |
|------|------------|------|
| Admin dashboard | `https://funnyfy-staging.vercel.app/admin/login` | Staging only for now |
| API base (staging) | `https://funnyfy-staging.vercel.app` | Default for dev |
| API base (production) | `https://funnyfyapp.vercel.app` | Verify env before release |
| Error monitoring | — | ⬜ Add at launch (Vercel / Supabase alerts) |

See also: `MD/STATUS.md` (admin at `/admin/login`), `MD/JWT_AUTHENTICATION.md`, set `ADMIN_USER_IDS` in Vercel

---

## Timeline

### This week (pre–Play Store)

- [ ] Create FunnyFy business email
- [ ] Set up password manager folder for all FunnyFy logins
- [ ] Create Play Console app (`com.evansks.funnyfyapp`)
- [ ] Upload build to **Internal testing**
- [ ] Add yourself as **license tester**
- [ ] Confirm mobile `.env` points to `funnyfy-staging.vercel.app`
- [ ] Document who owns each account (notes in password manager)

### Before public launch

- [ ] Separate **Supabase production** project
- [ ] Fix production Vercel `DATABASE_URL` and all prod secrets
- [ ] GitHub **organization** + repo transfer
- [ ] RevenueCat production keys + webhook → production URL
- [ ] Play Console payout & tax on business identity
- [ ] Back up Android signing keystore
- [ ] Support / privacy contact email on store listing

### Later (if FunnyFy grows)

- [ ] Registered company + business bank account
- [ ] `support@funnyfy.com` (or similar) on store & in-app
- [ ] Invite collaborators via team access (never share personal passwords)

---

## Service map (current stack)

```
Mobile app (Expo SDK 52)
    → Vercel API (staging / production)
        → Supabase (users, subscriptions, usage)
        → Replicate (image generation)
    → RevenueCat
        → Google Play / App Store billing
        → Webhook → Vercel /api/webhooks/revenuecat
```

---

## Related docs

| Doc | Topic |
|-----|--------|
| `MD/STATUS.md` | Overall project status |
| `MD/SETUP_VERCEL_ENV.md` | Vercel environment variables |
| `MD/ENV_SETUP.md` | Local & EAS env setup |
| `MD/REVENUECAT_SETUP.md` | RevenueCat integration |
| `MD/BUILD_APK_GUIDE.md` | APK builds (EAS + local) |
| `MD/PRODUCTION_TESTING_CHECKLIST.md` | Pre-release testing |

---

## Changelog

| Date | Change |
|------|--------|
| June 2026 | Initial checklist |
