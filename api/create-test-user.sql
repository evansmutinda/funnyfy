-- Create test user for APK testing
-- This creates a user with id = UUID and revenuecat_user_id = 'test-user-123'
-- Run this SQL in your database

-- Create new user with UUID ID and revenuecat_user_id
-- The UUID matches TEST_USER_ID in App.js: '550e8400-e29b-41d4-a716-446655440000'
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
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- UUID format (matches TEST_USER_ID in App.js)
  'test-user-123',  -- For RevenueCat SDK (matches TEST_USER_ID_REVENUECAT)
  'trial',          -- Start as trial user
  'trial',
  0,                -- No generations used yet
  CURRENT_DATE,
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  revenuecat_user_id = COALESCE(EXCLUDED.revenuecat_user_id, users.revenuecat_user_id),
  subscription_status = COALESCE(EXCLUDED.subscription_status, users.subscription_status),
  trial_generations_used = COALESCE(EXCLUDED.trial_generations_used, users.trial_generations_used),
  updated_at = NOW();

-- Also handle conflict on revenuecat_user_id if it's unique
-- (Adjust based on your schema - if revenuecat_user_id has unique constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE revenuecat_user_id = 'test-user-123'
  ) THEN
    -- User with this revenuecat_user_id doesn't exist, so update the one we just created
    UPDATE users 
    SET revenuecat_user_id = 'test-user-123'
    WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
  END IF;
END $$;

-- Verify the user was created
SELECT 
  id,
  revenuecat_user_id,
  subscription_tier,
  subscription_status,
  trial_generations_used,
  billing_date,
  created_at
FROM users
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid
   OR revenuecat_user_id = 'test-user-123';

