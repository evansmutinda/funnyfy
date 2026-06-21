# Production Testing Checklist

**Purpose**: Comprehensive testing checklist before production launch  
**Last Updated**: May 2026  
**Status**: Feature-complete; awaiting app store submission

---

## 🔐 Pre-Testing Setup

### Environment Configuration
- [ ] All production environment variables configured in Vercel
  - [ ] `DATABASE_URL` (production database)
  - [ ] `JWT_SECRET` (strong secret)
  - [ ] `ADMIN_JWT_SECRET` (different from user JWT)
  - [ ] `REPLICATE_API_TOKEN`
  - [ ] `REVENUECAT_API_KEY`
  - [ ] `REVENUECAT_WEBHOOK_SECRET`
  - [ ] `CRON_SECRET` (for queue processing cron)
  - [ ] `MAX_CONCURRENT_JOBS` (default: 10)
  - [ ] `DAILY_SPENDING_CAP` (cost protection limit)
  - [ ] CORS origins (production app URLs)
- [ ] Database migrations applied to production
  - [ ] Core migrations (`migrations.sql`)
  - [ ] Subscription migrations (`migrations-subscriptions.sql`)
  - [ ] Security logs migrations (`migrations-security-logs.sql`)
  - [ ] Cost tracking migrations (`migrations-cost-tracking.sql`)
