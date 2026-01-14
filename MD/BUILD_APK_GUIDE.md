# How to Build APK for FunnyFy App

## Prerequisites

1. **EAS CLI installed** (if not already):
   ```bash
   npm install -g eas-cli
   ```

2. **Logged into EAS** (if not already):
   ```bash
   eas login
   ```

3. **Navigate to mobile app directory**:
   ```bash
   cd apps/mobile
   ```

---

## Build Options

You have two build profiles configured for APK:

### Option 1: Preview Build (Recommended for Testing)

**Best for**: Testing on your device, sharing with testers

```bash
cd apps/mobile
eas build --profile preview --platform android
```

**What this does:**
- Builds an APK file
- Internal distribution (not for Play Store)
- Good for testing subscription features
- Download link will be provided when build completes

**Time**: ~10-15 minutes

---

### Option 2: Production Build (For Play Store or Final Testing)

**Best for**: Production release or final testing

```bash
cd apps/mobile
eas build --profile production --platform android
```

**What this does:**
- Builds an APK file
- Production-ready build
- Can be used for Play Store submission or testing
- Download link will be provided when build completes

**Time**: ~10-15 minutes

---

## Build Process

1. **Run the build command** (choose one above)

2. **EAS will prompt you**:
   - If you need to configure anything
   - If you want to use existing credentials or create new ones

3. **Build happens in the cloud**:
   - You'll see a build URL
   - You can watch progress in terminal or visit the URL
   - Build typically takes 10-15 minutes

4. **Download the APK**:
   - When build completes, you'll get a download link
   - Click the link to download the APK
   - Or check your EAS dashboard: https://expo.dev/accounts/[your-account]/projects/funnyfy/builds

---

## Installing the APK

### On Android Device:

1. **Enable "Install from Unknown Sources"**:
   - Go to Settings → Security
   - Enable "Install unknown apps" or "Unknown sources"

2. **Transfer APK to device**:
   - Download APK on your computer
   - Transfer to Android device (USB, email, cloud storage, etc.)

3. **Install**:
   - Tap the APK file on your device
   - Follow installation prompts
   - App will be installed

---

## Environment Variables

If you need to set environment variables for the build:

**Option A: EAS Secrets (Recommended)**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-api-url.com
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value your-key
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value your-key
```

**Option B: .env file (for local builds only)**
- Create `apps/mobile/.env` file
- Add variables like: `EXPO_PUBLIC_API_URL=https://your-api-url.com`
- Note: `.env` files are NOT included in EAS builds (use secrets instead)

---

## Quick Start (One Command)

For the fastest testing build:

```bash
cd apps/mobile
eas build --profile preview --platform android
```

Then wait ~10-15 minutes and download the APK from the provided link.

---

## Troubleshooting

### "EAS CLI not found"
```bash
npm install -g eas-cli
```

### "Not logged in"
```bash
eas login
```

### "Project not linked"
```bash
eas build:configure
```

### Want to see build status
- Visit: https://expo.dev/accounts/[your-account]/projects/funnyfy/builds
- Or check terminal output for build URL

---

## Build Configuration

Your current `eas.json` configuration:

- **Preview profile**: Builds APK for internal testing
- **Production profile**: Builds APK for release
- **Development profile**: Builds development client (not APK)

Both preview and production will create APK files you can install directly.

---

## Next Steps After Building

1. Download the APK
2. Install on your Android device
3. Test the app functionality
4. Test subscription purchases (if configured)
5. Share with testers if needed

---

**Need help?** Check EAS docs: https://docs.expo.dev/build/introduction/

