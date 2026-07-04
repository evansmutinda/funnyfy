-- Per-job generation cost (run on Supabase SQL editor)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS model_version VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_tracking_job_id_unique
  ON cost_tracking(job_id) WHERE job_id IS NOT NULL;
