-- Test user for Expo/APK testing (matches TEST_USER_ID in apps/mobile/App.js)
-- Run in Supabase SQL Editor

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
  subscription_tier = COALESCE(EXCLUDED.subscription_tier, users.subscription_tier),
  subscription_status = COALESCE(EXCLUDED.subscription_status, users.subscription_status),
  trial_generations_used = COALESCE(EXCLUDED.trial_generations_used, users.trial_generations_used),
  updated_at = NOW();
