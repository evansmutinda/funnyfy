-- FunnyFy Supabase Setup - Run this in Supabase SQL Editor
-- Copy everything below and paste into SQL Editor, then click Run

-- ============================================
-- 1. Base schema (migrations.sql)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  subscription_tier VARCHAR(20) NOT NULL,
  subscription_status VARCHAR(20) NOT NULL,
  billing_date DATE NOT NULL,
  trial_generations_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  month DATE NOT NULL,
  count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT usage_tracking_user_month UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  style_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 0,
  replicate_prediction_id VARCHAR(255),
  input_image_url TEXT,
  output_image_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON jobs (status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs (user_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  CONSTRAINT rate_limits_unique_window UNIQUE (identifier, type, window_start)
);

-- ============================================
-- 2. Subscriptions (migrations-subscriptions.sql)
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS revenuecat_user_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_revenuecat_user_id ON users (revenuecat_user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  revenuecat_subscription_id VARCHAR(255) UNIQUE,
  platform VARCHAR(20) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_revenuecat_id ON subscriptions (revenuecat_subscription_id);

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  from_tier VARCHAR(20),
  to_tier VARCHAR(20),
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history (user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history (subscription_id);

-- ============================================
-- 3. Test user (for Expo/APK testing)
-- ============================================
INSERT INTO users (
  id,
  revenuecat_user_id,
  subscription_tier,
  subscription_status,
  trial_generations_used,
  billing_date,
  created_at,
  updated_at
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
