# Backend Monitoring & Admin Dashboard - Architectural Plan

**Status**: Planning  
**Priority**: High (Required for Launch)  
**Last Updated**: January 2025

---

## Overview

This document outlines the architecture for backend monitoring and an admin dashboard to manage the FunnyFy application, monitor health, track metrics, and manage users.

---

## Objectives

1. **Real-Time Monitoring**: Track system health, errors, and performance
2. **Admin Dashboard**: Web-based interface for managing the application
3. **Analytics**: Business and technical metrics
4. **Alerting**: Notify admins of critical issues
5. **User Management**: View and manage users, subscriptions, and usage

---

## Architecture Overview

### Recommended Stack (Industry Standard)

#### Option 1: Modern SaaS Stack (Recommended)
- **Frontend**: Next.js (React) or Vite + React
- **Backend API**: Vercel serverless functions (same as main app)
- **Database**: Vercel Postgres (shared with main app)
- **Authentication**: Clerk or Auth0 (industry standard)
- **Monitoring**: Sentry (errors) + Vercel Analytics
- **Logging**: Axiom or Logtail
- **Charts**: Recharts or Chart.js

#### Option 2: All-in-One Solution
- **Retool**: Low-code admin panel (fastest setup)
- **Forest Admin**: Open-source admin panel
- **Directus**: Headless CMS with admin UI

---

## Admin Dashboard Features

### 1. Dashboard Overview

#### Key Metrics Cards
- **Total Users**: Active, new today, new this week
- **Subscriptions**: Active, canceled, revenue (MRR)
- **API Usage**: Total generations today, this week, this month
- **Costs**: Daily API costs, monthly projection
- **Queue Status**: Pending jobs, average wait time
- **Error Rate**: Errors in last 24 hours

#### Real-Time Charts
- Revenue over time (MRR trend)
- User growth (DAU, MAU)
- API usage by tier
- Most popular styles
- Error rate over time
- Queue depth over time

### 2. User Management

#### User List View
- Table with columns:
  - User ID / Email
  - Subscription Tier
  - Status (Active/Canceled)
  - Usage (Current/Month)
  - Sign-up Date
  - Last Active
  - Actions (View Details, Suspend, Delete)

#### User Detail View
- User profile information
- Subscription history
- Usage history (chart)
- Job history (list of all generations)
- Payment history
- Notes/Flags

#### Actions
- Suspend user account
- Change subscription tier
- Reset usage quota
- Add manual quota adjustment
- Send email to user
- View user's generated images

### 3. Subscription Management

#### Subscription Overview
- Active subscriptions by tier
- Revenue breakdown
- Churn rate
- Upgrade/downgrade trends

#### Subscription Actions
- Manually upgrade/downgrade user
- Cancel subscription
- Refund processing
- Prorate adjustments

### 4. Usage & Analytics

#### Usage Analytics
- Generations per day/week/month
- Usage by subscription tier
- Peak usage times
- Geographic distribution (if tracking)

#### Style Analytics
- Most popular styles
- Style usage trends
- Style success rate
- Average processing time per style

### 5. System Health

#### API Health
- Replicate API status
- Response times
- Error rates
- Queue depth
- Processing times

#### Infrastructure Health
- Vercel function invocations
- Database connection pool
- Error rates
- Uptime monitoring

### 6. Cost Monitoring

#### Cost Dashboard
- Daily API costs (chart)
- Monthly projection
- Cost per user
- Cost per generation
- Cost by subscription tier
- Spending alerts

#### Cost Controls
- Set daily spending cap
- Pause queue if cap exceeded
- Cost alerts configuration

### 7. Error Tracking

#### Error Logs
- Real-time error feed
- Error details (stack traces)
- Error frequency
- Affected users
- Resolution status

#### Integration with Sentry
- View errors from Sentry
- Assign errors to team members
- Track error resolution

### 8. Queue Management

