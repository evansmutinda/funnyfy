# Closed testing — generation quota

**Status:** Not built — needed before / during Play closed testing (12 testers × ~12 days).

**Why:** Free trial is gone; hard paywall blocks unpaid users. Closed testers won’t purchase, but generations cost Replicate money (~$0.04 each). Need a small free allowance, then stop.

**Target (agreed ballpark):** ~**10 gens per tester** total (~0.8/day over 12 days) → ~**$5** for 12 people. Pair with a short-term **`DAILY_SPENDING_CAP`** of ~$5–10.

---

## Build

### Backend
- [ ] Env e.g. `CLOSED_TEST_QUOTA=10` (or per-user admin grant) — temporary, off for production
- [ ] Allow enqueue **without** active subscription only while under that quota
- [ ] Count gens in `usage_tracking`; reject at limit
- [ ] Lower `DAILY_SPENDING_CAP` for the closed window; restore after

### App
- [ ] Usage / Generate respect API `usage.limit` for closed-test allowance (don’t hard-block on paywall while quota remains)
- [ ] Optional copy: “Closed testing · N images left”

### Ops
- [ ] Enable env for closed testing only
- [ ] Disable / remove before production launch
- [ ] Prefer **global env quota** vs admin-per-user (decide at implement time)

---

## Out of scope
- Changing Starter/Popular/Pro monthly quotas for paid users
- Restoring free trial as a permanent product feature

---

## References
- `api/enqueue.ts` — `SUBSCRIPTION_REQUIRED` + quota check
- `api/_utils/usage.ts` — `TIER_QUOTAS` / `getTierQuota`
- `api/_utils/cost-protection.ts` — `DAILY_SPENDING_CAP`
- `apps/mobile/App.js` — `canGenerateMore` / paywall
