# Admin Dashboard - Login Now! 🎉

## ✅ Status: Endpoint is Working!

The endpoint is deployed and working. You just need a valid UUID to login.

---

## Step 1: Generate a UUID

**In PowerShell, run:**

```powershell
[guid]::NewGuid().ToString()
```

**Copy the result** (it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

## Step 2: Make Sure ADMIN_USER_IDS is Empty

**In Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Click your **staging project**
3. Click **Settings** → **Environment Variables**
4. Find `ADMIN_USER_IDS`
   - **If it exists:** Make sure it's **empty** (or delete it)
   - **If it doesn't exist:** That's fine, leave it
5. **Redeploy** if you changed it (click "Deployments" → "Redeploy")

---

## Step 3: Access the Login Page

**Open in your browser:**

```
https://funnyfy-staging.vercel.app/admin/login
```

---

## Step 4: Login

1. **Paste your UUID** in the login form
2. **Click "Sign in"**
3. **You should see the dashboard!** 🎉

---

## If Login Page Shows 404

The admin dashboard frontend might not be deployed yet. Let me know and I'll help you deploy it.

---

## Quick Test (Optional)

**Test the login endpoint directly:**

```powershell
# Replace YOUR_UUID with the UUID you generated
$uuid = "YOUR_UUID_HERE"
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin/login" -Method POST -ContentType "application/json" -Body "{`"userId`":`"$uuid`"}"
```

**Expected result:**
```json
{
  "ok": true,
  "token": "eyJhbGc...",
  "userId": "your-uuid",
  "role": "admin"
}
```

---

**Generate your UUID now and try logging in!** 🚀

