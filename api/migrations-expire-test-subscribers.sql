-- Expire every paid row except the production subscriber.
-- Run this whole script in the Supabase SQL editor.
-- The last statement must return 28 rows.

UPDATE subscriptions
SET status = 'expired', updated_at = NOW()
WHERE status = 'active'
  AND user_id <> '51f5ff4e-e3c7-47c7-8b90-e8f97f486c57';

UPDATE users
SET subscription_status = 'expired', updated_at = NOW()
WHERE subscription_status = 'active'
  AND subscription_tier IN ('starter', 'popular', 'pro')
  AND id <> '51f5ff4e-e3c7-47c7-8b90-e8f97f486c57'
RETURNING id, subscription_tier;