#### Queue Monitor
- Current queue depth
- Jobs by status (pending, processing, completed, failed)
- Average wait times
- Priority distribution
- Failed job retry

#### Queue Actions
- Pause queue
- Clear failed jobs
- Retry failed job
- View job details

---

## Database Schema for Admin

### Additional Tables (if needed)

```sql
-- Admin users (separate from app users)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin', 'support', 'viewer'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin activity log
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'subscription', 'job'
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System alerts
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'error_rate', 'cost_cap', 'queue_depth'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'info'
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints for Admin

### Authentication
```
POST /admin/auth/login
POST /admin/auth/logout
GET  /admin/auth/me
```

### Dashboard
```
GET /admin/dashboard/stats
GET /admin/dashboard/metrics
GET /admin/dashboard/revenue
```

### Users
```
GET    /admin/users
GET    /admin/users/:id
PUT    /admin/users/:id
DELETE /admin/users/:id
GET    /admin/users/:id/usage
GET    /admin/users/:id/jobs
```

### Subscriptions
```
GET  /admin/subscriptions
GET  /admin/subscriptions/:id
PUT  /admin/subscriptions/:id
POST /admin/subscriptions/:id/cancel
```

### Jobs
```
GET  /admin/jobs
GET  /admin/jobs/:id
POST /admin/jobs/:id/retry
DELETE /admin/jobs/:id
```

### Analytics
```
GET /admin/analytics/usage
GET /admin/analytics/revenue
GET /admin/analytics/styles
GET /admin/analytics/errors
```

### System
```
GET  /admin/system/health
GET  /admin/system/queue
POST /admin/system/queue/pause
POST /admin/system/queue/resume
GET  /admin/system/costs
PUT  /admin/system/costs/cap
```

---

## Monitoring Stack

### 1. Error Tracking: Sentry

**Setup**:
```typescript
// api/_sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Features**:
- Automatic error capture
- Stack traces
- User context
- Release tracking
- Performance monitoring

### 2. Logging: Axiom or Logtail

**Axiom Setup**:
```typescript
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN,
  orgId: process.env.AXIOM_ORG_ID,
});

// Log events
await axiom.ingest('funnyfy-logs', {
  level: 'info',
  message: 'Job completed',
  jobId: '...',
  userId: '...',
});
```

**Features**:
- Structured logging
- Query interface
- Real-time logs
- Retention policies

### 3. Analytics: Vercel Analytics + Custom

**Vercel Analytics**:
- Built-in with Vercel
- Web vitals
- Page views
- API route analytics

**Custom Analytics**:
- Track custom events
- Business metrics
- User behavior

### 4. Uptime Monitoring: UptimeRobot or Pingdom

**External Service**:
- Monitor API endpoints
- Alert on downtime
- Response time tracking

---

## Alerting System

### Alert Types

1. **Critical Alerts** (Immediate Action)
   - API costs exceed daily cap
   - Error rate > 5%
   - Queue depth > 100
   - Database connection failures

2. **Warning Alerts** (Monitor)
   - API costs > 80% of daily cap
   - Error rate > 2%
   - Queue depth > 50
   - Slow response times

3. **Info Alerts** (Notification)
   - New user signups
   - Subscription upgrades
   - High usage periods

### Alert Channels

- **Email**: For all alerts
- **Slack**: For critical/warning alerts
- **SMS** (optional): For critical only
- **In-App**: Admin dashboard notifications

### Implementation

