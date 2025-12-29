# Fix 404 Error - Admin Dashboard

## The Problem

The admin dashboard (Next.js app in `admin/` folder) is not being deployed by Vercel because Vercel doesn't automatically detect Next.js in subdirectories.

---

## Solution: Configure Vercel Project Settings

### Step 1: Go to Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Click your staging project** (`funnyfy-staging`)

### Step 2: Configure Root Directory

1. **Click "Settings"** (top menu)
2. **Click "General"** (left sidebar)
3. **Scroll down to "Root Directory"**
4. **Click "Edit"**
5. **Select "admin"** from the dropdown (or type `admin`)
6. **Click "Save"**

### Step 3: Configure Build Settings

1. **Still in Settings**, click **"Build & Development Settings"**
2. **Framework Preset:** Should be "Next.js" (auto-detected)
3. **Build Command:** Should be `npm run build` (auto-detected)
4. **Output Directory:** Should be `.next` (auto-detected)
5. **Install Command:** Should be `npm install` (auto-detected)

### Step 4: Redeploy

1. **Go to "Deployments" tab**
2. **Click "Redeploy"** on the latest deployment
3. **Wait 2-3 minutes** for it to finish

### Step 5: Test

**After deployment finishes:**

1. **Go to:** `https://funnyfy-staging.vercel.app/admin/login`
2. **Should see the login page!** ✅

---

## Alternative: If Root Directory Doesn't Work

If setting root directory to `admin` breaks your API routes, we have two options:

### Option A: Separate Vercel Project (Recommended for Production)

1. **Create a new Vercel project** for the admin dashboard
2. **Connect it to the same GitHub repo**
3. **Set root directory to `admin`**
4. **Deploy separately**

This keeps API and admin dashboard separate.

### Option B: Move Admin to Root (Simpler, but changes structure)

Move the admin folder contents to root (not recommended, but works).

---

## Quick Test: Check if API Still Works

**After changing root directory, test your API:**

```powershell
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body '{"userId":"test"}'
```

**If API breaks:** We need Option A (separate project) or a different approach.

---

## What to Do Now

1. **Try Step 1-4 above** (configure root directory)
2. **If it works:** Great! ✅
3. **If API breaks:** Tell me and we'll use Option A (separate project)

**Start with Step 1 - configure the root directory in Vercel!** 🚀

