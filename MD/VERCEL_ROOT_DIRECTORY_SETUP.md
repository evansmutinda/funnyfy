# Vercel Root Directory Setup - Step by Step

## Why This is Needed

Your project has:
- **API routes** in `api/` folder (serverless functions)
- **Admin dashboard** in `admin/` folder (Next.js app)

Vercel needs to know which folder to build. By default, it looks at the root, but your Next.js app is in `admin/`.

---

## Step-by-Step Instructions

### Step 1: Open Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. **Click your staging project** (probably `funnyfy-staging`)

---

### Step 2: Open Settings

1. **Click "Settings"** (top menu bar)
2. You'll see tabs: General, Environment Variables, Git, etc.

---

### Step 3: Find Root Directory

1. **Click "General"** tab (should be selected by default)
2. **Scroll down** until you see **"Root Directory"**
3. It probably says: `./` (root) or is empty

---

### Step 4: Change Root Directory

1. **Click "Edit"** next to "Root Directory"
2. **Type:** `admin`
3. **Click "Save"**

**⚠️ Important:** This tells Vercel to build the Next.js app from the `admin/` folder.

---

### Step 5: Check Build Settings

1. **Still in Settings**, click **"Build & Development Settings"** (left sidebar)
2. **Verify:**
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

**If these are wrong, fix them and save.**

---

### Step 6: Redeploy

1. **Click "Deployments"** tab (top menu)
2. **Find the latest deployment**
3. **Click the three dots (⋯)** on it
4. **Click "Redeploy"**
5. **Wait 2-3 minutes** for it to finish

---

### Step 7: Test

**After deployment shows ✅ Ready:**

1. **Open:** `https://funnyfy-staging.vercel.app/admin/login`
2. **You should see the login page!** 🎉

---

## ⚠️ Important: This Might Break Your API

**If you set root directory to `admin`, Vercel might not find your `api/` folder.**

**Test your API after deployment:**

```powershell
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body '{"userId":"test"}'
```

**If API returns 404:** We need a different solution (separate project or different structure).

---

## If API Breaks: Alternative Solution

**Option: Keep root as `./` and serve admin differently**

We can create a simpler solution that doesn't require Next.js, or use a different deployment strategy.

**Tell me if the API breaks, and I'll help you fix it!**

---

## Summary

1. ✅ Vercel Dashboard → Settings → General
2. ✅ Change Root Directory to `admin`
3. ✅ Save
4. ✅ Redeploy
5. ✅ Test `/admin/login`
6. ✅ Test `/api/admin/login` (make sure API still works)

**Try it now and let me know what happens!** 🚀

