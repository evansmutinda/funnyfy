-- Pending tier for deferred subscription changes (upgrade/downgrade takes effect next cycle or on usage depletion)
-- Run in Supabase SQL Editor

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pending_tier VARCHAR(20) DEFAULT NULL;
COMMENT ON COLUMN subscriptions.pending_tier IS 'Tier to apply at next period end or when usage depleted. NULL = no pending change.';
