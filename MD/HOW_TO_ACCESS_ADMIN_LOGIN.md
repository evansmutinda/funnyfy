# How to Access Admin Login Page

## ⚠️ Important: Don't Open the File Directly!

**❌ Wrong:** Opening `login-page.html` from your computer (file://)
**✅ Correct:** Access it through the Vercel URL

---

## Correct Way to Access

### Step 1: Wait for Deployment

Make sure your latest code is deployed to Vercel (wait 1-2 minutes after pushing).

### Step 2: Open in Browser

**Go to this URL in your browser:**

```
https://funnyfy-staging.vercel.app/admin/login
```

**NOT** by opening the file from your computer!

---

## Why This Matters

- **Local file (`file://`)**: Can't make API requests (browser security)
- **Vercel URL (`https://`)**: Can make API requests to your server

---

## Quick Test

1. **Open browser**
2. **Type in address bar:** `https://funnyfy-staging.vercel.app/admin/login`
3. **Press Enter**
4. **You should see the login form**

---

## If You See "Failed to fetch"

**Check:**
1. Are you using the Vercel URL? (not `file://`)
2. Is the deployment finished? (check Vercel dashboard)
3. Try refreshing the page

---

## Summary

**Always use:** `https://funnyfy-staging.vercel.app/admin/login`

**Never use:** Opening the HTML file directly from your computer

