# ToDo

**Last updated:** 26 Aug 2026

### Production Vercel (`funnyfyapp`) — Phase 1–2 done

- [x] Smoke `/api/health` + `/api/db-test`
- [x] Rotate `CRON_SECRET`
- [x] Prod user → `ADMIN_USER_IDS` → redeploy → admin login
- [x] RevenueCat prod webhook test (`ok` / `received`)

**Next:** [PRODUCTION_LAUNCH_ORDER.md](./PRODUCTION_LAUNCH_ORDER.md) Phase 4 — Google Play Console.

| Priority | File | Status |
|----------|------|--------|
| **Start here** | [security-deferred.md](./security-deferred.md) | Main backlog + prod env table |
| **Prod launch order** | [PRODUCTION_LAUNCH_ORDER.md](./PRODUCTION_LAUNCH_ORDER.md) | Full chronological checklist (Google + RC + Replicate) |
| Before Play Store | [GITHUB_BRANCH_PROTECTION.md](./GITHUB_BRANCH_PROTECTION.md) | Manual GitHub step |
| Before Play Store | [MD/RELEASE_SIGNING.md](../MD/RELEASE_SIGNING.md) | Run keystore script once |
| When prod DB is live | [ADMIN_DASHBOARD_SETUP.md](./ADMIN_DASHBOARD_SETUP.md) | Production admin IDs |
| Later | [APP_VERSION_GATING.md](./APP_VERSION_GATING.md) | Not built |
| Ongoing | [COMPARISON_ASSETS.md](./COMPARISON_ASSETS.md) | Some pairs missing |

**Reference (no action):** [MD/SPLASH_ASSET.md](../MD/SPLASH_ASSET.md) · [MD/SENTRY_INTEGRATION.md](../MD/SENTRY_INTEGRATION.md) · [MD/APP_ENTRY.md](../MD/APP_ENTRY.md)

**Canonical docs:** [MD/STATUS.md](../MD/STATUS.md) · [MD/FUNNYFY_FLOW.md](../MD/FUNNYFY_FLOW.md) · [MD/DISASTER_RECOVERY.md](../MD/DISASTER_RECOVERY.md) · [MD/SECURITY_AUDIT.md](../MD/SECURITY_AUDIT.md)
