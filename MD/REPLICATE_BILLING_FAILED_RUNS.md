# Replicate: Failed Runs Are Not Billed

From [Replicate Billing Docs](https://replicate.com/docs/topics/billing):

> **For all models, if a run fails, we don't charge you.**

This applies to FunnyFy because we use public Replicate models (not private deployments). When a generation fails:
- **Replicate:** No charge for failed predictions
- **FunnyFy:** Usage is incremented only on successful job completion in `api/cron/process-queue.ts` via `creditUsageForJob()` in `api/_utils/usage.ts`

The user's counter therefore matches actual successful generations and failed attempts do not consume credits.

---

## In-App Retry Flow (Feb 2025)

The app allows up to **3 total attempts** per generation. After each failure:
- User sees the error message and a "Retry" button
- Tapping Retry resubmits with the same image (attempt 2 or 3)

After the **3rd failure**:
- Message: "Please try again later"
- Confirmation: "Failed generations are not billed. Your usage counter is unchanged."
- User can choose another photo or go back

This reassures users that repeated failures do not affect their quota or billing.
