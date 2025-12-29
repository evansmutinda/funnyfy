-- Cost tracking table for monitoring Replicate API spending
-- Tracks cost per job and daily totals

CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  date DATE NOT NULL, -- Date of the cost (YYYY-MM-DD)
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0, -- Cost in USD
  model_version VARCHAR(255), -- Which model was used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(date);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_job_id ON cost_tracking(job_id);

-- View for daily cost totals
CREATE OR REPLACE VIEW daily_cost_summary AS
SELECT 
  date,
  COUNT(*) as job_count,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_usd
FROM cost_tracking
GROUP BY date
ORDER BY date DESC;

-- Comments for documentation
COMMENT ON TABLE cost_tracking IS 'Tracks Replicate API costs per job for cost protection and monitoring';
COMMENT ON COLUMN cost_tracking.cost_usd IS 'Estimated cost in USD (based on model pricing)';
COMMENT ON COLUMN cost_tracking.model_version IS 'Replicate model version used (for cost calculation)';

