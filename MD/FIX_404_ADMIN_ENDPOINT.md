# Fix 404 Error - Admin Endpoint

## The Situation

✅ Code is on Staging branch
✅ Code is pushed to GitHub
❌ Getting 404 when accessing `/api/admin/login`

This means Vercel hasn't deployed the new files yet.

---

## Quick Fix: Trigger Redeploy

### Option 1: Redeploy in Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Click your staging project**
3. **Click "Deployments" tab**
4. **Find the latest deployment**
5. **Click the three dots (⋯)** on it
6. **Click "Redeploy"**
7. **Wait 1-2 minutes**

---

### Option 2: Make a Small Change to Trigger Deploy

**In PowerShell:**

```powershell
cd D:\Cursor\funnyfyapp
# Add a comment to trigger redeploy
git commit --allow-empty -m "Trigger redeploy for admin endpoints"
git push origin Staging
```

This creates an empty commit and pushes it, which will trigger Vercel to redeploy.

---

### Option 3: Check Vercel Logs

1. **Go to Vercel Dashboard**
2. **Click your staging project**
3. **Click "Deployments"**
4. **Click on the latest deployment**
5. **Check the "Build Logs"**
6. **Look for errors** - are the files being built?

---

## After Redeploy

**Wait 2 minutes, then test:**

```powershell
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body '{"userId":"test"}'
```

**Expected:**
- ✅ Any error EXCEPT 404 = Endpoint exists!
- ❌ Still 404 = Check build logs for errors

---

## If Still 404 After Redeploy

**Check these:**

1. **File path is correct:**
   - File should be: `api/admin/login.ts`
   - Endpoint will be: `/api/admin/login`

2. **Vercel is building the files:**
   - Check build logs
   - Look for "api/admin/login.ts" in the logs

3. **Try accessing other admin endpoints:**
   ```powershell
   # Test queue-stats
   Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/queue-stats" -Method GET
   ```

---

## Simplest Solution Right Now

**Run this to trigger a redeploy:**

```powershell
cd D:\Cursor\funnyfyapp
git commit --allow-empty -m "Redeploy"
git push origin Staging
```

**Then:**
1. Go to Vercel Dashboard
2. Watch for new deployment (appears in 30 seconds)
3. Wait for it to finish (1-2 minutes)
4. Test the endpoint again

---

**Try the empty commit method - it's the fastest way to trigger a redeploy!** 🚀

