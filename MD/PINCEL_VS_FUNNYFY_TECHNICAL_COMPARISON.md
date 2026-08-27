# Pincel vs FunnyFy — Technical & Architectural Comparison

**Status:** Reference doc  
**Date:** August 2026  
**Sources:**
- **Pincel AI Photo Editor** v1.2.6 (`com.pincel.mobile`) — decompiled APK at `D:\opencode\pincel` (AndroidManifest, `resources/`, `sources/`, Hermes bundle `index.android.bundle`)
- **FunnyFy** — source at `D:\Claude\funnyfyapp` (Vercel API + Expo mobile client)

**Caveats:** Pincel is analyzed from a shipped binary (no source) — some server-side conclusions are inferred from strings/module references and marked as such. FunnyFy is analyzed from full source.

> **⚠️ About Pincel's model & platform:** the client binary contains **one** model identifier — `pxai/grok-imagine-video` — and **no inference-provider endpoint** (no `fal.run`, `api.replicate.com`, `api.x.ai`, etc.). The app only sends that string to Pincel's own Supabase backend; whatever actually runs the model lives server-side and is **not observable from the APK**. Everything about Grok Imagine / "xAI first-party" / partner pricing below is **inferred**, not confirmed.

---

## TL;DR

| | **Pincel** | **FunnyFy** |
|---|---|---|
| Model provider | `pxai/grok-imagine-video` string in client; actual host **unconfirmed** (server-side) | Replicate marketplace (Flux / Nano Banana / Seedream) — confirmed |
| Inference latency | Near-instant submit, fast generation (measured qualitatively); platform unconfirmed | Queue + cold start + serial worker → 10-60s+ |
| Backend | Supabase (Edge Functions + RPC + Realtime + Storage + Auth) | Vercel serverless + custom JWT + Postgres-backed job queue |
| Image input | Upload to Supabase Storage → URL | Base64 data-URL passed straight to Replicate |
| Output storage | Supabase bucket + signed URLs, persisted library | Replicate URL stored on DB row |
| Moderation | Provider-side (inferred; none client-side) | Explicit Sightengine, pre-submit + on output |
| Monetization | Credits (100 free) + subs; RevenueCat + Stripe + Paddle | Quota tiers (3 free trial); RevenueCat only |
| Coverage | Images + video (image/text-to-video) | Images only |

---

## 1. End-to-end generation flow

### Pincel (submit → id → pull)

```
Client ─ upload image to Supabase Storage bucket (pincel-export) ─┐
        ─ call Edge Function / RPC ("generate-image-v2",           │
          "anon_0_generate") with prompt + action_key + ref images ┘
            → returns generationId  (sub-second)
Client ─ watch DB row via Realtime (postgres_changes) or poll
            row: id, output_url, action_key, prompt, created_at,
                 media_type, status, error_message_id
        → when status=done, download signed output_url from bucket
```

- Job submission is **decoupled from a queue worker** — the backend starts the model call immediately.
- Result delivery is **push-ish** (Supabase Realtime) or fast polling of a tiny DB row; no serverless worker blocks on the model.

### FunnyFy (enqueue → queue → worker → poll)

```
Client ─ POST /api/enqueue { styleId, imageUrl (base64 data URL), auth? }
        → creates job row (pending) → returns jobId  (fast)
Client ─ kicks GET /api/cron/process-queue (fire-and-forget)   ← app also does this right after enqueue
Client ─ polls GET /api/job?id=… every 2s

Worker ─ claims ONE pending job (FOR UPDATE SKIP LOCKED)
       ─ may run Sightengine check on the input image          (hot path)
       ─ POST to Replicate /v1/predictions (with webhook registered)
       ─ SYNCHRONOUSLY polls Replicate up to 30 × 2s = 60s     (blocks the serverless request)
       ─ validates output URL (fetch) → marks job completed
Webhook (fallback path) ─ Replicate calls /api/webhooks/replicate when done
```

**Key difference:** Pincel's request path never blocks on model latency. FunnyFy's worker blocks its whole invocation on the model, and only claims one job at a time → jobs serialize and the next one waits.

---

## 2. Stack comparison

