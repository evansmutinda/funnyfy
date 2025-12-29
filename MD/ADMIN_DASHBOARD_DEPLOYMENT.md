# Admin Dashboard Deployment Guide

## Question 1: Do I Need to Create a Separate Vercel Project?

### Answer: **No, but you have options**

You have **3 options** for deploying the admin dashboard:

---

### Option A: Same Vercel Project (Recommended - Zero Extra Setup)

**How it works:**
- The admin dashboard is in the `admin/` folder
- Vercel will detect it as a Next.js app
- It deploys alongside your API
- **Same project, same URL structure**

**URL Structure:**
```
https://funnyfyapp.vercel.app/
├── /api/*              → Your API endpoints
└── /admin/*            → Admin dashboard pages
```

**Setup:**
1. Push code to your repository
2. Vercel automatically detects Next.js in `admin/` folder
3. Deploys everything together
4. **No extra configuration needed!**

**Pros:**
- ✅ Zero setup
- ✅ Same project
- ✅ Same environment variables
- ✅ Free

**Cons:**
- None!

---

### Option B: Separate Vercel Project (Also Free)

**How it works:**
- Deploy `admin/` folder as a separate Vercel project
- Gets its own URL (e.g., `funnyfy-admin.vercel.app`)

**Setup:**
```bash
cd admin
vercel
```

**Pros:**
- ✅ Separate deployment (can update independently)
- ✅ Separate URL
- ✅ Still free

**Cons:**
- Need to set environment variables in both projects

---

### Option C: Monorepo Configuration

**How it works:**
- Configure Vercel to handle monorepo
- More complex setup

**Not recommended** unless you have specific needs.

---

## Recommendation: **Option A (Same Project)**

Just push your code - Vercel will handle it automatically!

---

## Question 2: Where Do I Create Admin Users?

### Answer: **Users are created automatically, you just need to find their IDs**

### Step-by-Step Process:

#### Step 1: Create a User (if you don't have one)

**Option A: Use the Mobile App**
- Open your mobile app
- The app automatically creates a user when you first use it
- User ID is stored in the app

**Option B: Create via API**
```bash
# Create a new user and get the user ID
curl -X POST https://funnyfyapp.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{}'
```

This returns:
```json
{
  "ok": true,
  "token": "...",
  "userId": "abc-123-def-456"  ← This is your user ID
}
```

**Option C: Check Existing Users in Database**
- Connect to your Postgres database
- Run: `SELECT id, revenuecat_user_id, created_at FROM users LIMIT 10;`
- Copy a user ID

---

#### Step 2: Add User ID to Vercel Environment Variable

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `ADMIN_USER_IDS`
   - **Value**: `your-user-id-1,your-user-id-2` (comma-separated)
   - **Environment**: Production, Preview, Development (check all)
5. Click **Save**

---

#### Step 3: Test Admin Login

1. Visit: `https://your-project.vercel.app/admin/login`
2. Enter the user ID you added
3. Click "Sign in"
4. You should be redirected to the dashboard!

---

## Quick Start Guide

### 1. Get a User ID

**Easiest way - Create one via API:**

```bash
# PowerShell
$response = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/auth/token" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{}'

Write-Host "User ID: $($response.userId)"
```

**Or check database:**
```sql
SELECT id FROM users ORDER BY created_at DESC LIMIT 1;
```

---

### 2. Set Environment Variable in Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `ADMIN_USER_IDS`
   - **Value**: `paste-your-user-id-here`
6. Select all environments (Production, Preview, Development)
7. Click **Save**
8. **Redeploy** your project (or wait for next deployment)

---

### 3. Deploy Admin Dashboard

**If using same project (recommended):**
- Just push your code to GitHub
- Vercel will automatically detect and deploy

**If deploying separately:**
```bash
cd admin
npm install
vercel
```

---

## Troubleshooting

### "Access Denied" when logging in

**Problem**: User ID not in `ADMIN_USER_IDS`

**Solution**:
1. Check `ADMIN_USER_IDS` in Vercel environment variables
2. Make sure user ID is correct (no extra spaces)
3. Redeploy after changing env vars

### "User not found"

**Problem**: User ID doesn't exist in database

**Solution**:
1. Create user first (via API or app)
2. Get the actual user ID from database
3. Add to `ADMIN_USER_IDS`

### Admin dashboard not loading

**Problem**: Next.js app not detected

**Solution**:
1. Make sure `admin/` folder has `package.json` with Next.js
2. Check Vercel build logs
3. May need to configure build settings in Vercel

---

## Summary

1. **Vercel Project**: Use the **same project** - no need to create a new one
2. **Admin Users**: 
   - Create a user via API or use existing one
   - Get the user ID
   - Add to `ADMIN_USER_IDS` in Vercel
   - Redeploy

That's it! 🚀