- [ ] Admin user created in production database
- [ ] RevenueCat webhook URL configured and tested
- [ ] External cron configured at [cron-job.org](https://cron-job.org/) — `GET /api/cron/process-queue` with `Authorization: Bearer <CRON_SECRET>` (recommend every 1 minute)

---

## 💳 Subscription System Testing

### Real App Store Purchases
- [ ] **iOS Purchase Flow**
  - [ ] Create test user account
  - [ ] Make real purchase via App Store (TestFlight or production)
  - [ ] Verify webhook receives `INITIAL_PURCHASE` event
  - [ ] Verify user subscription status updated in database
  - [ ] Verify user can generate images immediately after purchase
  - [ ] Check subscription sync endpoint returns correct status
- [ ] **Android Purchase Flow**
  - [ ] Create test user account
  - [ ] Make real purchase via Google Play Store
  - [ ] Verify webhook receives `INITIAL_PURCHASE` event
  - [ ] Verify user subscription status updated in database
  - [ ] Verify user can generate images immediately after purchase
  - [ ] Check subscription sync endpoint returns correct status

### Subscription Tiers
- [ ] **Starter Tier ($5/month, 50 images)**
  - [ ] Purchase Starter subscription
  - [ ] Verify quota is 50/month
  - [ ] Generate 50 images (verify quota tracking)
  - [ ] Attempt 51st generation (should fail with quota exceeded)
  - [ ] Verify correct error message displayed
- [ ] **Popular Tier ($10/month, 100 images)**
  - [ ] Purchase Popular subscription
  - [ ] Verify quota is 100/month
  - [ ] Generate 100 images (verify quota tracking)
  - [ ] Attempt 101st generation (should fail)
- [ ] **Pro Tier ($25/month, 250 images)**
  - [ ] Purchase Pro subscription
  - [ ] Verify quota is 250/month
  - [ ] Verify priority-based queue processing (should be faster)
  - [ ] Generate 250 images (verify quota tracking)

### Subscription Lifecycle
- [ ] **Cancellation Flow**
  - [ ] Cancel active subscription
  - [ ] Verify webhook receives `CANCELLATION` event
  - [ ] Verify `cancel_at_period_end` flag set
  - [ ] Verify user retains access until period end
  - [ ] Verify user cannot renew after expiration
- [ ] **Renewal Flow**
  - [ ] Wait for subscription renewal (or simulate)
  - [ ] Verify webhook receives `RENEWAL` event
  - [ ] Verify billing date updated
  - [ ] Verify quota reset for new billing period
  - [ ] Verify usage tracking reset
- [ ] **Expiration Flow**
  - [ ] Let subscription expire
  - [ ] Verify webhook receives `EXPIRATION` event
  - [ ] Verify subscription status set to 'expired'
  - [ ] Verify user cannot generate images
  - [ ] Verify correct error message displayed
- [ ] **Uncancellation Flow** (if applicable)
  - [ ] Cancel subscription, then reactivate before period end
  - [ ] Verify webhook receives `UNCANCELLATION` event
  - [ ] Verify subscription remains active

### Trial Users
- [ ] **Trial Limit (3 free generations)**
  - [ ] Create new user (no subscription)
  - [ ] Verify trial status
  - [ ] Generate 3 images (should work)
  - [ ] Attempt 4th generation (should fail with trial expired)
  - [ ] Verify subscription prompt shown
- [ ] **Trial to Paid Conversion**
  - [ ] Use all 3 trial generations
  - [ ] Purchase subscription
  - [ ] Verify quota switches from trial to tier quota
  - [ ] Verify monthly quota works correctly

### Webhook Reliability
- [ ] **Webhook Signature Verification**
  - [ ] Send webhook without auth header (should fail)
  - [ ] Send webhook with wrong secret (should fail)
  - [ ] Send webhook with correct secret (should succeed)
- [ ] **Idempotency**
  - [ ] Send same webhook event twice
  - [ ] Verify second event is ignored (no duplicate processing)
  - [ ] Check subscription_history table for duplicates
- [ ] **Webhook Error Handling**
  - [ ] Send malformed webhook payload (should fail gracefully)
  - [ ] Send webhook for non-existent user (should handle gracefully)
  - [ ] Check security logs for webhook errors

---

## 🎯 Queue System Testing

### Queue Processing
- [ ] **Basic Queue Functionality**
  - [ ] Enqueue multiple jobs (different tiers)
  - [ ] Verify jobs are created with status 'pending'
  - [ ] Verify cron job processes jobs correctly
  - [ ] Verify jobs move from 'pending' → 'processing' → 'completed'
  - [ ] Check queue stats endpoint shows correct counts
- [ ] **Priority-Based Processing**
  - [ ] Enqueue jobs with different priorities (1, 5, 10)
  - [ ] Verify Pro tier (priority 10) processes first
  - [ ] Verify Popular tier (priority 5) processes before Starter (priority 1)
  - [ ] Verify same-priority jobs process FIFO (oldest first)
- [ ] **Concurrent Job Limits**
  - [ ] Enqueue 15 jobs (exceeds MAX_CONCURRENT_JOBS = 10)
  - [ ] Verify only 10 process concurrently
  - [ ] Verify remaining jobs wait in queue
  - [ ] Verify jobs start processing as slots become available
- [ ] **Queue Position Tracking**
  - [ ] Enqueue job and verify queuePosition returned
  - [ ] Verify queuePosition decreases as jobs ahead process
  - [ ] Verify queuePosition is accurate (check via `/api/job?id=xxx`)
- [ ] **Estimated Wait Time**
  - [ ] Enqueue job and verify estimatedWaitTime returned
  - [ ] Verify wait time calculation is reasonable
  - [ ] Verify wait time updates as queue position changes

### Queue Under Load
- [ ] **High Volume Test**
  - [ ] Enqueue 50+ jobs simultaneously
  - [ ] Verify queue processes jobs correctly
  - [ ] Verify no jobs are lost
  - [ ] Verify priority order maintained
  - [ ] Check processing times and queue depth
- [ ] **Mixed Tier Load**
  - [ ] Enqueue mix of Starter, Popular, and Pro jobs
  - [ ] Verify Pro jobs complete before others
  - [ ] Verify fair processing within same tier
- [ ] **Queue Recovery**
  - [ ] Stop queue processing (pause cron)
  - [ ] Enqueue several jobs
  - [ ] Resume queue processing
  - [ ] Verify all pending jobs eventually process

---

## 🛡️ Rate Limiting Testing

### Tier-Based Rate Limits
- [ ] **Burst Protection**
  - [ ] Make rapid requests (e.g., 10 in 1 second)
  - [ ] Verify burst protection triggers (429 response)
  - [ ] Verify different tiers have appropriate burst limits
- [ ] **Daily Rate Limits**
  - [ ] Generate images up to daily limit
  - [ ] Verify requests succeed until limit reached
  - [ ] Verify 429 response when limit exceeded
  - [ ] Verify limit resets at midnight UTC
- [ ] **IP-Based Rate Limiting**
  - [ ] Make requests from same IP rapidly
  - [ ] Verify IP rate limit triggers
  - [ ] Verify different IPs have separate limits

### Rate Limit Response Format
- [ ] Verify 429 responses include:
  - [ ] Error code: 'RATE_LIMIT_EXCEEDED'
  - [ ] Clear error message
  - [ ] Rate limit details (which limit hit)
- [ ] Verify rate limit headers (if applicable):
  - [ ] `X-RateLimit-Limit`
  - [ ] `X-RateLimit-Remaining`
  - [ ] `X-RateLimit-Reset`

---

## 💰 Cost Protection Testing

### Daily Spending Cap
- [ ] **Cap Enforcement**
  - [ ] Set low `DAILY_SPENDING_CAP` (e.g., $1.00)
  - [ ] Process jobs until cap would be exceeded
  - [ ] Verify queue pauses when cap reached
  - [ ] Verify jobs remain in queue (not processed)
  - [ ] Verify cost tracking accurate
- [ ] **Cap Reset**
  - [ ] Verify cap resets at midnight UTC
  - [ ] Verify queue resumes processing after reset
  - [ ] Verify new jobs can be processed
- [ ] **Cost Estimation**
  - [ ] Verify cost estimation works for different models
  - [ ] Verify estimated costs are reasonable
  - [ ] Compare estimated vs actual costs (after processing)
- [ ] **Cost Tracking**
  - [ ] Process several jobs
  - [ ] Verify costs recorded in database
  - [ ] Verify daily totals are accurate
  - [ ] Check cost tracking endpoint (if exists)

---

## 🔒 Security Testing

### Authentication
- [ ] **JWT Authentication**
  - [ ] Make request without token (should fail with 401)
  - [ ] Make request with invalid token (should fail)
  - [ ] Make request with expired token (should fail)
  - [ ] Make request with valid token (should succeed)
  - [ ] Verify token refresh endpoint works
- [ ] **Admin Authentication**
  - [ ] Access admin endpoints without auth (should fail)
  - [ ] Access admin endpoints with user token (should fail)
  - [ ] Access admin endpoints with admin token (should succeed)
- [ ] **CORS Verification**
  - [ ] Make request from allowed origin (should succeed)
  - [ ] Make request from disallowed origin (should fail)
  - [ ] Verify preflight OPTIONS requests work

### Input Validation
- [ ] **Request Validation**
  - [ ] Send invalid styleId (should fail with 400)
  - [ ] Send invalid imageUrl (should fail with 400)
  - [ ] Send malformed JSON (should fail with 400)
  - [ ] Send SQL injection attempt (should be sanitized)
  - [ ] Send XSS attempt (should be sanitized)
- [ ] **Rate Limit Bypass Attempts**
  - [ ] Try to bypass rate limits with header manipulation
  - [ ] Try to bypass rate limits with IP spoofing
  - [ ] Verify all attempts are logged

### Security Headers
- [ ] Verify security headers are set:
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Strict-Transport-Security` (if HTTPS)
  - [ ] `Content-Security-Policy`
- [ ] Verify CORS headers are correct

### Security Logging
- [ ] **Security Event Logging**
  - [ ] Trigger failed authentication attempt
  - [ ] Verify event logged in security_logs table
  - [ ] Verify IP address, timestamp, and event type logged
  - [ ] Check admin dashboard shows security logs
- [ ] **Suspicious Activity Detection**
  - [ ] Make many failed auth attempts
  - [ ] Verify multiple failures logged
  - [ ] Check if pattern detection works (if implemented)

---

## 📊 Admin Dashboard Testing

### Dashboard Access
- [ ] Access admin login page
- [ ] Login with valid admin credentials
- [ ] Verify JWT token issued and stored
- [ ] Access protected admin endpoints
- [ ] Verify logout works correctly

### Queue Stats Viewing
- [ ] View queue statistics
  - [ ] Verify pending count is accurate
  - [ ] Verify processing count is accurate
  - [ ] Verify completed/failed counts are accurate
  - [ ] Verify priority breakdown is accurate
  - [ ] Verify average wait time is displayed
- [ ] Refresh stats and verify updates

### Security Logs Viewing
- [ ] View security logs
  - [ ] Verify recent events are displayed
  - [ ] Verify filtering works (if implemented)
  - [ ] Verify pagination works (if implemented)
  - [ ] Verify event details are shown correctly

### User Management (if implemented)
- [ ] View user list
- [ ] View user details
- [ ] Search/filter users
- [ ] View user subscription history

---

## 🚀 Performance Testing

### Response Times
- [ ] **API Endpoint Performance**
  - [ ] Measure `/api/enqueue` response time (< 500ms target)
  - [ ] Measure `/api/job` response time (< 200ms target)
  - [ ] Measure `/api/user/subscription` response time (< 300ms target)
  - [ ] Measure queue stats endpoint response time
- [ ] **Database Query Performance**
  - [ ] Verify queue queries are fast (< 100ms)
  - [ ] Verify usage tracking queries are fast
  - [ ] Check for slow queries in logs
- [ ] **Concurrent Request Handling**
  - [ ] Make 20+ concurrent requests
  - [ ] Verify all requests handled correctly
  - [ ] Verify no timeouts or errors
  - [ ] Check response times remain acceptable

### Queue Processing Performance
- [ ] **Throughput**
  - [ ] Measure jobs processed per minute
  - [ ] Verify throughput meets expectations
  - [ ] Identify bottlenecks
- [ ] **Latency**
  - [ ] Measure time from enqueue to processing start
  - [ ] Measure time from processing start to completion
  - [ ] Verify latency is acceptable for users

---

## 🐛 Error Handling Testing

### Error Scenarios
- [ ] **Network Errors**
  - [ ] Simulate Replicate API timeout
  - [ ] Verify job marked as failed
  - [ ] Verify error message stored
  - [ ] Verify user receives error notification
- [ ] **API Errors**
  - [ ] Simulate Replicate API error response
  - [ ] Verify error handled gracefully
  - [ ] Verify job status updated correctly
- [ ] **Database Errors**
  - [ ] Simulate database connection failure
  - [ ] Verify error handled gracefully
  - [ ] Verify no data corruption
- [ ] **Invalid Input**
  - [ ] Send invalid requests
  - [ ] Verify appropriate error responses
  - [ ] Verify error messages are user-friendly

### Error Recovery
- [ ] **Failed Job Recovery**
  - [ ] Create job that will fail
  - [ ] Verify job fails correctly
  - [ ] Verify error message is clear
  - [ ] Verify user can retry (if implemented)
- [ ] **Queue Recovery**
  - [ ] Process jobs, then stop processing
  - [ ] Restart processing
  - [ ] Verify pending jobs resume correctly

---

## 📱 Mobile App Integration Testing

### End-to-End Flow
- [ ] **Complete Generation Flow**
  - [ ] Open app
  - [ ] Select style (Netflix row or See all grid)
  - [ ] Photo tips sheet auto-opens on Upload (unless dismissed for that style)
  - [ ] Verify header pills: style name left, usage quota right (`UploadFlowHeader`)
  - [ ] Pick image (Gallery/Camera) — OS crop via `expo-image-picker`
  - [ ] Review screen — same header pills; confirm photo
  - [ ] Start generation
  - [ ] Verify job enqueued correctly
  - [ ] Verify polling works (job status updates)
  - [ ] Verify result displayed when complete
  - [ ] Verify error handling if job fails
- [ ] **Offline UX (mobile)**
  - [ ] Airplane mode — orange overlay banner visible; does not push header layout
  - [ ] Generate/subscribe blocked; warning toast if attempted
  - [ ] Reconnect — banner clears; styles/subscription refresh
- [ ] **Subscription Flow**
  - [ ] View subscription screen
  - [ ] Purchase subscription
  - [ ] Verify subscription status updates
  - [ ] Verify quota displayed correctly
  - [ ] Generate images and verify quota decreases
- [ ] **Trial Flow**
  - [ ] Create new user
  - [ ] Verify trial status shown
  - [ ] Generate images and verify trial count decreases
  - [ ] Verify subscription prompt after trial expires

### Edge Cases
- [ ] **Network Interruption**
  - [ ] Start generation, then disconnect network
  - [ ] Reconnect network
  - [ ] Verify polling resumes
  - [ ] Verify job completes correctly
- [ ] **App Backgrounding**
  - [ ] Start generation
  - [ ] Background app
  - [ ] Return to app
  - [ ] Verify job status synced correctly
- [ ] **Multiple Concurrent Jobs**
  - [ ] Enqueue multiple jobs from app
  - [ ] Verify all jobs tracked correctly
  - [ ] Verify results displayed correctly

---

## 🔍 Monitoring & Observability

### Logging
- [ ] **Error Logging**
  - [ ] Verify errors logged to console/Vercel logs
  - [ ] Verify error details are captured
  - [ ] Check logs are searchable
- [ ] **Performance Logging**
  - [ ] Verify slow requests are logged
  - [ ] Verify queue processing times logged
  - [ ] Check for performance metrics
- [ ] **Security Logging**
  - [ ] Verify security events logged
  - [ ] Verify logs are secure (not exposed)
  - [ ] Check log retention policy

### Metrics
- [ ] **Queue Metrics**
  - [ ] Verify queue depth is monitored
  - [ ] Verify processing rate is tracked
  - [ ] Verify wait times are tracked
- [ ] **Cost Metrics**
  - [ ] Verify daily spending tracked
  - [ ] Verify cost per job tracked
  - [ ] Check cost alerts (if implemented)
- [ ] **User Metrics**
  - [ ] Verify active users tracked
  - [ ] Verify subscription conversions tracked
  - [ ] Verify usage per tier tracked

### Alerts (if implemented)
- [ ] **Cost Alerts**
  - [ ] Verify alert triggers when cap reached
  - [ ] Verify alert sent to correct recipients
- [ ] **Error Alerts**
  - [ ] Verify alert triggers on high error rate
  - [ ] Verify alert sent promptly
- [ ] **Performance Alerts**
  - [ ] Verify alert triggers on slow response times
  - [ ] Verify alert triggers on queue backlog

---

## ✅ Production Readiness Checklist

### Pre-Launch
- [ ] All tests above completed
- [ ] All critical bugs fixed
- [ ] Performance meets targets
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Backup/recovery procedures documented
- [ ] Monitoring and alerts configured
- [ ] Support channels ready

### Launch Day
- [ ] Monitor queue processing closely
- [ ] Monitor error rates
- [ ] Monitor cost spending
- [ ] Monitor user sign-ups
- [ ] Monitor subscription conversions
- [ ] Be ready to pause queue if needed
- [ ] Be ready to scale if needed

### Post-Launch (First 24 Hours)
- [ ] Review all metrics
- [ ] Check for errors/issues
- [ ] Verify cost protection working
- [ ] Verify subscriptions working correctly
- [ ] Monitor user feedback
- [ ] Document any issues found

---

## 📝 Testing Notes

**Testing Environment**: Production  
**Testing Period**: [DATE RANGE]  
**Tested By**: [NAME]  
**Issues Found**: [LIST]  
**Issues Fixed**: [LIST]  
**Outstanding Issues**: [LIST]

---

## 🎯 Success Criteria

Before launch, verify:
- ✅ All subscription flows work end-to-end
- ✅ Queue system processes jobs correctly under load
- ✅ Rate limiting prevents abuse
- ✅ Cost protection prevents overspending
- ✅ Security measures are effective
- ✅ Performance meets targets
- ✅ Error handling is robust
- ✅ Monitoring provides visibility

---

**Status**: Ready to begin testing ✅

