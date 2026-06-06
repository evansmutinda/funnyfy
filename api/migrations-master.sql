-- ============================================================
-- FunnyFy Master Database Migration
-- Run this in Supabase SQL Editor on a fresh database.
-- For existing databases, individual migration files may have
-- already applied some of these. Use IF NOT EXISTS safely.
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users table: One row per device/account
CREATE TABLE IF NOT EXISTS users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   VARCHAR(255) UNIQUE,
  revenuecat_user_id      VARCHAR(255) UNIQUE,
  subscription_tier       VARCHAR(20)  NOT NULL DEFAULT 'trial',  -- 'trial','starter','popular','pro'
  subscription_status     VARCHAR(20)  NOT NULL DEFAULT 'trial',  -- 'trial','active','canceled','expired'
  trial_generations_used  INTEGER      NOT NULL DEFAULT 0,
  billing_date            DATE         NOT NULL DEFAULT CURRENT_DATE,
  banned_at               TIMESTAMPTZ  DEFAULT NULL,              -- Non-null = banned
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.banned_at IS 'When set, user is banned. NULL = not banned.';

CREATE INDEX IF NOT EXISTS idx_users_revenuecat ON users(revenuecat_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revenuecat_subscription_id  VARCHAR(255) UNIQUE,
  platform                    VARCHAR(20)  NOT NULL,              -- 'ios','android','web'
  tier                        VARCHAR(20)  NOT NULL,              -- 'starter','popular','pro'
  status                      VARCHAR(20)  NOT NULL,              -- 'active','canceled','expired','trial'
  current_period_start        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  current_period_end          TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '1 month',
  cancel_at_period_end        BOOLEAN      NOT NULL DEFAULT FALSE,
  canceled_at                 TIMESTAMPTZ  DEFAULT NULL,
  pending_tier                VARCHAR(20)  DEFAULT NULL,          -- Tier to apply at next renewal
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN subscriptions.pending_tier IS 'Tier to apply at next period end or when usage depleted.';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Audit trail for subscription changes
CREATE TABLE IF NOT EXISTS subscription_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID         REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id          UUID         REFERENCES users(id) ON DELETE CASCADE,
  event_type       VARCHAR(50)  NOT NULL, -- 'created','renewed','canceled','upgraded','downgraded','expired'
  from_tier        VARCHAR(20),
  to_tier          VARCHAR(20),
  from_status      VARCHAR(20),
  to_status        VARCHAR(20),
  metadata         JSONB,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_user_id ON subscription_history(user_id);

-- ============================================================
-- USAGE TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month         DATE  NOT NULL,   -- First day of month: YYYY-MM-01
  count         INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage_tracking(user_id, month);

-- ============================================================
-- JOBS (Async generation queue)
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID         REFERENCES users(id) ON DELETE SET NULL,
  style_id                VARCHAR(50)  NOT NULL,
  status                  VARCHAR(20)  NOT NULL DEFAULT 'pending', -- 'pending','processing','completed','failed'
  priority                INTEGER      NOT NULL DEFAULT 1,          -- Higher = processed first (Pro=10, Popular=5, Starter=1)
  replicate_prediction_id VARCHAR(255),
  input_image_url         TEXT,
  output_image_url        TEXT,
  error_message           TEXT,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  started_at              TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================================
-- RATE LIMITS (IP-based burst protection)
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier     VARCHAR(255) NOT NULL,   -- IP address or user_id
  type           VARCHAR(20)  NOT NULL,   -- 'ip' or 'user'
  window_start   TIMESTAMPTZ  NOT NULL,
  request_count  INTEGER      NOT NULL DEFAULT 0,
  UNIQUE(identifier, type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, type, window_start);

-- Auto-cleanup: remove entries older than 1 hour (optional, can do via cron)
-- Entries older than 1 hour are never matched anyway.

-- ============================================================
-- COST TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS cost_tracking (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID         REFERENCES jobs(id) ON DELETE SET NULL,
  date           DATE         NOT NULL DEFAULT CURRENT_DATE,
  cost_usd       NUMERIC(10,6) NOT NULL DEFAULT 0,
  model_version  VARCHAR(255),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(date);

-- ============================================================
-- SECURITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS security_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(100) NOT NULL,
  user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  ip_address  VARCHAR(64),
  user_agent  VARCHAR(500),
  success     BOOLEAN      NOT NULL DEFAULT TRUE,
  details     JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address, created_at DESC);

-- ============================================================
-- CONTENT POLICY INFRINGEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS infringements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  infringement_type VARCHAR(50)  NOT NULL DEFAULT 'nsfw',
  details           JSONB,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infringements_user_id ON infringements(user_id);
CREATE INDEX IF NOT EXISTS idx_infringements_created_at ON infringements(user_id, created_at DESC);

-- ============================================================
-- ADMIN USERS (separate from app users)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'admin', -- 'admin','support','viewer'
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Active subscriptions with user info
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  u.id                  AS user_id,
  u.email,
  u.revenuecat_user_id,
  u.subscription_tier,
  u.subscription_status,
  s.platform,
  s.current_period_end,
  s.cancel_at_period_end
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.subscription_status = 'active';

-- Current month usage summary
CREATE OR REPLACE VIEW current_month_usage AS
SELECT
  u.id          AS user_id,
  u.subscription_tier,
  u.subscription_status,
  COALESCE(ut.count, 0) AS usage_count,
  CASE
    WHEN u.subscription_tier = 'pro'     THEN 250
    WHEN u.subscription_tier = 'popular' THEN 100
    WHEN u.subscription_tier = 'starter' THEN 50
    ELSE 3
  END AS quota_limit,
  ut.month
FROM users u
LEFT JOIN usage_tracking ut
  ON ut.user_id = u.id
  AND ut.month = DATE_TRUNC('month', NOW())::DATE;

-- Queue overview
CREATE OR REPLACE VIEW queue_overview AS
SELECT
  status,
  COUNT(*)                                           AS count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)))      AS avg_age_seconds,
  MIN(created_at)                                    AS oldest_job
FROM jobs
WHERE status IN ('pending','processing')
GROUP BY status;

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Run migrations-infringements.sql and migrations-pending-tier.sql
--    only if you already have an older schema (they use ALTER TABLE IF NOT EXISTS).
--    On a fresh DB, this master migration covers everything.
-- 2. Set DATABASE_URL in Vercel environment variables (Supabase connection string).
-- 3. Set JWT_SECRET in Vercel for auth token signing.
-- 4. Set CRON_SECRET in Vercel to secure the queue processor cron endpoint.
-- 5. Set DAILY_SPENDING_CAP (default 100 = $100/day) to limit Replicate costs.