| Layer | Pincel | FunnyFy |
|---|---|---|
| Mobile client | Expo SDK 54, RN new architecture, Hermes bytecode | Expo SDK 52, RN 0.76, custom JWT + sentry |
| App-specific native code | ~none (`BuildConfig.java`, `R.java` only) | ~none (Expo managed) |
| Server runtime | Supabase Edge Functions (Deno) | Vercel serverless (Node, `@vercel/node`) |
| Database | Supabase Postgres | Supabase Postgres |
| Auth | Supabase Auth (email, OAuth, Apple sign-in, PKCE) | Custom JWT issued by backend (`api/_utils/auth.ts`) |
| Object storage | Supabase Storage buckets (`pincel-export`, `pincel-video-jobs`) | None for inputs; outputs stay on Replicate's CDN |
| Deep links | `pincel://`, `exp+pincel-ai-photo-editor://`, auth via `auth.expo.io` | JWT in header only |
| Push/live update | Supabase Realtime + push notifications | Polling only |
| Web presence | Yes — RevenueCat web paywall component + Stripe.js + Paddle SDKs in bundle | None (RN-web present, no web store) |

---

## 3. The generation graph

### Pincel — 1 model family, many tools *(strings; actual image model name not in binary)*
The client only embeds one model string — `pxai/grok-imagine-video` (video). Image edits call the backend too; the image model identifier is **not present in the APK**. A "tool" = an **action_key** + a crafted **system prompt** (+ optional reference images):

| action_key (inferred from prompts) | System prompt seed |
|---|---|
| `edit` | "realistic photo edit preserving the original subject and composition while applying the requested changes" |
| `remove` | "…specified object removed, seamlessly blending the background" |
| `relight` | "…adjusted lighting, preserving the original subject and composition" |
| `replace-background` | "…replacing only the environment with the user prompt" |
| `clothing` | "…Replace their clothing with the outfit shown in the clothing reference image" |
| `hairstyle` | "…new hairstyle, keeping the same face, body, and pose" |
| `merge` | "…merged image combining elements from both source images seamlessly" |
| video (im2vid / txt2vid) | `pxai/grok-imagine-video` (only model string in binary; host unconfirmed) |

Reference images (clothing / hairstyle / lighting / style) map naturally to Grok Imagine's edit input schema (multi-image + text edit).

### FunnyFy — many models, per-style config
Every style declares its own `prompt` + optional **model pool** (random pick per generation):

| Model ID (Replicate) | Where used |
|---|---|
| `black-forest-labs/flux-kontext-pro` | default, 90s/3D/art/etc. |
| `google/nano-banana` / `google/nano-banana-2` | stickers, cartoons, most popular |
| `bytedance/seedream-4` / `bytedance/seedream-4.5` | classics, comic, manga, art |

Costs tracked per model (`job-cost.ts`): ~$0.039 nano-banana, ~$0.067 nano-banana-2, ~$0.04 flux/seedream.

---

## 4. Why Pincel *feels* much faster (the concrete deltas)

1. **Provider layer.** Pincel's generation is presumably a fast, first-party-grade hosted model (the `pxai/grok-imagine*` naming implies a partner deal) with no visible queue/cold-start in its submit path — **but the executing platform cannot be confirmed from the APK**. FunnyFy → Replicate: queue wait + GPU cold start + weight load before inference, all outside your control (confirmed).
2. **No blocking worker.** Pincel's request path returns a `generationId` instantly; there is no "worker invocation per job" to serialize on. FunnyFy's worker claims **1 job** and **synchronously polls Replicate inside the request** (`api/_utils/process-job.ts` → `pollReplicatePrediction` 30×2s). If the Vercel function duration limit hits, the job drops to the webhook/recovery path (`JOB_STUCK`).
3. **Hot-path moderation.** FunnyFy runs a Sightengine check on the input **before** POSTing to Replicate (`process-job.ts:155-169`). Pincel has none client-side (inferred: relies on provider moderation).
4. **Result delivery.** Pincel uses push (Realtime) and tiny-row polling. FunnyFy's client polls `GET /api/job` every 2s, and each poll can trigger a live Replicate sync (`job.ts` → `syncJobWithReplicate`), so poll latency tracks Replicate slowness.
5. **Output validation.** FunnyFy fetches the output URL to validate before completing (`validateOutputImageUrl`) — one more external hop on the completion path.

---

## 5. Monetization & free tier

| | Pincel | FunnyFy |
|---|---|---|
| Model | **Credits** — 100 free on signup, credit packs (500/1000), weekly/monthly recurring grants | **Quota** — 3 free trial generations, then Starter/Popular/Pro monthly caps |
| Credits↔images | 1 credit = 1 generation (verified empirically: 42 used / 58 left) | N/A (counts generations) |
| Premium differentiators | "priority generation", "persistent history", "save generated images/videos to account", "premium users keep all generated images saved" | Monthly quota + higher burst limits |
| Paywalls | RevenueCat (Google Play + Amazon) + Recurring cards: Paddle v2 + Stripe.js in-bundle (web) | RevenueCat (Google Play / App Store) only |
| Free-tier storage | Gated — free videos aren't saved | Gated — gallery is local (AsyncStorage + media library) |
| Economics sanity | 100 imgs worst-case ≈ $2/user at retail, but partner pricing + low average utilization + LTV from ~3-6% conversion → profitable | 3 trial imgs ≈ $0.12-0.20 worst case → very conservative |

