# How to Create an Admin User - Step by Step

## 🪟 Windows Users

### Option 1: PowerShell (Easiest - Recommended)

1. **Open PowerShell** (Press `Win + X`, then select "Windows PowerShell" or "Terminal")

2. **Run the script:**
   ```powershell
   cd D:\Cursor\funnyfyapp
   .\scripts\create-admin-user.ps1
   ```

   Or run directly:
   ```powershell
   $response = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/admin/create-admin-user" -Method POST -ContentType "application/json" -Body '{}'
   Write-Host "Your Admin User ID: $($response.userId)"
   ```

3. **Copy the User ID** that appears (it's automatically copied to clipboard!)

---

### Option 2: Using curl (Windows 10+)

1. **Open Command Prompt** or PowerShell

2. **Run:**
   ```cmd
   curl -X POST https://funnyfyapp.vercel.app/api/admin/create-admin-user -H "Content-Type: application/json" -d "{}"
   ```

3. **Look for** `"userId"` in the response and copy it

---

### Option 3: Using Browser (Easiest if scripts don't work)

1. **Install a browser extension** like "REST Client" or use **Postman**

2. **Or use this JavaScript in browser console:**
   ```javascript
   fetch('https://funnyfyapp.vercel.app/api/admin/create-admin-user', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: '{}'
   })
   .then(r => r.json())
   .then(data => {
     console.log('User ID:', data.userId);
     navigator.clipboard.writeText(data.userId);
     alert('User ID copied to clipboard: ' + data.userId);
   });
   ```

---

## 🍎 Mac / Linux Users

### Option 1: Using curl (Built-in)

```bash
curl -X POST https://funnyfyapp.vercel.app/api/admin/create-admin-user \
  -H "Content-Type: application/json" \
  -d '{}'
```

Look for `"userId"` in the response.

---

### Option 2: Using the Script

```bash
cd /path/to/funnyfyapp
bash scripts/create-admin-user.sh
```

---

## 📋 Step-by-Step Visual Guide

### Step 1: Open PowerShell

1. Press `Windows Key + X`
2. Click "Windows PowerShell" or "Terminal"
3. Navigate to your project:
   ```powershell
   cd D:\Cursor\funnyfyapp
   ```

---

### Step 2: Run the Command

**Copy and paste this entire command:**

```powershell
$response = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/admin/create-admin-user" -Method POST -ContentType "application/json" -Body '{}'; Write-Host ""; Write-Host "✅ User created!" -ForegroundColor Green; Write-Host "Your Admin User ID: " -NoNewline; Write-Host $response.userId -ForegroundColor Yellow; Write-Host ""; $response.userId | Set-Clipboard; Write-Host "✅ User ID copied to clipboard!" -ForegroundColor Green
```

**Press Enter**

---

### Step 3: Copy the User ID

You'll see output like:
```
✅ User created!
Your Admin User ID: abc-123-def-456

✅ User ID copied to clipboard!
```

The User ID is automatically copied to your clipboard!

---

### Step 4: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click your **funnyfyapp** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key**: `ADMIN_USER_IDS`
   - **Value**: `paste-your-user-id-here` (paste from clipboard)
   - ✅ Check all: Production, Preview, Development
7. Click **Save**
8. **Redeploy** (or wait for next auto-deploy)

---

## 🆘 Troubleshooting

### "Command not found" or "curl not recognized"

**Solution**: Use PowerShell method (Option 1) instead

---

### "Cannot connect" or "Network error"

**Solutions**:
1. Check your internet connection
2. Make sure `https://funnyfyapp.vercel.app` is accessible
3. Try the browser method (Option 3)

---

### "Invoke-RestMethod not recognized"

**Solution**: 
- Make sure you're in PowerShell (not Command Prompt)
- Or use the browser method (Option 3)

---

### Script won't run

**Solution**: 
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Try again

---

## ✅ Quick Test

After adding the User ID to Vercel:

1. Visit: `https://funnyfyapp.vercel.app/admin/login`
2. Enter your User ID
3. Click "Sign in"
4. You should see the dashboard! 🎉

---

## 📝 Alternative: Use Existing User

If you already have a user ID from your database:

1. Connect to your Postgres database
2. Run: `SELECT id FROM users LIMIT 1;`
3. Copy the ID
4. Add to `ADMIN_USER_IDS` in Vercel

---

**Need help?** Check the error message and try the browser method - it's the most reliable!

