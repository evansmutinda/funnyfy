# Where to Use Your UUID

## Your UUID
```
d0f0c851-fdd8-4b9b-a1bd-b942d9160638
```

---

## Option 1: Use in Browser (Admin Dashboard Login Page)

**Step 1:** Open your browser and go to:
```
https://funnyfy-staging.vercel.app/admin/login
```

**Step 2:** You'll see a login form with a "User ID" field

**Step 3:** Paste your UUID: `d0f0c851-fdd8-4b9b-a1bd-b942d9160638`

**Step 4:** Click "Sign in"

**Step 5:** You should be redirected to the admin dashboard!

---

## Option 2: Test API Directly (PowerShell)

**Run this in PowerShell:**

```powershell
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body '{"userId":"d0f0c851-fdd8-4b9b-a1bd-b942d9160638"}'
```

**This will:**
- Test if the login endpoint works
- Return a JWT token (if successful)
- Show you the response

---

## Important: Check Vercel Settings First

**Before using the UUID, make sure:**

1. Go to: https://vercel.com/dashboard
2. Click your **staging project**
3. **Settings** → **Environment Variables**
4. Find `ADMIN_USER_IDS`
   - **If it exists:** Make sure it's **empty** (or delete it)
   - **If it doesn't exist:** That's fine

**Why?** When `ADMIN_USER_IDS` is empty, the login accepts any valid UUID (for testing).

---

## If Login Page Shows 404

The admin dashboard frontend might not be deployed yet. In that case:

1. **Use Option 2** (PowerShell test) to verify the API works
2. **Tell me** and I'll help deploy the frontend

---

## Summary

**UUID = `d0f0c851-fdd8-4b9b-a1bd-b942d9160638`**

**Use it in:**
- Browser: `https://funnyfy-staging.vercel.app/admin/login` (paste in the form)
- PowerShell: In the command above (to test the API)

**Try the browser first!** That's the easiest way. 🚀

