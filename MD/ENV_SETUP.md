# Environment Variables Setup Guide

This guide explains all environment variables needed for FunnyFy and how to configure them.

---

## 📋 Required Environment Variables

### Backend API (Vercel)

#### **Database**
- **`DATABASE_URL`** (Required)
  - **Description**: PostgreSQL connection string (Supabase)
  - **Format**: `postgresql://user:password@host:port/database`
  - **Example**: `postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
  - **Where to get**: Supabase Dashboard → Project Settings → Database → Connection String (Transaction Pooler)
  - **Note**: URL-encode special characters in password (e.g., `@` → `%40`, `,` → `%2C`)

#### **Replicate API**
- **`TARGET_API_URL`** (Required)
  - **Description**: Replicate API endpoint for image generation
  - **Default**: `https://api.replicate.com/v1/predictions`
  - **Note**: Usually doesn't need to change

- **`TARGET_API_KEY`** (Required)
  - **Description**: Your Replicate API token
  - **Where to get**: [Replicate Dashboard](https://replicate.com/account/api-tokens) → API Tokens
  - **Format**: `r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### **CORS & Security**
- **`ALLOWED_ORIGIN`** (Required)
  - **Description**: Allowed CORS origin for API requests
  - **Production**: `https://funnyfyapp.vercel.app` (or your production domain)
  - **Staging**: `https://funnyfy-staging.vercel.app` (or your staging domain)
  - **Development**: `*` (allows all origins - **NOT for production**)
  - **Note**: Use specific origin in production for security

#### **Authentication**
- **`JWT_SECRET`** (Optional, but recommended)
  - **Description**: Secret key for JWT token signing/verification
  - **How to generate**: 
    ```bash
    # Generate a random secret (32+ characters)
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - **Alternative name**: `AUTH_SECRET` (also supported)
  - **Note**: Use different secrets for staging and production

#### **Rate Limiting**
- **`IP_RATE_LIMIT_PER_MINUTE`** (Optional)
  - **Description**: Maximum requests per IP per minute (burst protection)
  - **Default**: `60` (prevents abuse while allowing normal usage)
  - **Format**: Number (e.g., `60`, `100`, `200`)
  - **Note**: This is burst protection only. Users are primarily limited by monthly quota, not rate limits.

#### **Queue Processing**
- **`MAX_CONCURRENT_JOBS`** (Optional)
  - **Description**: Maximum concurrent jobs processed by queue worker
  - **Default**: `10`
  - **Format**: Number

- **`CRON_SECRET`** (Optional, but recommended)
  - **Description**: Secret for protecting `/api/cron/*` endpoints
  - **How to generate**: Same as `JWT_SECRET`
  - **Usage**: Configured in [cron-job.org](https://cron-job.org/) as the request `Authorization` header: `Bearer <CRON_SECRET>`. The mobile app does **not** use this secret — it kicks the queue using the user's JWT.
  - **Note**: Prevents unauthorized access to `/api/cron/*` endpoints

#### **RevenueCat Webhooks**
- **`REVENUECAT_WEBHOOK_SECRET`** (Required when using RevenueCat)
  - **Description**: Secret for verifying RevenueCat webhook signatures
  - **Where to get**: RevenueCat Dashboard → Integrations → Webhooks → Webhook Secret
  - **Format**: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - **Note**: Required to receive subscription events securely
  - **See**: `MD/REVENUECAT_WEBHOOK_SETUP.md` for detailed instructions

#### **Node Environment**
- **`NODE_ENV`** (Automatic)
  - **Description**: Environment mode (development/production)
  - **Set by**: Vercel automatically sets this
  - **Values**: `production` (Vercel), `development` (local)

---

## 🚀 Setup Instructions

### 1. Vercel Setup (Production)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add each variable**:
   - Click "Add New"
   - Enter variable name
   - Enter variable value
   - Select environments: **Production**, **Preview**, **Development** (as needed)
   - Click "Save"

3. **Required variables for Production**:
   ```
   DATABASE_URL=postgresql://...
   TARGET_API_URL=https://api.replicate.com/v1/predictions
   TARGET_API_KEY=r8_xxxxxxxxxxxxx
   ALLOWED_ORIGIN=https://funnyfyapp.vercel.app
   JWT_SECRET=your-secret-here
   REVENUECAT_WEBHOOK_SECRET=your-webhook-secret
   CRON_SECRET=your-cron-secret
   ```

4. **Optional variables** (with defaults):
   ```
   IP_RATE_LIMIT_PER_MINUTE=30
   MAX_CONCURRENT_JOBS=10
   ```

### 2. Vercel Setup (Staging)

1. **Create a separate Vercel project** for staging (or use branch-based environments)

2. **Add the same variables**, but with staging-specific values:
   ```
   DATABASE_URL=postgresql://... (staging database)
   ALLOWED_ORIGIN=https://funnyfy-staging.vercel.app
   JWT_SECRET=different-secret-for-staging
   REVENUECAT_WEBHOOK_SECRET=staging-webhook-secret
   CRON_SECRET=staging-cron-secret
   ```

3. **Link to Staging branch**:
   - Settings → Git → Production Branch: `main`
   - Settings → Git → Branch Tracking: Add `Staging` branch

### 3. Local Development Setup

1. **Create `.env.local`** in the project root:
   ```bash
   # Copy from env.example
   cp env.example .env.local
   ```

2. **Edit `.env.local`** with your values:
   ```bash
   DATABASE_URL=postgresql://... (your local/staging DB)
   TARGET_API_URL=https://api.replicate.com/v1/predictions
   TARGET_API_KEY=your_replicate_key
   ALLOWED_ORIGIN=*
   JWT_SECRET=local-dev-secret
   IP_RATE_LIMIT_PER_MINUTE=100
   NODE_ENV=development
   ```

3. **Run Vercel Dev**:
   ```bash
   npx vercel dev
   ```
   - Vercel will automatically load `.env.local`

4. **Important**: Add `.env.local` to `.gitignore` (already done)

---

## 🔐 Security Best Practices

### 1. **Never Commit Secrets**
- ✅ `.env.local` is in `.gitignore`
- ✅ Use Vercel Environment Variables
- ❌ Never commit `.env` files with real secrets

### 2. **Use Different Secrets Per Environment**
- Production: Strong, unique secrets
- Staging: Different secrets (for testing)
- Development: Can be simpler, but still secure

### 3. **Rotate Secrets Regularly**
- Change `JWT_SECRET` periodically
- Rotate `REVENUECAT_WEBHOOK_SECRET` if compromised
- Update `DATABASE_URL` password if needed

### 4. **Limit Access**
- Only add team members who need access
- Use Vercel's role-based access control
- Review who has access to environment variables

---

## 📝 Environment Variables Checklist

### Production (Main Project)
- [ ] `DATABASE_URL` - Production database
- [ ] `TARGET_API_URL` - Replicate API endpoint
- [ ] `TARGET_API_KEY` - Replicate API key
- [ ] `ALLOWED_ORIGIN` - Production domain
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `REVENUECAT_WEBHOOK_SECRET` - RevenueCat webhook secret
- [ ] `CRON_SECRET` - Cron endpoint protection
- [ ] `IP_RATE_LIMIT_PER_MINUTE` - (Optional, default: 30)
- [ ] `MAX_CONCURRENT_JOBS` - (Optional, default: 10)

### Staging (Staging Project)
- [ ] `DATABASE_URL` - Staging database
- [ ] `TARGET_API_URL` - Replicate API endpoint
- [ ] `TARGET_API_KEY` - Replicate API key (can be same or test key)
- [ ] `ALLOWED_ORIGIN` - Staging domain
- [ ] `JWT_SECRET` - Different from production
- [ ] `REVENUECAT_WEBHOOK_SECRET` - Staging webhook secret
- [ ] `CRON_SECRET` - Different from production
- [ ] `IP_RATE_LIMIT_PER_MINUTE` - (Optional, can be higher for testing)

### Local Development
- [ ] `DATABASE_URL` - Local or staging database
- [ ] `TARGET_API_URL` - Replicate API endpoint
- [ ] `TARGET_API_KEY` - Your Replicate API key
- [ ] `ALLOWED_ORIGIN` - `*` (for development)
- [ ] `JWT_SECRET` - Local dev secret
- [ ] `NODE_ENV` - `development` (optional, Vercel sets automatically)

---

## 🔍 Verifying Setup

### Test API liveness
```bash
curl https://funnyfy-staging.vercel.app/api/health
# Should return: {"ok":true,"service":"funnyfy-api","ts":"..."}
```

### Test Database Connection
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://funnyfy-staging.vercel.app/api/db-test
# Should return: {"ok":true,"now":"..."}
```

### Test API Endpoint
```bash
curl -X POST https://funnyfy-staging.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -H "X-User-Id: your-user-id" \
  -d '{"payload":{"styleId":"anime","imageUrl":"https://example.com/image.jpg"}}'
```

### Check Environment Variables in Vercel
1. Go to Project → Settings → Environment Variables
2. Verify all required variables are present
3. Check that values are correct (without revealing secrets)

---

## 🆘 Troubleshooting

### "DATABASE_URL not configured"
- **Solution**: Add `DATABASE_URL` to Vercel environment variables
- **Check**: Make sure it's set for the correct environment (Production/Preview)

### "Invalid database connection"
- **Solution**: 
  - Verify connection string format
  - Check password is URL-encoded (special characters)
  - Ensure database is accessible from Vercel's IPs
  - Test connection string in Supabase SQL editor

### "CORS error"
- **Solution**: 
  - Check `ALLOWED_ORIGIN` matches your app's domain exactly
  - For development, use `*` (but not in production)
  - Verify origin header in browser DevTools

### "JWT verification failed"
- **Solution**: 
  - Ensure `JWT_SECRET` is set
  - Use the same secret for signing and verification
  - Check token hasn't expired

### "Webhook signature invalid"
- **Solution**: 
  - Verify `REVENUECAT_WEBHOOK_SECRET` matches RevenueCat dashboard
  - Check webhook URL is correct in RevenueCat settings

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Replicate API Docs](https://replicate.com/docs/reference/http)
- [RevenueCat Webhooks](https://docs.revenuecat.com/docs/webhooks)

---

## 🔄 Updating Environment Variables

### In Vercel:
1. Go to Project → Settings → Environment Variables
2. Click on variable to edit, or "Add New"
3. Update value
4. **Redeploy** for changes to take effect:
   - Automatic: Push to connected branch
   - Manual: Deployments → Redeploy

### After Updating:
- Changes take effect on **next deployment**
- For immediate effect, trigger a redeploy
- Test endpoints to verify changes

---

**Last Updated**: January 2025
