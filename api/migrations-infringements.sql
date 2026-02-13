-- Infringements table + user ban support
-- Run in Supabase SQL Editor

-- 1. Add banned_at to users (when set, user is banned from the app)
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ DEFAULT NULL;
COMMENT ON COLUMN users.banned_at IS 'When set, user is banned. NULL = not banned.';

-- 2. Create infringements table (content policy violations, e.g. NSFW)
CREATE TABLE IF NOT EXISTS infringements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  infringement_type VARCHAR(50) NOT NULL DEFAULT 'nsfw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_infringements_user_id ON infringements(user_id);
CREATE INDEX IF NOT EXISTS idx_infringements_created_at ON infringements(user_id, created_at DESC);

COMMENT ON TABLE infringements IS 'Content policy violations (NSFW, etc.). Multiple violations may trigger user ban.';
