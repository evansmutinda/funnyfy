# Closed testing — generation quota

**Status:** Built — enable via Vercel env for the closed window only.

**Policy (agreed):** **15 testers × 1 generation/day × 12 days** → **12 gens/user**, ~**180 gens** total (~**$7** at ~$0.04/gen).

---

## Enable (ops)

On Vercel project **funnyfyapp** (Production + Preview):

| Env | Value | Purpose |
|-----|-------|---------|
| `CLOSED_TEST_QUOTA` | `12` | Total gens per unpaid user (month counter) |
| `CLOSED_TEST_DAILY_QUOTA` | `1` | Max gens per calendar day |
| `DAILY_SPENDING_CAP` | `2`–`10` | Global Replicate backstop (~15 gens/day ≈ $0.60) |

Redeploy after setting. **Unset / set `CLOSED_TEST_QUOTA=0` before production** (restores hard paywall). Restore normal `DAILY_SPENDING_CAP` after.

---

## Behaviour

- Unpaid users may enqueue while under total + daily limits.
- Subscribed users unchanged (tier monthly quotas).
- App skips launch paywall when `closedTesting` is on; Usage shows remaining; daily block message when 1/day used.
- API: `GET /api/user/subscription` → `closedTesting: true`, `usage: { current, limit, dailyCurrent, dailyLimit }`.

---

## Code

- `api/_utils/closed-test-quota.ts`
- `api/enqueue.ts` — allow closed-test path
- `api/user/subscription.ts` — expose allowance
- `api/_utils/ratelimit.ts` — optional daily override
- `apps/mobile/utils/usageQuota.js` — `canUseGenerationQuota` / `requiresSubscriptionPaywall`
- `apps/mobile/App.js` — paywall / generate gates

---

## Out of scope

- Changing Starter/Popular/Pro monthly quotas
- Restoring free trial as a permanent product feature
