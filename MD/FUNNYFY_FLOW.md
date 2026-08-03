# FunnyFy System Flow

**Status:** Living reference  
**Last updated:** July 2026  
**Related:** `DATABASE_SCHEMA.md`, `SERVER_ARCHITECTURE_EXPLANATION.md`, `REVENUECAT_SETUP.md`

A visual map of how the mobile app, API, billing, generation pipeline, and admin dashboard connect. Use this when the project feels bigger than “upload a photo, get a funny image.”

**View rendered diagrams**

- **Browser (all charts):** open [`FUNNYFY_FLOW.html`](FUNNYFY_FLOW.html) in Chrome/Edge/Firefox  
- **Image files:** [`diagrams/`](diagrams/) — SVG + PNG for each chart (share, print, slide decks)

| Diagram | SVG | PNG |
|---------|-----|-----|
| Big picture | [01-big-picture.svg](diagrams/01-big-picture.svg) | [01-big-picture.png](diagrams/01-big-picture.png) |
| Job lifecycle | [02-job-lifecycle.svg](diagrams/02-job-lifecycle.svg) | [02-job-lifecycle.png](diagrams/02-job-lifecycle.png) |
| Generation sequence | [03-generation-sequence.svg](diagrams/03-generation-sequence.svg) | [03-generation-sequence.png](diagrams/03-generation-sequence.png) |
| Money flow | [04-money-flow.svg](diagrams/04-money-flow.svg) | [04-money-flow.png](diagrams/04-money-flow.png) |
| Billing sync | [05-billing-sync.svg](diagrams/05-billing-sync.svg) | [05-billing-sync.png](diagrams/05-billing-sync.png) |
| Deploy flow | [06-deploy-flow.svg](diagrams/06-deploy-flow.svg) | [06-deploy-flow.png](diagrams/06-deploy-flow.png) |

---

## The big picture

```mermaid
flowchart TB
  subgraph Mobile["📱 Mobile App"]
    A[User opens app] --> B{Trial or paid?}
    B -->|Trial| C[3 free gens]
    B -->|Paid| D[Starter / Popular / Pro]
    C --> E[Pick style + upload photo]
    D --> E
    E --> F[Subscribe via RevenueCat]
    F --> G[Request generation]
  end

  subgraph API["⚙️ Vercel API"]
    G --> H["/api/enqueue"]
    H --> I{Quota OK?}
    I -->|No| J[Reject — limit reached]
    I -->|Yes| K[Create job in DB — pending]
    K --> L[Cron: process-queue]
    L --> M{Daily spend cap OK?}
    M -->|No| N[Pause queue]
    M -->|Yes| O[process-job → Replicate]
    O --> P{Result?}
    P -->|Success| Q[Sightengine moderation]
    P -->|Fail| R[Mark failed — $0 cost]
    Q -->|Clean| S[Completed + image URL]
    Q -->|NSFW| T[Ban / infringement log]
    S --> U[finalizeJobCost + usage credit]
  end

  subgraph Billing["💳 Billing"]
    F -.-> RC[RevenueCat SDK]
    RC --> WH["/api/webhooks/revenuecat"]
    WH --> DB2[(users + subscriptions)]
    DB2 --> D
  end

  subgraph Data["🗄️ Supabase"]
    K --> DB[(jobs)]
    U --> DB
    U --> UT[(usage_tracking)]
    U --> CT[(cost_tracking)]
    WH --> DB
    WH --> SH[(subscription_history)]
  end

  subgraph Admin["🖥️ Admin Dashboard"]
    AD[Admin login] --> API2["/api/admin"]
    API2 --> OV[Overview]
    API2 --> FIN[Finance — MRR, costs, trial spend]
    API2 --> GR[Growth — MAU, ARR, churn]
    API2 --> USR[Users / Jobs / Queue / Security]
    API2 --> DB
  end

  S --> GAL[Gallery / Result screen]
```

---

## Generation job lifecycle

Every image request becomes a **job** row in Supabase. The queue worker moves it through states.

```mermaid
stateDiagram-v2
  [*] --> pending: User taps Generate
  pending --> processing: Queue worker picks job
  processing --> completed: Replicate OK + moderation pass
  processing --> failed: API error / policy / timeout
  completed --> [*]: Cost recorded, quota +1
  failed --> [*]: Cost = $0
  failed --> pending: Admin retry
```

### Key files

| Step | File |
|------|------|
| Enqueue | `api/enqueue.ts` |
| Queue worker | `api/cron/process-queue.ts` |
| Replicate call | `api/_utils/process-job.ts` |
| Stuck-job recovery | `api/_utils/replicate-sync.ts` |
| NSFW / policy | `api/_utils/sightengine-moderation.ts` |
| Per-job cost | `api/_utils/job-cost.ts` |
| Usage quota | `api/_utils/usage.ts` |
| Daily spend cap | `api/_utils/cost-protection.ts` |

---

## User generation flow (step by step)

