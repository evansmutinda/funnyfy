# Throttle and Queue Handling - Architectural Plan

**Status**: Planning  
**Priority**: High (Required for Launch)  
**Last Updated**: January 2025

---

## Overview

This document outlines the architecture for implementing throttle and queue handling to manage API usage, enforce subscription quotas, and protect against cost overruns.

---

## Objectives

1. **Enforce Subscription Quotas**: Limit users to their tier limits (50/100/250 per month)
2. **Rate Limiting**: Prevent abuse and burst traffic
3. **Queue Management**: Handle high traffic gracefully
4. **Cost Protection**: Prevent unexpected API costs
5. **Priority Processing**: Pro users get faster processing

---

## Architecture Components

### 1. Database Schema

#### `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  subscription_tier VARCHAR(20) NOT NULL, -- 'starter', 'popular', 'pro'
  subscription_status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired'
  billing_date DATE NOT NULL, -- When monthly quota resets
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `usage_tracking` Table
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  month DATE NOT NULL, -- First day of month (YYYY-MM-01)
  count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);
```

#### `jobs` Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  style_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'queued', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 0, -- Higher = more priority (Pro users = 10, Popular = 5, Starter = 1)
  replicate_prediction_id VARCHAR(255),
  input_image_url TEXT,
  output_image_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_status_priority (status, priority, created_at),
  INDEX idx_user_id (user_id)
);
```

#### `rate_limits` Table (Optional - for IP-based limiting)
```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- IP address or user_id
  type VARCHAR(20) NOT NULL, -- 'ip' or 'user'
  window_start TIMESTAMP NOT NULL,
  request_count INTEGER DEFAULT 0,
  UNIQUE(identifier, type, window_start)
);
```

---

## Implementation Flow

### Request Processing Flow

```
1. User Request → API Endpoint
2. Authenticate User (get user_id)
3. Check Quota (query usage_tracking)
   ├─ If quota exceeded → Return 429 (Too Many Requests)
   └─ If within quota → Continue
4. Check Rate Limit (per hour)
   ├─ If rate limit exceeded → Return 429 with retry-after
   └─ If within limit → Continue
5. Create Job Record (status: 'pending')
6. Add to Queue (priority-based)
7. Return Job ID to Client
8. Process Queue (background worker)
9. Update Usage Counter (after completion)
```

---

## Throttle Strategy

### Per-User Quota Limits

| Tier | Monthly Quota | Hourly Burst Limit | Daily Burst Limit |
|------|--------------|-------------------|-------------------|
| Starter | 50/month | 10/hour | 20/day |
| Popular | 100/month | 20/hour | 40/day |
| Pro | 250/month | 50/hour | 100/day |

### Implementation Logic

```typescript
// Pseudo-code for quota check
async function checkQuota(userId: string, tier: string): Promise<boolean> {
  const currentMonth = getCurrentMonth(); // YYYY-MM-01
  const usage = await db.query(`
    SELECT count FROM usage_tracking 
    WHERE user_id = $1 AND month = $2
  `, [userId, currentMonth]);
  
  const quota = getQuotaForTier(tier); // 50, 100, or 250
  return usage.count < quota;
}
```

### Rate Limiting (Per Hour)

```typescript
// Rate limit check (sliding window)
async function checkRateLimit(userId: string, tier: string): Promise<boolean> {
  const windowStart = getCurrentHour(); // Round to hour
  const limit = getHourlyLimitForTier(tier); // 10, 20, or 50
  
  const count = await db.query(`
    SELECT COUNT(*) FROM jobs
    WHERE user_id = $1 
    AND created_at >= $2
  `, [userId, windowStart]);
  
  return count < limit;
}
```

---

## Queue Management

### Priority System

- **Pro Users**: Priority = 10 (processed first)
- **Popular Users**: Priority = 5 (processed second)
- **Starter Users**: Priority = 1 (processed last)

### Queue Processing Strategy

#### Option 1: Database-Based Queue (Recommended for Start)
```typescript
// Get next job from queue
async function getNextJob(): Promise<Job | null> {
  const job = await db.query(`
    SELECT * FROM jobs
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `);
  
  if (job) {
    await db.query(`
      UPDATE jobs SET status = 'queued', started_at = NOW()
      WHERE id = $1
    `, [job.id]);
  }
  
  return job;
}
```

#### Option 2: Redis Queue (For Scale)
- Use BullMQ or similar
- Better performance at high volume
- More complex setup

### Concurrent Processing Limits

- **Max Concurrent Jobs**: 10-20 (configurable)
- **Per-User Concurrent**: 1 (prevent duplicate charges)
- **Global Rate**: Monitor total API costs

---

## Cost Protection

### Daily Spending Cap

```typescript
// Check daily spending
async function checkDailySpending(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const dailyCap = parseFloat(process.env.DAILY_SPENDING_CAP || '100');
  
  const spent = await db.query(`
    SELECT COUNT(*) * 0.04 as total_cost
    FROM jobs
    WHERE DATE(created_at) = $1
    AND status IN ('processing', 'completed')
  `, [today]);
  
  return spent.total_cost < dailyCap;
}
```

