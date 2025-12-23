-- Subscription handling schema additions
-- Run this after the base migrations.sql

-- Add RevenueCat user ID to users table (if not already added)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS revenuecat_user_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_revenuecat_user_id 
ON users (revenuecat_user_id);

-- subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  revenuecat_subscription_id VARCHAR(255) UNIQUE,
  platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  tier VARCHAR(20) NOT NULL, -- 'starter', 'popular', 'pro'
  status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired', 'trial'
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_revenuecat_id 
ON subscriptions (revenuecat_subscription_id);

-- subscription_history table (audit trail)
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL, -- 'created', 'renewed', 'canceled', 'upgraded', 'downgraded'
  from_tier VARCHAR(20),
  to_tier VARCHAR(20),
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id 
ON subscription_history (user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id 
ON subscription_history (subscription_id);
