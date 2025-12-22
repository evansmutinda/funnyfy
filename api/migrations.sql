-- FunnyFy initial database schema
-- Target: Vercel Postgres
-- Run this against your Vercel Postgres database (for example via
-- the Vercel dashboard SQL editor, psql, or a migration tool).

-- Enable UUID generation extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  subscription_tier VARCHAR(20) NOT NULL,   -- 'starter', 'popular', 'pro', 'trial'
  subscription_status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired', 'trial'
  billing_date DATE NOT NULL,               -- when monthly quota resets
  trial_generations_used INTEGER DEFAULT 0,  -- count of free trial generations used (max 3)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  month DATE NOT NULL, -- first day of month (YYYY-MM-01)
  count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT usage_tracking_user_month UNIQUE (user_id, month)
);

-- jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  style_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'queued', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 0,  -- Pro = 10, Popular = 5, Starter = 1
  replicate_prediction_id VARCHAR(255),
  input_image_url TEXT,
  output_image_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_priority
  ON jobs (status, priority DESC, created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id
  ON jobs (user_id);

-- rate_limits table (optional, for IP/user-based rate limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- IP address or user_id
  type VARCHAR(20) NOT NULL,        -- 'ip' or 'user'
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  CONSTRAINT rate_limits_unique_window UNIQUE (identifier, type, window_start)
);