```typescript
// api/admin/alerts.ts
async function sendAlert(type: string, severity: string, message: string) {
  // Store in database
  await db.query(`
    INSERT INTO system_alerts (type, severity, message)
    VALUES ($1, $2, $3)
  `, [type, severity, message]);
  
  // Send email
  if (severity === 'critical' || severity === 'warning') {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[${severity.toUpperCase()}] ${type}`,
      body: message,
    });
  }
  
  // Send Slack
  if (severity === 'critical') {
    await sendSlack({
      channel: '#alerts',
      message: `🚨 ${message}`,
    });
  }
}
```

---

## Admin Dashboard UI/UX

### Design Principles

1. **Clean & Modern**: Use modern UI framework (Tailwind CSS, shadcn/ui)
2. **Responsive**: Works on desktop, tablet, mobile
3. **Fast**: Optimistic updates, loading states
4. **Secure**: Role-based access control
5. **Real-Time**: WebSocket or polling for live updates

### Recommended UI Framework

- **Next.js + Tailwind CSS + shadcn/ui**: Modern, fast, customizable
- **Vite + React + Ant Design**: Enterprise-ready components
- **Retool**: Fastest setup, but less customizable

### Key Pages

1. **Login Page**: Simple email/password or SSO
2. **Dashboard**: Overview with metrics
3. **Users**: List and detail views
4. **Subscriptions**: Management interface
5. **Analytics**: Charts and reports
6. **Settings**: System configuration
7. **Logs**: Error and activity logs

---

## Security for Admin Dashboard

### Authentication

- **Multi-Factor Authentication (MFA)**: Required for all admin users
- **Session Management**: Secure sessions with expiration
- **IP Whitelisting** (optional): Restrict access by IP

### Authorization

- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Full access
  - **Admin**: Most features, can't delete users
  - **Support**: View-only, can manage users
  - **Viewer**: Read-only access

### Security Best Practices

1. **HTTPS Only**: Enforce SSL/TLS
2. **Rate Limiting**: Prevent brute force
3. **Audit Logging**: Log all admin actions
4. **Input Validation**: Sanitize all inputs
5. **SQL Injection Prevention**: Parameterized queries
6. **XSS Prevention**: Sanitize outputs

---

## Implementation Phases

### Phase 1: Basic Dashboard (Week 1-2)
- [ ] Set up Next.js admin app
- [ ] Authentication (Clerk/Auth0)
- [ ] Basic dashboard with metrics
- [ ] User list view
- [ ] Error tracking integration (Sentry)

### Phase 2: User Management (Week 3)
- [ ] User detail view
- [ ] Subscription management
- [ ] Usage tracking display
- [ ] Job history

### Phase 3: Analytics & Monitoring (Week 4)
- [ ] Advanced charts
- [ ] Cost monitoring
- [ ] Queue monitoring
- [ ] Alert system

### Phase 4: Advanced Features (Week 5+)
- [ ] Real-time updates (WebSocket)
- [ ] Export reports
- [ ] Custom alerts configuration
- [ ] System settings

---

## Recommended Tools & Services

### Monitoring
- **Sentry**: Error tracking (Free tier available)
- **Axiom**: Logging ($25/month starter)
- **Vercel Analytics**: Built-in, free

### Admin Dashboard
- **Clerk**: Authentication ($25/month starter)
- **Next.js**: Framework (free)
- **shadcn/ui**: UI components (free)

### Alternative: All-in-One
- **Retool**: $10/user/month (fastest setup)

---

## Cost Estimate

### Monthly Costs (Recommended Stack)
- Sentry: $0-26/month (free tier available)
- Axiom: $25/month (starter)
- Clerk: $25/month (starter)
- **Total**: ~$50-75/month

### Alternative (Retool)
- Retool: $10/user/month
- **Total**: ~$10-30/month (depending on users)

---

## Next Steps

1. **Choose Stack**: Decide between custom dashboard or Retool
2. **Set Up Authentication**: Clerk or Auth0
3. **Create Basic Dashboard**: Start with metrics
4. **Integrate Monitoring**: Sentry + logging
5. **Build User Management**: Core admin features

---

## References

- [Sentry Documentation](https://docs.sentry.io/)
- [Clerk Authentication](https://clerk.com/docs)
- [Next.js Admin Dashboard Example](https://github.com/vercel/next.js/tree/canary/examples/with-mongodb)
- [Retool Documentation](https://docs.retool.com/)

---

**Recommendation**: Start with Retool for fastest MVP, then build custom dashboard if needed.
