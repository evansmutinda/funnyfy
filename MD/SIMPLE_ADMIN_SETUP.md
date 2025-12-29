# Simple Admin Setup - Step by Step

## What You Need to Do

You need to:
1. Get a User ID (like a password)
2. Tell Vercel that this User ID is an admin
3. Login to the dashboard

That's it!

---

## Step 1: Get Your User ID (2 minutes)

### Easiest Way - Use Your Browser:

1. **Open Google Chrome** (or any browser)

2. **Press F12** on your keyboard (this opens Developer Tools)

3. **Click the "Console" tab** at the top

4. **Copy and paste this code** into the console:

```javascript
fetch('https://funnyfy-staging.vercel.app/api/admin/create-admin-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}'
})
.then(r => r.json())
.then(data => {
  alert('Your Admin User ID: ' + data.userId);
  navigator.clipboard.writeText(data.userId);
  console.log('User ID:', data.userId);
});
```

5. **Press Enter**

6. **A popup will appear** with your User ID - **copy it!** (It's also copied to your clipboard automatically)

**Example of what you'll see:**
```
Your Admin User ID: abc-123-def-456-789
```

---

## Step 2: Add User ID to Vercel (3 minutes)

1. **Go to**: https://vercel.com/dashboard

2. **Click on your project** (probably called "funnyfyapp")

3. **Click "Settings"** (at the top of the page)

4. **Click "Environment Variables"** (on the left side)

5. **Click "Add New"** button

6. **Fill in the form:**
   - **Key**: Type exactly: `ADMIN_USER_IDS`
   - **Value**: Paste your User ID (the one you copied in Step 1)
   - **Check all three boxes**: ✅ Production, ✅ Preview, ✅ Development

7. **Click "Save"**

8. **Important**: Click "Redeploy" button (or wait a few minutes for it to auto-deploy)

---

## Step 3: Login to Dashboard (1 minute)

1. **Go to**: https://funnyfy-staging.vercel.app/admin/login

2. **Enter your User ID** (the same one from Step 1)

3. **Click "Sign in"**

4. **You're in!** 🎉

---

## That's It!

You now have:
- ✅ Admin dashboard access
- ✅ Can see queue stats
- ✅ Can see security logs
- ✅ Can monitor costs

---

## Need Help?

### If the browser method doesn't work:

**Try this instead - Use PowerShell:**

1. Press `Windows Key + X`
2. Click "Windows PowerShell"
3. Copy and paste this (all on one line):

```powershell
$r = Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/admin/create-admin-user" -Method POST -ContentType "application/json" -Body '{}'; Write-Host "Your User ID: $($r.userId)"; $r.userId | Set-Clipboard; Write-Host "Copied to clipboard!"
```

4. Press Enter
5. Copy the User ID that appears
6. Go to Step 2 above

---

## Visual Guide

```
Step 1: Browser Console
┌─────────────────────────┐
│ Press F12              │
│ Click "Console" tab    │
│ Paste code             │
│ Press Enter            │
│ Copy User ID           │
└─────────────────────────┘
         ↓
Step 2: Vercel Dashboard
┌─────────────────────────┐
│ Settings                │
│ Environment Variables   │
│ Add: ADMIN_USER_IDS     │
│ Paste User ID           │
│ Save & Redeploy         │
└─────────────────────────┘
         ↓
Step 3: Login
┌─────────────────────────┐
│ Visit /admin/login      │
│ Enter User ID           │
│ Sign in                 │
│ Done! 🎉                │
└─────────────────────────┘
```

---

**Just follow these 3 steps - it's really that simple!**

