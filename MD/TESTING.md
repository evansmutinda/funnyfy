# Testing Guide

## Environments

| Environment | URL |
|-------------|-----|
| Staging | `https://funnyfy-staging.vercel.app` |
| Production | `https://funnyfyapp.vercel.app` |
| Admin | `<env-url>/admin/login` |

**Note**: The mobile app `.env` file sets which backend it connects to. Default for testing is staging.

---

## Method 1: Test the API Directly (Quick Check)

### Using PowerShell (Windows)

```powershell
# Test the generation endpoint
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/test" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"payload":{"styleId":"90s-cartoon","imageUrl":"https://example.com/photo.jpg"}}'

# Test the auth endpoint (creates/returns a user)
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/auth/token" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{}'

# Test subscription status (replace with real userId and token)
$headers = @{ "x-user-id" = "YOUR-USER-ID"; "Authorization" = "Bearer YOUR-TOKEN" }
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/user/subscription" `
  -Headers $headers
```

### Using curl (Linux/Mac/WSL)

```bash
curl -X POST https://funnyfy-staging.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Method 2: Test from Mobile App (Expo Go or Dev Build)

### Step 1: Set Environment

In `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://funnyfy-staging.vercel.app
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=test_kXXXX...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_kXXXX...
```

### Step 2: Install Dependencies

```bash
cd apps/mobile
npm install
```

### Step 3: Start Expo

```bash
npm start
```

Scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app (then Expo Go)

### Step 4: Test Key Flows

1. **Auth flow**: App should silently get a user ID from backend on first launch (check Metro logs for `[Auth] Got token from backend`)
2. **Style selection**: Tap any style, verify selection highlights
3. **Image upload**: Pick from gallery or camera
4. **Generation**: Tap Generate — should show pulsing "Processing…" indicator
5. **Result**: Before/after slider should work; Save and Share should work
6. **Gallery**: Saved images should appear in Gallery screen
7. **Subscription screen**: Current plan, usage, and plan cards should display

---

## Method 3: Build and Test APK (Android)

```bash
cd apps/mobile
npx expo build:android
# OR with EAS:
eas build --platform android --profile preview
```

Install the APK on a physical Android device for realistic testing.

---

## Testing Subscription Flows

### RevenueCat Test Store (Sandbox)
1. Use the Test Store SDK key in `.env`
2. Open the Subscription screen in the app
3. Tap a plan and attempt purchase — RevenueCat Test Store handles this without real charges
4. Check Vercel logs for webhook events (`INITIAL_PURCHASE`, etc.)

### Verify Webhook
```powershell
# Trigger a test event from RevenueCat dashboard → Integrations → Webhooks → Send test event
# Then check Vercel function logs for:
# [revenuecat-webhook] Received event: TEST
```

---

## Testing NSFW Moderation

Upload an image via the app. If Sightengine returns `nudity.raw >= 0.3`, you'll see the toast:
> "This image cannot be processed. Please use an appropriate photo."

Check Supabase `infringements` table to verify the record was created.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `[Auth] Backend unavailable, using local ID` | Backend DB is down or auth endpoint missing; app still works with local ID |
| `Network or server error` | Check `EXPO_PUBLIC_API_URL` in `.env`; verify Vercel deployment is live |
| `TARGET_API_URL not configured` | Set env vars in Vercel dashboard and redeploy |
| CORS errors | Verify `ALLOWED_ORIGIN` is set to `*` or your app origin in Vercel |
| RevenueCat `No offerings` | Check products are set up in RevenueCat dashboard (see `REVENUECAT_SETUP.md`) |

---

## Quick Test Checklist

- [ ] `/api/auth/token` returns `{ ok: true, userId, token }`
- [ ] `/api/styles` returns list of 21 styles
- [ ] `/api/user/subscription` returns plan and usage (with valid auth headers)
- [ ] App launches and gets user ID without errors
- [ ] Style selection works
- [ ] Image upload and generation completes
- [ ] Result screen: slider, save, share all work
- [ ] Gallery screen shows saved images
- [ ] Subscription screen shows plan cards
- [ ] Toast notifications appear (not system Alert dialogs)
- [ ] Privacy Policy and Terms open correctly from Settings/Menu

---

**Last Updated**: May 2026
