# Simple Admin Login Solution

## The Problem

Vercel doesn't automatically detect Next.js apps in subdirectories, and the "Root Directory" setting isn't available in your Vercel project.

## The Solution

I've created a **simple HTML login page** that doesn't require Next.js. It's just a static file that calls your API.

---

## What I Created

**File:** `api/admin/login-page.html`

This is a simple, self-contained HTML page that:
- ✅ Works without Next.js
- ✅ Calls your existing `/api/admin/login` endpoint
- ✅ Stores the JWT token in localStorage
- ✅ Looks professional with modern styling

---

## How to Use It

### Step 1: The file is already created

The file `api/admin/login-page.html` is in your project.

### Step 2: Deploy it

**Push to GitHub:**

```powershell
cd D:\Cursor\funnyfyapp
git add api/admin/login-page.html
git commit -m "Add simple admin login page"
git push origin Staging
```

### Step 3: Access it

**After deployment (1-2 minutes), go to:**

```
https://funnyfy-staging.vercel.app/api/admin/login-page.html
```

**Or create a redirect:**

We can add a rewrite rule in `vercel.json` to make it accessible at `/admin/login`.

---

## Next Steps

1. **Test the login page** (after deploying)
2. **Create a simple dashboard** (I can create `api/admin/dashboard.html` next)
3. **Or use the existing Next.js dashboard** (if we set up a separate Vercel project)

---

## Option: Add Rewrite Rule

**To make it accessible at `/admin/login` instead of `/api/admin/login-page.html`:**

I can update `vercel.json` to add a rewrite rule. Would you like me to do that?

---

## Quick Test

**After deploying, test with your UUID:**

1. Go to: `https://funnyfy-staging.vercel.app/api/admin/login-page.html`
2. Paste UUID: `d0f0c851-fdd8-4b9b-a1bd-b942d9160638`
3. Click "Sign in"
4. Should redirect to dashboard (once we create it)

---

**Let me know if you want me to:**
- A) Add the rewrite rule to make it `/admin/login`
- B) Create a simple dashboard HTML page
- C) Set up a separate Vercel project for the Next.js app

**For now, let's deploy this simple login page and test it!** 🚀

