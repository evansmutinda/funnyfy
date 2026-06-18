-- Idempotent per-job usage credits (prevents double-count when queue workers race)

CREATE TABLE IF NOT EXISTS job_usage_credits (
  job_id      UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  credited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_usage_credits_credited_at ON job_usage_credits(credited_at DESC);
