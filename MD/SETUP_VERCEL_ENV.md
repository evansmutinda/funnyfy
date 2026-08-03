# Quick Guide: Setting Up Environment Variables in Vercel

## Step-by-Step Instructions

### 1. Access Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (e.g., `funnyfyapp` or `funnyfy-staging`)
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### 2. Add Variables

For each variable:

1. Click **"Add New"** button
2. Enter the **Key** (variable name)
3. Enter the **Value** (variable value)
4. Select **Environments**:
   - ✅ **Production** (for main branch)
   - ✅ **Preview** (for PR branches)
   - ✅ **Development** (for local dev, optional)
5. Click **"Save"**

### 3. Required Variables (Copy-Paste Ready)

#### For Production Project (`funnyfyapp`)

```
DATABASE_URL
TARGET_API_URL
TARGET_API_KEY
ALLOWED_ORIGIN
JWT_SECRET
REVENUECAT_WEBHOOK_SECRET
CRON_SECRET
```

#### For Staging Project (`funnyfy-staging`)

```
DATABASE_URL (staging database)
TARGET_API_URL
TARGET_API_KEY
ALLOWED_ORIGIN (https://funnyfy-staging.vercel.app)
JWT_SECRET (different from production)
REVENUECAT_WEBHOOK_SECRET (staging secret)
CRON_SECRET (different from production)
```

### 4. Quick Reference: Where to Get Values

| Variable | Where to Get |
|----------|-------------|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection String (Transaction Pooler) |
| `TARGET_API_KEY` | [Replicate Dashboard](https://replicate.com/account/api-tokens) → API Tokens |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CRON_SECRET` | Same as JWT_SECRET (generate new one). Also paste into [cron-job.org](https://cron-job.org/) → your job → **Authorization** header as `Bearer <CRON_SECRET>` |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat → Project Settings → Webhooks → Webhook Secret |
| `ALLOWED_ORIGIN` | Your Vercel deployment URL (e.g., `https://funnyfyapp.vercel.app`) |

### 5. After Adding Variables

**Important**: Environment variables take effect on the **next deployment**.

To apply immediately:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

Or simply push a new commit to trigger a deployment.

### 6. Verify Setup

Test your setup:

```bash
# Liveness (public)
curl https://funnyfy-staging.vercel.app/api/health

# Database (ops — CRON_SECRET header)
curl -H "Authorization: Bearer $CRON_SECRET" https://funnyfy-staging.vercel.app/api/db-test
# Should return: {"ok":true,"now":"..."}
```

### 7. Common Issues

#### ❌ "Variable not found"
- **Fix**: Check variable name spelling (case-sensitive)
- **Fix**: Verify environment is selected (Production/Preview)

#### ❌ "Changes not taking effect"
- **Fix**: Redeploy the project
- **Fix**: Check you're testing the correct environment

#### ❌ "Database connection failed"
- **Fix**: Verify `DATABASE_URL` format
- **Fix**: URL-encode special characters in password
- **Fix**: Check database is accessible (not IP-restricted)

---

## 📸 Visual Guide

### Adding a Variable

```
Settings → Environment Variables → Add New
┌─────────────────────────────────────┐
│ Key: DATABASE_URL                   │
│ Value: postgresql://...             │
│                                     │
│ Environments:                       │
│ ☑ Production                        │
│ ☑ Preview                           │
│ ☐ Development                       │
│                                     │
│ [Save]                              │
└─────────────────────────────────────┘
```

### Viewing Variables

```
Environment Variables
├─ DATABASE_URL (Production, Preview)
├─ TARGET_API_KEY (Production, Preview)
├─ ALLOWED_ORIGIN (Production, Preview)
└─ ...
```

---

## 🔒 Security Notes

1. **Never share** environment variable values publicly
2. **Use different secrets** for staging and production
3. **Rotate secrets** periodically
4. **Limit access** to team members who need it

---

**Need Help?** See `MD/ENV_SETUP.md` for detailed documentation.
