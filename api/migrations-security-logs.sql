-- Security logs table for tracking security events
-- Tracks authentication attempts, rate limit hits, webhook events, etc.

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45), -- IPv6 can be up to 45 chars
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB, -- Additional event details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_success ON security_logs(success);

-- Index for querying recent failed attempts (for security monitoring)
CREATE INDEX IF NOT EXISTS idx_security_logs_failed_recent ON security_logs(created_at, success) 
  WHERE success = false;

-- Comments for documentation
COMMENT ON TABLE security_logs IS 'Security event logs for monitoring and auditing';
COMMENT ON COLUMN security_logs.event_type IS 'Type of security event (e.g., auth_failed, rate_limit_exceeded, webhook_received)';
COMMENT ON COLUMN security_logs.success IS 'Whether the event was successful or not';
COMMENT ON COLUMN security_logs.details IS 'Additional event details stored as JSON';

