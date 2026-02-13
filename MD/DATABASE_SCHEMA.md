# FunnyFy Database Schema

PostgreSQL schema for FunnyFy (Supabase / Vercel Postgres). Run migrations in order.

---

## Migration order

1. `api/migrations.sql` — Base schema
2. `api/migrations-subscriptions.sql` — Subscriptions (RevenueCat)
3. `api/migrations-cost-tracking.sql` — Cost tracking
4. `api/migrations-security-logs.sql` — Security logs
5. `api/migrations-infringements.sql` — Infringements + user bans
6. `api/migrations-pending-tier.sql` — Pending tier for deferred plan changes

---

## Tables overview

| Table | Purpose |
|------|---------|
| `users` | User accounts, subscription tier, trial usage, banned_at |
| `infringements` | Content policy violations (NSFW); multiple → ban |
| `usage_tracking` | Monthly generation counts per user |
| `jobs` | Image generation jobs (queue) |
| `subscriptions` | Active subscriptions (RevenueCat sync) |
| `subscription_history` | Subscription event audit trail |
| `cost_tracking` | Replicate API cost per job |
| `rate_limits` | IP/user rate limiting |
| `security_logs` | Auth, rate limit, webhook events |

---

## users

Stores user accounts, subscription info, and trial usage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | User ID (used in `x-user-id` header) |
| `email` | VARCHAR(255) | UNIQUE | Optional email |
| `subscription_tier` | VARCHAR(20) | NOT NULL | `starter`, `popular`, `pro`, `trial` |
| `subscription_status` | VARCHAR(20) | NOT NULL | `active`, `canceled`, `expired`, `trial` |
| `billing_date` | DATE | NOT NULL | Monthly quota reset date |
| `trial_generations_used` | INTEGER | DEFAULT 0 | Free trial generations used (max 3) |
| `revenuecat_user_id` | VARCHAR(255) | UNIQUE | RevenueCat app user ID |
| `banned_at` | TIMESTAMPTZ | NULL | When set, user is banned from the app |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `idx_users_revenuecat_user_id` on `revenuecat_user_id`

---

## infringements

Content policy violations (e.g. NSFW detected by Sightengine). After `INFRINGEMENT_BAN_THRESHOLD` violations, user is banned.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | REFERENCES users(id) ON DELETE CASCADE | |
| `infringement_type` | VARCHAR(50) | NOT NULL, DEFAULT 'nsfw' | |
| `details` | JSONB | | e.g. nudity scores |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `idx_infringements_user_id`, `idx_infringements_created_at` on `(user_id, created_at DESC)`

---

## usage_tracking

Tracks monthly generation counts per user for quota enforcement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | REFERENCES users(id) | |
| `month` | DATE | NOT NULL | First day of month (YYYY-MM-01) |
| `count` | INTEGER | DEFAULT 0 | Generations used this month |
| `last_reset_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(user_id, month)`

---

## jobs

Image generation jobs (queue).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Job ID |
| `user_id` | UUID | REFERENCES users(id) | |
| `style_id` | VARCHAR(50) | NOT NULL | Style identifier |
| `status` | VARCHAR(20) | NOT NULL | `pending`, `queued`, `processing`, `completed`, `failed` |
| `priority` | INTEGER | DEFAULT 0 | Pro=10, Popular=5, Starter=1 |
| `replicate_prediction_id` | VARCHAR(255) | | Replicate API prediction ID |
| `input_image_url` | TEXT | | |
| `output_image_url` | TEXT | | |
| `error_message` | TEXT | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `started_at` | TIMESTAMPTZ | | |
| `completed_at` | TIMESTAMPTZ | | |

**Indexes:**  
- `idx_jobs_status_priority` on `(status, priority DESC, created_at)`  
- `idx_jobs_user_id` on `user_id`

---

## subscriptions

