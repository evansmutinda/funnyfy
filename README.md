# FunnyFy

AI caricature mobile app — React Native (Expo SDK 52) + Vercel serverless backend + Replicate.

Transform photos into caricatures across **160 catalog styles** (enabled count in [`MD/STYLES.md`](MD/STYLES.md) / auto-generated [`MD/PROMPTS.md`](MD/PROMPTS.md)), with RevenueCat subscriptions, usage quotas, NSFW moderation, and JWT auth.

**Status:** Feature-complete — awaiting app store submission (July 2026)  
**Version:** see [`apps/mobile/version.json`](apps/mobile/version.json) (single source of truth — do not hardcode semver in docs)

---

## Quick links

| Resource | URL |
|----------|-----|
| Staging API | https://funnyfy-staging.vercel.app |
| Production API | https://funnyfyapp.vercel.app |
| Health check | `GET /api/health` |
| Current status | [`MD/STATUS.md`](MD/STATUS.md) |
| Testing guide | [`MD/TESTING.md`](MD/TESTING.md) |
| Local APK build | [`MD/BUILD_APK_GUIDE.md`](MD/BUILD_APK_GUIDE.md) |

---

## Repo layout

```
apps/mobile/     React Native app (Expo SDK 52)
api/             Vercel serverless functions (TypeScript)
MD/              Documentation
ToDo/            Backlog & deferred security items
build-apk-local.ps1   Local debug APK (no EAS quota)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo SDK 52 |
| Backend | Vercel serverless (TypeScript) |
| Database | Supabase (Postgres) |
| AI | Replicate API |
| Subscriptions | RevenueCat |
| Auth | Custom JWT |
| Error tracking | Sentry (`react-native` project, staging) |

---

## Local development

### Mobile env

```bash
cd apps/mobile
cp env.example .env
# Set EXPO_PUBLIC_API_URL, RevenueCat keys, Sentry DSN — see apps/mobile/README-ENV.md
npm install
npx expo start
```

### Android debug APK (recommended over Expo Go)

```powershell
# From repo root — requires Android SDK + JDK 17
.\build-apk-local.ps1
```

Skip prebuild on repeat builds: `.\build-apk-local.ps1 -SkipPrebuild -NoVersionBump`

### API

Deploy via Vercel. See `MD/ENV_SETUP.md` and `MD/SETUP_VERCEL_ENV.md` for environment variables.

---

## Key features

- Netflix-style style picker (16 categories, dark UI)
- Upload → review → generate flow with OS crop (`expo-image-picker`)
- Gallery (**`DCIM/Funnyfy`** saves), save/share, restyle from result
- RevenueCat paywall + backend subscription sync
- Offline banner + generate guards
- Admin dashboard, cron queue worker, webhook idempotency
- Infra: `/api/health`, CI typecheck, disaster recovery runbook

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`MD/STATUS.md`](MD/STATUS.md) | Launch checklist & current state |
| [`MD/CHANGELOG.md`](MD/CHANGELOG.md) | Version history |
| [`MD/TESTING.md`](MD/TESTING.md) | API, mobile, versioning, test guide |
| [`MD/GALLERY_SCREEN.md`](MD/GALLERY_SCREEN.md) | My Gallery + **`DCIM/Funnyfy`** path |
| [`MD/DEVELOPMENT_PLAN.md`](MD/DEVELOPMENT_PLAN.md) | Architecture & phases |
| [`MD/SECURITY_AUDIT.md`](MD/SECURITY_AUDIT.md) | Security findings |
| [`MD/DISASTER_RECOVERY.md`](MD/DISASTER_RECOVERY.md) | RTO/RPO & runbooks |
| [`To do/SENTRY_INTEGRATION.md`](To%20do/SENTRY_INTEGRATION.md) | Mobile Sentry setup (live) |
| [`ToDo/security-deferred.md`](ToDo/security-deferred.md) | Remaining hardening backlog |

Full doc index: [`MD/README.md`](MD/README.md)

---

## Pricing

| Tier | Price | Images/month |
|------|-------|----------------|
| Starter | $5 | 50 |
| Popular | $10 | 100 |
| Pro | $25 | 250 |

---

## App identifiers

- **Name:** FunnyFy
- **Android package:** `com.evansks.funnyfyapp`
- **GitHub:** [evansmutinda/funnyfy](https://github.com/evansmutinda/funnyfy)

---

**Last updated:** July 2026