### Alerts

- Email/Slack alert if daily cap > 80%
- Pause queue if cap exceeded
- Admin dashboard shows real-time spending

---

## API Endpoints

### POST /api/generate
```typescript
// Request
{
  styleId: string,
  imageUrl: string
}

// Response (if quota OK)
{
  ok: true,
  jobId: string,
  status: 'pending',
  queuePosition: number,
  estimatedWaitTime: number // seconds
}

// Response (if quota exceeded)
{
  ok: false,
  error: 'QUOTA_EXCEEDED',
  message: 'You have used 50/50 images this month. Upgrade to continue.',
  upgradeUrl: string
}
```

### GET /api/job/:jobId
```typescript
// Response
{
  ok: true,
  job: {
    id: string,
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed',
    queuePosition?: number,
    outputUrl?: string,
    error?: string
  }
}
```

### GET /api/usage
```typescript
// Response
{
  ok: true,
  usage: {
    current: number,
    limit: number,
    resetDate: string, // ISO date
    tier: string
  }
}
```

---

## Background Worker

### Vercel Cron Job (Recommended)

```typescript
// api/cron/process-queue.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Run every 5 seconds
  const maxConcurrent = 10;
  const activeJobs = await getActiveJobCount();
  
  if (activeJobs >= maxConcurrent) {
    return res.json({ ok: true, message: 'Queue full' });
  }
  
  const job = await getNextJob();
  if (!job) {
    return res.json({ ok: true, message: 'No jobs in queue' });
  }
  
  // Process job
  await processJob(job);
  
  return res.json({ ok: true });
}
```

### Alternative: External Worker Service

- **Inngest**: Serverless background jobs
- **Trigger.dev**: Open-source alternative
- **AWS Lambda**: If migrating from Vercel

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Queue Depth**: Number of pending jobs
2. **Average Wait Time**: Time from creation to start
3. **Processing Time**: Time from start to completion
4. **Quota Usage**: Per tier, per user
5. **Rate Limit Hits**: How often limits are hit
6. **Cost Per Day**: Total API costs

### Dashboard Queries

```sql
-- Queue depth
SELECT COUNT(*) FROM jobs WHERE status = 'pending';

-- Average wait time
SELECT AVG(EXTRACT(EPOCH FROM (started_at - created_at))) 
FROM jobs 
WHERE started_at IS NOT NULL;

-- Quota usage by tier
SELECT 
  u.subscription_tier,
  COUNT(j.id) as total_jobs,
  AVG(ut.count) as avg_usage
FROM users u
LEFT JOIN jobs j ON u.id = j.user_id
LEFT JOIN usage_tracking ut ON u.id = ut.user_id
GROUP BY u.subscription_tier;
```

---

## Error Handling

### Quota Exceeded
- Return 429 status code
- Clear error message
- Upgrade prompt

### Rate Limit Exceeded
- Return 429 with `Retry-After` header
- Show user when they can try again

### Queue Full
- Return 503 (Service Unavailable)
- Show estimated wait time
- Suggest trying later

---

## Implementation Phases

### Phase 1: Basic Quota System (Week 1)
- [ ] Database schema setup
- [ ] Basic quota checking
- [ ] Usage tracking
- [ ] Simple queue (database-based)

### Phase 2: Rate Limiting (Week 2)
- [ ] Hourly rate limits
- [ ] IP-based limiting (optional)
- [ ] Burst protection

### Phase 3: Priority Queue (Week 3)
- [ ] Priority-based processing
- [ ] Queue position tracking
- [ ] Estimated wait times

### Phase 4: Cost Protection (Week 4)
- [ ] Daily spending caps
- [ ] Alerts and monitoring
- [ ] Admin dashboard integration

---

## Testing Strategy

### Unit Tests
- Quota checking logic
- Rate limit calculations
- Priority sorting

### Integration Tests
- End-to-end request flow
- Queue processing
- Usage counter updates

### Load Tests
- Simulate 1000 concurrent requests
- Test queue behavior under load
- Verify cost protection

---

## Security Considerations

1. **User Authentication**: All requests must be authenticated
2. **SQL Injection**: Use parameterized queries
3. **Race Conditions**: Use database locks (FOR UPDATE SKIP LOCKED)
4. **Quota Bypass**: All checks must be server-side
5. **Rate Limit Bypass**: Use server-side rate limiting only

---

## Performance Optimization

1. **Database Indexes**: On (user_id, month), (status, priority)
2. **Caching**: Cache quota checks (Redis) for 1 minute
3. **Batch Updates**: Update usage counters in batches
4. **Connection Pooling**: Use connection pool for database

---

## Future Enhancements

1. **Redis Queue**: Migrate to Redis for better performance
2. **Webhooks**: Notify users when job completes
3. **Smart Queue**: Predict wait times based on historical data
4. **Auto-Scaling**: Scale workers based on queue depth

---

## References

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Next Steps**: Review and approve, then begin Phase 1 implementation.