Active subscriptions synced from RevenueCat webhooks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `user_id` | UUID | REFERENCES users(id) | |
| `revenuecat_subscription_id` | VARCHAR(255) | UNIQUE | RevenueCat subscription ID |
| `platform` | VARCHAR(20) | NOT NULL | `ios`, `android`, `web` |
| `tier` | VARCHAR(20) | NOT NULL | `starter`, `popular`, `pro` |
| `status` | VARCHAR(20) | NOT NULL | `active`, `canceled`, `expired`, `trial` |
| `current_period_start` | TIMESTAMPTZ | NOT NULL | |
| `current_period_end` | TIMESTAMPTZ | NOT NULL | |
| `cancel_at_period_end` | BOOLEAN | DEFAULT FALSE | |
| `pending_tier` | VARCHAR(20) | NULL | Tier to apply at next period end or usage depletion |
| `canceled_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**  
- `idx_subscriptions_user_id` on `user_id`  
- `idx_subscriptions_status` on `status`  
- `idx_subscriptions_revenuecat_id` on `revenuecat_subscription_id`

---

## subscription_history

Audit trail for subscription changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `subscription_id` | UUID | REFERENCES subscriptions(id) | |
| `user_id` | UUID | REFERENCES users(id) | |
| `event_type` | VARCHAR(50) | NOT NULL | `created`, `renewed`, `canceled`, `upgraded`, `downgraded` |
| `from_tier` | VARCHAR(20) | | |
| `to_tier` | VARCHAR(20) | | |
| `from_status` | VARCHAR(20) | | |
| `to_status` | VARCHAR(20) | | |
| `metadata` | JSONB | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**  
- `idx_subscription_history_user_id` on `user_id`  
- `idx_subscription_history_subscription_id` on `subscription_id`

---

## cost_tracking

Replicate API cost per job for monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `job_id` | UUID | REFERENCES jobs(id) ON DELETE SET NULL | |
| `date` | DATE | NOT NULL | Cost date (YYYY-MM-DD) |
| `cost_usd` | DECIMAL(10,4) | NOT NULL, DEFAULT 0 | Cost in USD |
| `model_version` | VARCHAR(255) | | Replicate model version |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**  
- `idx_cost_tracking_date` on `date`  
- `idx_cost_tracking_job_id` on `job_id`

**View:** `daily_cost_summary` — daily totals (job_count, total_cost_usd, avg_cost_usd)

---

## rate_limits

IP/user rate limiting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `identifier` | VARCHAR(255) | NOT NULL | IP or user_id |
| `type` | VARCHAR(20) | NOT NULL | `ip` or `user` |
| `window_start` | TIMESTAMPTZ | NOT NULL | |
| `request_count` | INTEGER | DEFAULT 0 | |

**Unique constraint:** `(identifier, type, window_start)`

---

## security_logs

Security event logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `event_type` | VARCHAR(100) | NOT NULL | e.g. `auth_failed`, `rate_limit_exceeded` |
| `user_id` | UUID | REFERENCES users(id) ON DELETE SET NULL | |
| `ip_address` | VARCHAR(45) | | |
| `user_agent` | TEXT | | |
| `success` | BOOLEAN | NOT NULL | |
| `details` | JSONB | | Extra event data |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**  
- `idx_security_logs_event_type`, `idx_security_logs_user_id`, `idx_security_logs_ip_address`  
- `idx_security_logs_created_at`, `idx_security_logs_success`  
- `idx_security_logs_failed_recent` (partial, WHERE success = false)

---

## Entity relationships

```
users
  ├── usage_tracking (user_id)
  ├── jobs (user_id)
  ├── subscriptions (user_id)
  ├── subscription_history (user_id)
  └── security_logs (user_id)

subscriptions
  └── subscription_history (subscription_id)

jobs
  └── cost_tracking (job_id)
```

---

## Test user (Expo/APK testing)

Create a test user so the app can call the API:

```sql
INSERT INTO users (
  id, revenuecat_user_id, subscription_tier, subscription_status,
  trial_generations_used, billing_date, created_at, updated_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test-user-123',
  'trial',
  'trial',
  0,
  CURRENT_DATE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  revenuecat_user_id = COALESCE(EXCLUDED.revenuecat_user_id, users.revenuecat_user_id),
  subscription_status = COALESCE(EXCLUDED.subscription_status, users.subscription_status),
  trial_generations_used = COALESCE(EXCLUDED.trial_generations_used, users.trial_generations_used),
  updated_at = NOW();
```

This matches `TEST_USER_ID` in `apps/mobile/App.js`.

---

**See also:** `api/create-test-user.sql`, `api/migrations*.sql`
