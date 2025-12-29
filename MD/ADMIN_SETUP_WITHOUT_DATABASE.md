# Admin Setup - Workaround (No Database Needed)

## The Problem

The database connection is failing, so we can't create users. But we can still test the admin dashboard!

## Solution: Use a Test UUID (No Database Required)

### Step 1: Generate a Test User ID

**Option A: Use Online Generator**
1. Go to: https://www.uuidgenerator.net/
2. Click "Generate UUID"
3. Copy the UUID (looks like: `123e4567-e89b-12d3-a456-426614174000`)

**Option B: Use PowerShell**
```powershell
[guid]::NewGuid().ToString()
```

This will generate a UUID like: `abc-123-def-456-789`

---

### Step 2: Skip Admin Check (For Testing)

1. Go to Vercel Dashboard → **Staging Project** (`funnyfy-staging`)
2. Go to **Settings** → **Environment Variables**
3. **DON'T add `ADMIN_USER_IDS`** (leave it empty)
   - When empty, the admin check is skipped
   - Any user ID will work for login

---

### Step 3: Login with Test UUID

1. Go to: `https://funnyfy-staging.vercel.app/admin/login`
2. Enter your test UUID (from Step 1)
3. Click "Sign in"
4. It should work! ✅

---

## Why This Works

When `ADMIN_USER_IDS` is empty, the admin login endpoint allows any user ID. This is perfect for testing before the database is fully set up.

---

## Fix Database Later

Once your database is working:
1. Create a real user via `/api/auth/token`
2. Get the real user ID
3. Add it to `ADMIN_USER_IDS` in Vercel
4. Then only that user ID will work

---

## Quick Test Right Now

1. **Generate UUID:**
   ```powershell
   [guid]::NewGuid().ToString()
   ```
   Copy the result

2. **Make sure `ADMIN_USER_IDS` is NOT set** in Vercel staging (or set it to empty string)

3. **Login:**
   - Go to: `https://funnyfy-staging.vercel.app/admin/login`
   - Paste your UUID
   - Click "Sign in"

This should work immediately! 🚀

