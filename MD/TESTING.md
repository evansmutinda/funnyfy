# Testing Guide

## Method 1: Test Vercel API Endpoint Directly (Quick Test)

### Using curl (Command Line)

```bash
curl -X POST https://funnyfyapp.vercel.app/api/test \
  -H "Content-Type: application/json" \
  -d '{"payload":{"prompt":"A beautiful sunset over mountains"}}'
```

### Using PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "https://funnyfyapp.vercel.app/api/test" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"payload":{"prompt":"A beautiful sunset over mountains"}}'
```

### Expected Response

If successful, you should see a response like:
```json
{
  "ok": true,
  "status": 201,
  "data": {
    "id": "prediction-id-here",
    "status": "starting",
    "created_at": "...",
    ...
  }
}
```

This confirms your Vercel endpoint is working and can reach Replicate.

---

## Method 2: Test from Mobile App

### Step 1: Set up Environment Variables

1. Navigate to the mobile app directory:
   ```bash
   cd apps/mobile
   ```

2. Create a `.env` file (copy from `env.example`):
   ```bash
   copy env.example .env
   ```

3. Edit `.env` and ensure it has:
   ```
   EXPO_PUBLIC_API_URL=https://funnyfyapp.vercel.app
   ```

### Step 2: Install Dependencies (if not already done)

```bash
cd apps/mobile
npm install
```

### Step 3: Start the Expo Development Server

```bash
npm start
```

This will:
- Start the Metro bundler
- Show a QR code in the terminal
- Open Expo DevTools in your browser

### Step 4: Run on Device/Emulator

**Option A: Use Expo Go App (Easiest)**
1. Install "Expo Go" app on your phone (iOS/Android)
2. Scan the QR code from the terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

**Option B: Use Emulator/Simulator**
- **Android**: `npm run android` (requires Android Studio/emulator)
- **iOS**: `npm run ios` (requires Xcode, macOS only)

### Step 5: Test the API Call

1. Once the app opens, you'll see:
   - Current API Base URL displayed at the top
   - A text input for the prompt
   - A "Call API" button

2. Enter a test prompt (e.g., "A beautiful sunset over mountains")

3. Tap "Call API"

4. You should see:
   - Loading indicator while processing
   - Either:
     - **Success**: Result displayed in a box below
     - **Error**: Error message in red

---

## Troubleshooting

### Issue: "Network or server error"
- Check that `EXPO_PUBLIC_API_URL` is set correctly
- Verify Vercel deployment is live
- Check Vercel function logs for errors

### Issue: "TARGET_API_URL not configured"
- Verify environment variables are set in Vercel dashboard
- Redeploy after setting environment variables

### Issue: "Non-JSON response"
- Check Vercel function logs
- Verify Replicate API key is correct
- Check that the Replicate endpoint URL is correct

### Issue: CORS errors
- Verify `ALLOWED_ORIGIN` is set to `*` in Vercel
- Check that CORS headers are being set correctly

---

## Quick Test Checklist

- [ ] Vercel endpoint responds to direct curl/Postman test
- [ ] Environment variables set in Vercel dashboard
- [ ] `.env` file created in `apps/mobile` with `EXPO_PUBLIC_API_URL`
- [ ] Mobile app dependencies installed
- [ ] Expo dev server running
- [ ] App opens on device/emulator
- [ ] API call succeeds from mobile app
- [ ] Response data displays correctly
