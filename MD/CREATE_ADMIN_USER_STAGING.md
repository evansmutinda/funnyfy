# Create Admin User - STAGING Environment

## Use Staging URL!

Your staging URL is: **`https://funnyfy-staging.vercel.app`**

---

## Step 1: Create Admin User (STAGING)

**Run this in PowerShell:**

```powershell
$r = Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/auth/token" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "Your User ID: $($r.userId)"; $r.userId | Set-Clipboard; Write-Host "Copied to clipboard!"
```

**Or try the create-admin-user endpoint:**

```powershell
$r = Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/create-admin-user" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "Your User ID: $($r.userId)"; $r.userId | Set-Clipboard; Write-Host "Copied to clipboard!"
```

---

## Step 2: Add to Vercel STAGING Project

1. Go to: https://vercel.com/dashboard
2. Click your **STAGING project** (probably `funnyfy-staging`)
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Key**: `ADMIN_USER_IDS`
   - **Value**: (paste your User ID)
   - Check all: ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**
7. **Redeploy** the staging project

---

## Step 3: Login to STAGING Dashboard

1. Go to: **`https://funnyfy-staging.vercel.app/admin/login`**
2. Enter your User ID
3. Click "Sign in"

---

## Important Notes

- ✅ Use **staging URL** for testing: `https://funnyfy-staging.vercel.app`
- ✅ Add `ADMIN_USER_IDS` to **staging Vercel project**
- ✅ Test on staging first before production
- ⚠️ When ready for production, repeat with production URL

---

## Quick Copy-Paste Commands

**Create User (Staging):**
```powershell
$r = Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/auth/token" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "User ID: $($r.userId)"; $r.userId | Set-Clipboard
```

**Staging Dashboard:**
```
https://funnyfy-staging.vercel.app/admin/login
```

---

Try the staging URL now! 🚀

