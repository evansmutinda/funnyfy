# Security Architecture Plan

**Status**: Planning  
**Priority**: Critical (Required for Launch)  
**Last Updated**: January 2025

---

## Overview

This document outlines comprehensive security measures for FunnyFy, following industry best practices and standards (OWASP, NIST, SOC 2).

---

## Security Objectives

1. **Data Protection**: Protect user data and images
2. **API Security**: Secure API endpoints and prevent abuse
3. **Authentication**: Secure user authentication and authorization
4. **Infrastructure Security**: Secure hosting and infrastructure
5. **Compliance**: Meet privacy and security regulations (GDPR, CCPA)

---

## Security Layers

### 1. Application Security

#### Input Validation
```typescript
// Validate all inputs
import { z } from 'zod';

const styleIdSchema = z.string().min(1).max(50).regex(/^[a-z0-9-]+$/);
const imageUrlSchema = z.string().url().max(2048);

// Use in API endpoints
const validated = styleIdSchema.parse(req.body.styleId);
```

**Best Practices**:
- ✅ Validate all user inputs
- ✅ Sanitize strings (prevent XSS)
- ✅ Validate file types and sizes
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Rate limit all endpoints

#### Output Encoding
```typescript
// Sanitize outputs
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

#### Error Handling
```typescript
// Never expose internal errors
try {
  // ...
} catch (error) {
  console.error('Internal error:', error); // Log internally
  return res.status(500).json({
    ok: false,
    error: 'An error occurred. Please try again.' // Generic message
  });
}
```

---

### 2. API Security

#### Authentication

**Option 1: JWT Tokens (Recommended)**
```typescript
// Generate JWT on login
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify in middleware
function authenticate(req: VercelRequest, res: VercelResponse, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Option 2: Clerk/Auth0 (Easier)**
- Managed authentication service
- Handles MFA, social login, etc.
- Recommended for faster launch

#### Authorization
```typescript
// Role-based access control
function requireRole(role: string) {
  return (req: VercelRequest, res: VercelResponse, next: Function) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.get('/admin/users', authenticate, requireRole('admin'), getUsers);
```

#### Rate Limiting
```typescript
// Use Vercel Edge Config or Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute (burst protection)
});

// Apply to endpoints
const { success } = await ratelimit.limit(req.headers['x-user-id'] || req.ip);
if (!success) {
  return res.status(429).json({ error: 'Too many requests' });
}
```

#### CORS Configuration
```typescript
// Strict CORS
const allowedOrigins = [
  'https://funnyfyapp.vercel.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : '');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

---

### 3. Data Security

#### Database Security

**Connection Security**:
- ✅ Use SSL/TLS for database connections
- ✅ Use connection pooling
- ✅ Rotate database credentials regularly
- ✅ Use read-only users for queries when possible

**Data Encryption**:
```sql
-- Encrypt sensitive fields at rest
-- Use database encryption (Vercel Postgres has this by default)
```

**SQL Injection Prevention**:
```typescript
// Always use parameterized queries
// ❌ BAD
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ GOOD
db.query('SELECT * FROM users WHERE email = $1', [email]);
```

#### Image Storage Security

**S3/Cloud Storage**:
- ✅ Use signed URLs for temporary access
- ✅ Set bucket policies (private by default)
- ✅ Enable versioning
- ✅ Set lifecycle policies (delete old images)

```typescript
// Generate signed URL (expires in 1 hour)
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const command = new GetObjectCommand({
  Bucket: 'funnyfy-images',
  Key: imageKey,
});

const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
```

#### PII (Personally Identifiable Information)

**Data Minimization**:
- ✅ Only collect necessary data
- ✅ Don't store payment details (RevenueCat handles this)
- ✅ Anonymize analytics data

**Data Retention**:
```typescript
// Delete old data
// Images: Delete after 90 days
// Jobs: Delete after 30 days
// User data: Keep while account active, delete 30 days after cancellation
```

---

### 4. Infrastructure Security

#### Vercel Security

**Environment Variables**:
- ✅ Never commit secrets to git
- ✅ Use Vercel environment variables
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/prod

**Function Security**:
- ✅ Serverless functions are isolated
- ✅ Automatic DDoS protection
- ✅ SSL/TLS by default
- ✅ No server management needed

#### Network Security

**HTTPS Only**:
- ✅ Vercel enforces HTTPS
- ✅ HSTS headers enabled
- ✅ Redirect HTTP to HTTPS

**Firewall Rules** (if using Vercel Pro):
- ✅ IP whitelisting for admin endpoints
- ✅ Geo-blocking (if needed)

#### Secrets Management

```typescript
// Use Vercel environment variables
const apiKey = process.env.REPLICATE_API_KEY; // Never hardcode

// For local development, use .env file (gitignored)
// .env.local
REPLICATE_API_KEY=your_key_here
```

---

### 5. Authentication & Authorization

#### User Authentication

**Recommended: Clerk**
- ✅ Managed service
- ✅ MFA support
- ✅ Social login
- ✅ Session management
- ✅ $25/month starter

**Alternative: Custom JWT**
- More control
- More work to implement
- Need to handle MFA, password reset, etc.

#### Password Security (if custom auth)

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Requirements**:
- ✅ Minimum 8 characters
- ✅ Require uppercase, lowercase, number
- ✅ Rate limit login attempts
- ✅ Lock account after 5 failed attempts
- ✅ Require password reset after lockout

#### Session Management

```typescript
// Secure session configuration
const sessionConfig = {
  httpOnly: true, // Prevent XSS
  secure: true, // HTTPS only
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

---

### 6. API Security Best Practices

#### API Key Protection

```typescript
// Replicate API key - server-side only
// Never expose to client
const replicateKey = process.env.REPLICATE_API_KEY;

// Validate API requests
function validateApiRequest(req: VercelRequest): boolean {
  // Check authentication token
  // Check rate limits
  // Check user quota
  // Validate input
  return true;
}
```

#### Request Validation

```typescript
// Validate all requests
import { z } from 'zod';

const generateRequestSchema = z.object({
  styleId: z.string().min(1).max(50),
  imageUrl: z.string().url().max(2048),
});

// Use in endpoint
const validated = generateRequestSchema.parse(req.body);
```

#### Content Security Policy (CSP)

```typescript
// Set CSP headers
res.setHeader('Content-Security-Policy', 
  "default-src 'self'; " +
  "img-src 'self' data: https:; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline';"
);
```

---

### 7. Compliance & Privacy

#### GDPR Compliance

**User Rights**:
- ✅ Right to access (export user data)
- ✅ Right to deletion (delete account and data)
- ✅ Right to portability (export data in machine-readable format)
- ✅ Consent management (cookie consent, if needed)

**Implementation**:
```typescript
// API endpoint to export user data
GET /api/user/export
// Returns all user data in JSON format

// API endpoint to delete user
DELETE /api/user
// Deletes user account and all associated data
```

#### Privacy Policy

**Required Disclosures**:
- What data is collected
- How data is used
- Who data is shared with
- How data is protected
- User rights

#### Terms of Service

**Required Sections**:
- Service description
- User obligations
- Payment terms
- Refund policy
- Limitation of liability

---

### 8. Security Monitoring

#### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capture errors
try {
  // ...
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

#### Security Logging

```typescript
// Log security events
async function logSecurityEvent(event: {
  type: string;
  userId?: string;
  ip: string;
  userAgent: string;
  details: any;
}) {
  await db.query(`
    INSERT INTO security_logs (type, user_id, ip, user_agent, details, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [event.type, event.userId, event.ip, event.userAgent, JSON.stringify(event.details)]);
}

// Log events:
// - Failed login attempts
// - Quota exceeded attempts
// - Suspicious activity
// - Admin actions
```

#### Intrusion Detection

**Monitor For**:
- Multiple failed login attempts
- Unusual API usage patterns
- Quota bypass attempts
- Unauthorized access attempts

**Alerts**:
- Email/Slack on suspicious activity
- Auto-lock accounts after threshold
- Rate limit aggressive IPs

---

### 9. Security Checklist

#### Pre-Launch
- [ ] All API endpoints require authentication
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] HTTPS enforced
- [ ] Secrets in environment variables
- [ ] Error messages don't expose internals
- [ ] CORS configured correctly
- [ ] Database connections use SSL
- [ ] Image storage is private
- [ ] Logging security events
- [ ] Privacy policy created
- [ ] Terms of service created

#### Post-Launch
- [ ] Regular security audits
- [ ] Dependency updates (check for vulnerabilities)
- [ ] Penetration testing (annual)
- [ ] Security training for team
- [ ] Incident response plan
- [ ] Regular backups tested

---

### 10. Incident Response Plan

#### Security Incident Types
1. **Data Breach**: Unauthorized access to user data
2. **DDoS Attack**: Service unavailable
3. **API Abuse**: Unauthorized API usage
4. **Account Compromise**: User account hacked

#### Response Steps
1. **Identify**: Detect and confirm incident
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat
4. **Recover**: Restore services
5. **Learn**: Post-incident review

#### Contacts
- **Security Team**: [email]
- **Hosting Provider**: Vercel support
- **Legal**: [if needed]
- **Users**: Notification if data breach

---

### 11. Security Tools & Services

#### Recommended Stack
- **Authentication**: Clerk ($25/month)
- **Error Tracking**: Sentry (Free tier available)
- **Logging**: Axiom ($25/month)
- **Rate Limiting**: Upstash Redis ($10/month)
- **Security Scanning**: Snyk (Free tier available)

#### Cost Estimate
- **Total**: ~$60-100/month for security tools

---

### 12. OWASP Top 10 Protection

1. **Injection**: ✅ Parameterized queries
2. **Broken Authentication**: ✅ Clerk/Auth0
3. **Sensitive Data Exposure**: ✅ Encryption, HTTPS
4. **XML External Entities**: ✅ Not applicable
5. **Broken Access Control**: ✅ Role-based authorization
6. **Security Misconfiguration**: ✅ Vercel defaults
7. **XSS**: ✅ Output encoding, CSP
8. **Insecure Deserialization**: ✅ Validate JSON
9. **Using Components with Known Vulnerabilities**: ✅ Regular updates
10. **Insufficient Logging**: ✅ Comprehensive logging

---

## Implementation Phases

### Phase 1: Basic Security (Week 1)
- [ ] Authentication system (Clerk or JWT)
- [ ] Input validation
- [ ] Rate limiting
- [ ] Error handling
- [ ] HTTPS enforcement

### Phase 2: Data Security (Week 2)
- [ ] Database encryption
- [ ] Secure image storage
- [ ] PII protection
- [ ] Data retention policies

### Phase 3: Monitoring (Week 3)
- [ ] Error tracking (Sentry)
- [ ] Security logging
- [ ] Alert system
- [ ] Monitoring dashboard

### Phase 4: Compliance (Week 4)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance
- [ ] User data export/deletion

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Vercel Security](https://vercel.com/docs/security)
- [Clerk Security](https://clerk.com/docs/security)

---

**Next Steps**: Review security requirements, implement Phase 1, conduct security audit before launch.
