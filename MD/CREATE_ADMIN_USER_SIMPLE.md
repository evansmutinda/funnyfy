# Create Admin User - Simple Method

## The Problem

The `/api/admin/create-admin-user` endpoint failed. This usually means:
- Database tables not created yet, OR
- Database connection issue

## Solution: Use Existing User or Create via Different Method

### Option 1: Use Existing User (Easiest)

If you already have users in your database:

1. **Check your database** for existing user IDs
2. **Or use the mobile app** - it creates users automatically
3. **Get the user ID** from there
4. **Add to Vercel** as `ADMIN_USER_IDS`

---

### Option 2: Create User via Token Endpoint

The `/api/auth/token` endpoint also creates users. Try this:

**In PowerShell:**

```powershell
$r = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/auth/token" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "User ID: $($r.userId)"; $r.userId | Set-Clipboard
```

This should work because it uses the same user creation logic.

---

### Option 3: Check Database Directly

If you have database access:

1. Connect to your Postgres database
2. Run: `SELECT id FROM users LIMIT 1;`
3. Copy any user ID
4. Use that as your admin user ID

---

### Option 4: Skip Admin Check (For Testing)

If you just want to test the dashboard:

1. **Don't set `ADMIN_USER_IDS`** (leave it empty)
2. **Any user ID will work** for login
3. **Create a user** via `/api/auth/token`:
   ```powershell
   $r = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/auth/token" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "User ID: $($r.userId)"
   ```
4. **Use that User ID** to login

---

## Recommended: Try Option 2 First

Run this in PowerShell:

```powershell
$r = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/auth/token" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "Your User ID: $($r.userId)"; $r.userId | Set-Clipboard; Write-Host "Copied to clipboard!"
```

This should work and give you a User ID. Then:
1. Add it to Vercel as `ADMIN_USER_IDS`
2. Login to `/admin/login`

---

## If That Also Fails

The issue is likely:
- Database not set up
- DATABASE_URL not configured in Vercel
- Tables not created

**Check:**
1. Is `DATABASE_URL` set in Vercel environment variables?
2. Have you run the database migrations? (See `api/migrations.sql`)

Let me know what error you get with Option 2!

