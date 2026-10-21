# ToDo

**Last updated:** 21 Oct 2026

| Priority | File | Status |
|----------|------|--------|
| **Start here** | [security-deferred.md](./security-deferred.md) | Main backlog |
| **Prod launch order** | [PRODUCTION_LAUNCH_ORDER.md](./PRODUCTION_LAUNCH_ORDER.md) | Chronological checklist |
| **Before closed testing** | [CLOSED_TESTING_QUOTA.md](./CLOSED_TESTING_QUOTA.md) | 15×1/day×12d — set `CLOSED_TEST_QUOTA=12` on Vercel |
| Before Play Store | [GITHUB_BRANCH_PROTECTION.md](./GITHUB_BRANCH_PROTECTION.md) | Manual GitHub step |
| Before Play Store | [MD/RELEASE_SIGNING.md](../MD/RELEASE_SIGNING.md) | Keystore once |
| **Play Console** | [PLAY_CONSOLE_ANDROID.md](./PLAY_CONSOLE_ANDROID.md) | Pending: R8 verify · 16 KB · edge-to-edge · large screens |
| **Future** | [CREDIT_PACKS.md](./CREDIT_PACKS.md) | Consumable top-ups — deferred |
| **Future** | [ONBOARDING.md](./ONBOARDING.md) | Coach-mark tutorial — deferred; off once subscribed |
| Ongoing | [COMPARISON_ASSETS.md](./COMPARISON_ASSETS.md) | Caricature pairs done; rest deferred |

**Ops — app update nudge (avoid Play lag friction):** Soft = Vercel `LATEST_APP_VERSION`. Force = `MIN_REQUIRED_APP_VERSION` (no “Not now”). Soft “Not now” resurfaces after 3 cold starts.

1. Upload / roll out AAB on the track testers/users actually use.  
2. Wait until Play shows **Available** / Update on a test device (often minutes–hours; public page can lag).  
3. **Then** set `LATEST_APP_VERSION` (and force only if needed) → redeploy API.  
4. Never bump `LATEST_APP_VERSION` at EAS build time or when the track is still processing — that causes “Update” → Store still on old version.

**Admin:** Staging/prod `admin_users` seeded — login at `/admin/login` (see [MD/FUNNYFY_FLOW.md](../MD/FUNNYFY_FLOW.md)).

**Reference:** [MD/SPLASH_ASSET.md](../MD/SPLASH_ASSET.md) · [MD/SENTRY_INTEGRATION.md](../MD/SENTRY_INTEGRATION.md) · [MD/APP_ENTRY.md](../MD/APP_ENTRY.md)

**Canonical:** [MD/STATUS.md](../MD/STATUS.md) · [MD/FUNNYFY_FLOW.md](../MD/FUNNYFY_FLOW.md) · [MD/DISASTER_RECOVERY.md](../MD/DISASTER_RECOVERY.md) · [MD/SECURITY_AUDIT.md](../MD/SECURITY_AUDIT.md)
