# Deploy Admin Dashboard - Simple Steps

## Current Status

✅ Your code is saved
✅ Git is set up
✅ You're on the "Staging" branch
✅ Files are tracked by Git

## Next Steps

### Step 1: Check if Files Need to be Committed

**In PowerShell, run:**

```powershell
cd D:\Cursor\funnyfyapp
git status
```

**If it says "nothing to commit"** → Go to Step 2
**If it shows files** → Run: `git add .` then `git commit -m "Add admin dashboard"`

---

### Step 2: Push to GitHub

**In PowerShell, run:**

```powershell
git push origin Staging
```

This uploads your code to GitHub.

---

### Step 3: Check Vercel Deployment

1. **Go to:** https://vercel.com/dashboard
2. **Click your staging project** (`funnyfy-staging`)
3. **Click "Deployments" tab**
4. **Look for a new deployment** (should appear in 1-2 minutes)
5. **Wait for it to finish** (green checkmark ✅)

---

### Step 4: Test the Endpoint

**Once deployment is done, test in PowerShell:**

```powershell
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body '{"userId":"test"}'
```

**Expected results:**
- ✅ If you get an error about "invalid credentials" or "user not found" → **Good!** Endpoint works
- ❌ If you get "404 NOT_FOUND" → Deployment didn't work, check Step 3

---

### Step 5: Set Up Admin Access

1. **Go to Vercel Dashboard:**
   - Click staging project
   - **Settings** → **Environment Variables**
   - **Make sure `ADMIN_USER_IDS` is empty** (or doesn't exist)

2. **Redeploy** (if you changed env vars)

---

### Step 6: Generate Test UUID and Login

**Generate UUID:**
```powershell
[guid]::NewGuid().ToString()
```

**Copy the result, then:**
1. Go to: `https://funnyfy-staging.vercel.app/admin/login`
2. Paste the UUID
3. Click "Sign in"
4. You should see the dashboard! 🎉

---

## Quick Commands (Copy-Paste)

**Push code:**
```powershell
cd D:\Cursor\funnyfyapp
git push origin Staging
```

**Test endpoint:**
```powershell
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body '{"userId":"test"}'
```

**Generate UUID:**
```powershell
[guid]::NewGuid().ToString()
```

---

## If Something Goes Wrong

**"Nothing to push"** → Code is already on GitHub, check Vercel deployment

**"404 still"** → 
1. Check Vercel deployment finished
2. Wait 2-3 minutes (sometimes takes time)
3. Check you're using staging URL: `funnyfy-staging.vercel.app`

**"Access Denied"** → Make sure `ADMIN_USER_IDS` is empty in Vercel

---

**Let's start with Step 2 - push your code!** 🚀

