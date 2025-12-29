# Admin Dashboard - Quick Start Guide

## 🚀 Fast Setup (5 Minutes)

### Step 1: Create an Admin User

**Easiest way - Use the API:**

```bash
# PowerShell
$response = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/admin/create-admin-user" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{}'

$userId = $response.userId
Write-Host "Your Admin User ID: $userId"
Write-Host "Copy this ID!"
```

**Or use curl:**
```bash
curl -X POST https://funnyfyapp.vercel.app/api/admin/create-admin-user \
  -H "Content-Type: application/json" \
  -d '{}'
```

Copy the `userId` from the response.

---

### Step 2: Add to Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Click your **funnyfyapp** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key**: `ADMIN_USER_IDS`
   - **Value**: `paste-your-user-id-here`
   - Check all environments: ✅ Production, ✅ Preview, ✅ Development
7. Click **Save**
8. **Important**: Redeploy your project (or wait for next auto-deploy)

---

### Step 3: Deploy Admin Dashboard

**Same Project (Recommended - Zero Setup):**
- Just push your code to GitHub
- Vercel automatically detects Next.js in `admin/` folder
- That's it! ✅

**Or Deploy Separately:**
```bash
cd admin
npm install
vercel
```

---

### Step 4: Access Dashboard

1. Visit: `https://funnyfyapp.vercel.app/admin/login`
2. Enter your user ID (the one you copied in Step 1)
3. Click "Sign in"
4. You're in! 🎉

---

## ✅ Checklist

- [ ] Created admin user via API
- [ ] Copied user ID
- [ ] Added `ADMIN_USER_IDS` to Vercel environment variables
- [ ] Redeployed project (or wait for auto-deploy)
- [ ] Tested login at `/admin/login`

---

## 🆘 Troubleshooting

### "Access Denied" Error

**Fix**: 
- Make sure user ID is in `ADMIN_USER_IDS` env var
- Check for typos (no extra spaces)
- Redeploy after changing env vars

### "User Not Found" Error

**Fix**:
- User ID doesn't exist in database
- Create a new user via `/api/admin/create-admin-user`
- Use the returned user ID

### Dashboard Not Loading

**Fix**:
- Check Vercel build logs
- Make sure `admin/package.json` exists
- Verify Next.js is installed: `cd admin && npm install`

---

## 📝 Notes

- **No separate Vercel project needed** - uses same project
- **Free** - everything on Vercel free tier
- **Secure** - JWT authentication with admin role check
- **Same database** - uses your existing Postgres

---

**That's it! You're ready to use the admin dashboard.** 🚀