---

## 6. Moderation / safety (key philosophical difference)

- **Pincel:** no client-side or visible pipeline moderation. It trusts the provider's content safety. This is only safe because the model is first-party (xAI moderates) and there's no shared "your API key" to risk.
- **FunnyFy:** explicit **Sightengine** moderation because the Replicate account is under the developer's identity — runaway NSFW could flag/bans the API/account. Input is checked pre-submit; outputs are checked; violations go to an `infringements` table; Replicate content-policy errors are also trapped. This costs 1-3s on the hot path but protects the account.

Binary protection: Pincel ships **PairIP** license checking in the APK; FunnyFy has none (normal for App Store/Play only).

---

## 7. Observability / ops

| | Pincel | FunnyFy |
|---|---|---|
| Cost tracking | uniform per-credit (inferred) | per-job cost by model (`cost_tracking`, `job_cost`) |
| Spend control | — | daily spending cap + automatic queue pause (`cost-protection.ts`) |
| Billing ops | RevenueCat products only | RevenueCat + Google Play credentials, trial/cancel/expiry webhooks |
| Admin dashboard | none visible in bundle | full admin UI: finance/MRR, growth, users, jobs, queue, moderation, security logs |
| Error UX | "credits refunded" style messaging | `job-messages.ts` humanized errors + report-bad-output + revocation |

---

## 8. What FunnyFy does *better* already

- **Cost control & account safety** — Sightengine + spend cap + per-model cost accounting is far more defensive than anything visible in Pincel.
- **Admin/ops visibility** — MRR, churn, trial spend, cost-per-model dashboards don't exist in Pincel's client.
- **Model flexibility** — swapping a style's model is a config change; Pincel is bound to one provider family.

## 9. Gaps to close (ordered by impact vs Pincel)

1. **Make the worker async-first** — POST Replicate with webhook, save `predictionId`, return immediately; stop holding a serverless invocation on the model. Claim N jobs per call instead of 1. (Biggest win, fully within FunnyFy's code.)
2. **Cut provider latency** — move hot styles off Replicate retail (nano-banana → Gemini API; flux/seedream → fal.ai) or use always-on Replicate deployments. This is the single biggest perceived gap.
3. **Defer Sightengine** to after submission (or run at enqueue when the image first arrives) — keeps the account-protection guarantee, removes the pre-submit dead time.
4. **Validate outputs asynchronously**, not on the completion path.
5. **Client delivery** — with webhook-driven DB updates, `GET /api/job` becomes pure-DB fast; optionally adopt push (Supabase Realtime) later.
6. **Web storefront** — add Stripe webhook writing to the same entitlement/credits ledger as `api/webhooks/revenuecat.ts` to enable web/Android cross-platform purchases while keeping Play Billing for in-app Android sales.

---

## Appendix: Pincel evidence table (from binary)

| Artifact | Evidence |
|---|---|
| Expo SDK 54 / new arch | `app.config`: `sdkVersion 54.0.0`, `newArchEnabled: true` |
| Hermes bundle | `index.android.bundle` magic `C6 1F BC 03` (Hermes bytecode) |
| Supabase backend | `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`, `https://lmjlzvsjehzhkfztubkr.supabase.…`, `/functions/v1/delete-library-item`, Realtime `postgres_changes` |
| Generation model | **Only** `pxai/grok-imagine-video` string in client; provider & image model **unconfirmed** (server-side) |
| Inference host | **Not observable from APK** — no `fal.run` / `api.replicate.com` / `api.x.ai` strings exist in the client |
| Storage buckets | `pincel-export`, `pincel-video-jobs` |
| Credits economy | "100 free credits", `pincel_credits_500/1000`, "credits / week / month", "priority generation" |
| Paywalls | RevenueCat (`purchases`), Paddle (`paddle.js`), Stripe (`js.stripe.com/v3`, Paddle + Stripe = web checkout) |
| Purchases platforms | Google Play Billing 8.0 + Amazon (`com.amazon.device.iap`, RevenueCat Amazon) |
| Binary protection | `com.pairip.licensecheck.LicenseActivity / LicenseContentProvider` |
| Video | `AI Text to Video`, `AI Image to Video`, "Your AI video is ready to view" |