# Environment Variables - Quick Start

## 🚀 Fast Setup (5 minutes)

### Step 1: Generate Secrets

```bash
npm run generate-secrets
```

Copy the generated secrets to use in Step 2.

### Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
2. Add these variables:

#### Required Variables

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` | Supabase → Project Settings → Database → Connection String |
| `TARGET_API_URL` | `https://api.replicate.com/v1/predictions` | (Fixed value) |
| `TARGET_API_KEY` | `r8_xxxxx` | [Replicate Dashboard](https://replicate.com/account/api-tokens) |
| `ALLOWED_ORIGIN` | `https://funnyfyapp.vercel.app` | Your Vercel deployment URL |

#### Recommended Variables

| Variable | Value | How to Get |
|----------|-------|------------|
| `JWT_SECRET` | `xxxxx...` | Run `npm run generate-secrets` |
| `CRON_SECRET` | `xxxxx...` | Run `npm run generate-secrets` — also set in [cron-job.org](https://cron-job.org/) as `Authorization: Bearer <CRON_SECRET>` |
| `REVENUECAT_WEBHOOK_SECRET` | `whsec_xxxxx...` | RevenueCat Dashboard → Integrations → Webhooks (see `MD/REVENUECAT_WEBHOOK_SETUP.md`) |

#### Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `IP_RATE_LIMIT_PER_MINUTE` | `60` | Max requests per IP per minute (burst protection) |
| `MAX_CONCURRENT_JOBS` | `10` | Max concurrent queue jobs |

### Step 3: Redeploy

After adding variables, redeploy:
- **Automatic**: Push a commit to your branch
- **Manual**: Deployments → Redeploy

### Step 4: Verify

```bash
# Liveness (public — uptime monitors)
curl https://funnyfy-staging.vercel.app/api/health

# Database (requires CRON_SECRET from Vercel env)
curl -H "Authorization: Bearer $CRON_SECRET" https://funnyfy-staging.vercel.app/api/db-test
# Should return: {"ok":true,"now":"..."}
```

---

## 📋 Checklist

### Production Project
- [ ] `DATABASE_URL` - From Supabase
- [ ] `TARGET_API_URL` - `https://api.replicate.com/v1/predictions`
- [ ] `TARGET_API_KEY` - From Replicate
- [ ] `ALLOWED_ORIGIN` - Your production URL
- [ ] `JWT_SECRET` - Generated secret
- [ ] `CRON_SECRET` - Generated secret
- [ ] `REVENUECAT_WEBHOOK_SECRET` - From RevenueCat (if using subscriptions)

### Staging Project
- [ ] Same as above, but with staging database and staging URL

---

## 🔧 Local Development

1. Copy example file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your values

3. Run Vercel dev:
   ```bash
   npx vercel dev
   ```

4. Verify setup:
   ```bash
   npm run verify-env
   ```

---

## 🆘 Troubleshooting

### "Variable not found"
- Check spelling (case-sensitive)
- Verify environment is selected (Production/Preview)
- Redeploy after adding variables

### "Database connection failed"
- Verify `DATABASE_URL` format
- URL-encode special characters in password (`@` → `%40`)
- Check Supabase connection string uses Transaction Pooler

### "CORS error"
- Check `ALLOWED_ORIGIN` matches your domain exactly
- For development, use `*` (not for production)

---

## 📚 More Details

- **Full Documentation**: See `MD/ENV_SETUP.md`
- **Vercel Setup Guide**: See `MD/SETUP_VERCEL_ENV.md`
- **Security Guide**: See `api/SECURITY.md`

---

**Need Help?** Check the detailed guides or verify your setup with `npm run verify-env`
