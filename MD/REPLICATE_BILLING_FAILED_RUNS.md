# Replicate: Failed Runs Are Not Billed

From [Replicate Billing Docs](https://replicate.com/docs/topics/billing):

> **For all models, if a run fails, we don't charge you.**

This applies to FunnyFy because we use public Replicate models (not private deployments). When a generation fails:
- **Replicate:** No charge for failed predictions
- **FunnyFy:** Usage (`subscriptions.usage_count`) is incremented only on success (see `api/process-job.ts`)

The user's counter therefore matches actual successful generations and failed attempts do not consume credits.