```mermaid
sequenceDiagram
  participant U as User
  participant App as Mobile App
  participant API as Vercel API
  participant DB as Supabase
  participant Q as process-queue
  participant R as Replicate
  participant SE as Sightengine

  U->>App: Pick style, upload photo
  App->>API: POST /api/enqueue
  API->>DB: Check quota (usage_tracking)
  API->>DB: INSERT job (pending)
  API-->>App: job id

  loop Poll or push
    App->>API: GET /api/job?id=…
    API->>DB: Read job status
    API-->>App: pending / processing
  end

  Q->>DB: Claim oldest pending job
  Q->>R: Run model (style → prompt + image)
  R-->>Q: output URL or error

  alt Success
    Q->>SE: Moderate output image
    SE-->>Q: pass / fail
    Q->>DB: status = completed
    Q->>DB: cost_usd, model_version, cost_tracking
    Q->>DB: usage_tracking +1
  else Failure
    Q->>DB: status = failed, cost_usd = 0
  end

  App->>API: GET /api/job?id=…
  API-->>App: completed + image URL
  App->>U: Result screen / save to DCIM/Funnyfy
```

---

## Money flow

```mermaid
flowchart LR
  subgraph In["Money in"]
    U[User pays] --> RC[RevenueCat]
    RC --> T5[Starter $5/mo]
    RC --> T10[Popular $10/mo]
    RC --> T25[Pro $25/mo]
  end

  subgraph Out["Money out"]
    J[Each completed gen] --> M{Model?}
    M -->|Flux / Seedream| C04[$0.04]
    M -->|Nano Banana| C039[$0.039]
    M -->|Nano Banana 2| C067[$0.067]
    M -->|Failed| C0[$0.00]
    C04 --> REP[Replicate bill]
    C067 --> REP
  end

  subgraph AdminMath["Admin dashboard"]
    T5 --> MRR[MRR estimate]
    T10 --> MRR
    T25 --> MRR
    MRR --> ARR[ARR = MRR × 12]
    C04 --> COST[Gen cost MTD]
    C067 --> COST
    MRR --> NET[Est. net ≈ MRR − costs]
    COST --> NET
  end
```

**Notes**

- MRR/ARR in admin are **estimates** from active subs × rounded tier prices ($5 / $10 / $25), not RevenueCat ledger reconciliation.
- Trial users generate cost but contribute **$0** subscription revenue (called out on Finance page).
- Failed jobs always cost **$0** (no Replicate charge recorded).

---

## Billing & subscription sync

```mermaid
flowchart LR
  App[Mobile App] --> RCSDK[RevenueCat SDK]
  RCSDK --> Stores[App Store / Play Store]
  Stores --> RC[RevenueCat]
  RC --> WH["/api/webhooks/revenuecat"]
  WH --> U[(users)]
  WH --> S[(subscriptions)]
  WH --> H[(subscription_history)]
  App --> Sync["/api/sync-subscription"]
  Sync --> U
```

| Event | What updates |
|-------|----------------|
| New purchase | `users.subscription_tier`, `subscription_status = active`, `subscriptions` row |
| Renewal | `subscription_history` renewed event, period dates |
| Cancel | `cancel_at_period_end`, `canceled_at`, history event |
| Expire | `subscription_status = expired` on user + subscription |
| Trial | `subscription_status = trial`, `trial_generations_used` capped at 3 |

---

## Admin dashboard

Served from `api/admin.ts` + `api/_utils/admin-pages/`.

| Menu | Resource | What it shows |
|------|----------|----------------|
| Overview | `stats`, `queue-stats` | Users, jobs, MRR snapshot, alerts |
| Finance | `finance` | MRR, costs MTD, tier economics, model costs, trial spend |
| Growth | `growth` | MAU, total users, MRR, ARR, churn + 6‑month trends |
| Users | `users` | Search, ban, quota, tier |
| Jobs | `jobs` | Retry, cancel, status |
| Queue | `queue-stats` | Pending/processing, spend vs cap |
| Moderation | `moderation` | Infringements |
| Security | `security-logs` | Auth / rate-limit events |

**URLs**

- Staging: `https://funnyfy-staging.vercel.app/admin/login`
- Production: `https://funnyfyapp.vercel.app/admin/login`

**Display currency:** USD/KES toggle converts money client-side using live Frankfurter rate (`api/_utils/exchange-rate.ts`).

---

## Who talks to whom

| Component | Role |
|-----------|------|
| **Mobile app** (`apps/mobile/`) | UI, camera, gallery, RevenueCat purchases |
| **Vercel API** (`api/`) | Auth, enqueue, queue worker, webhooks, admin |
| **Supabase** | Users, jobs, usage, costs, subscriptions |
| **Replicate** | AI image generation (Flux, Seedream, Nano Banana) |
| **Sightengine** | NSFW / content policy on outputs |
| **RevenueCat** | App Store / Play billing + webhooks |
| **Admin dashboard** | Ops, finance, growth metrics |

---

## Deploy flow

```mermaid
flowchart LR
  Dev[Local changes] --> Git[git push origin Staging]
  Git --> GH[GitHub]
  GH --> Vercel[Vercel build]
  Vercel --> Staging[funnyfy-staging.vercel.app]
  Staging --> Prod[funnyfyapp.vercel.app]
```

Typical staging deploy:

```bash
git push origin Staging
npx vercel deploy --prod --yes
```

DB schema changes are applied manually in the Supabase SQL editor (see `api/migrations-*.sql`).

---

## Mental model (one sentence each)

| Layer | In plain English |
|-------|------------------|
| **What users see** | Pick a style → upload → wait → funny image → gallery |
| **What the server does** | Queue the job, call Replicate safely, moderate, track cost & quota |
| **What billing does** | RevenueCat tells us who paid and which tier |
| **What admin does** | Lets you see money in, money out, users, and broken jobs |

The product feels simple. The **reliability + billing + ops** layer underneath is what makes it a real business.
