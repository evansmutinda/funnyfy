# How to Build APK for FunnyFy App

Two options: **local Gradle build** (free, no EAS quota) or **EAS cloud build**.

---

## Option A: Local Build (Recommended if EAS quota exhausted)

### Prerequisites

1. **Android Studio** installed with Android SDK Platform 34 or 35
2. **JDK 17** (bundled with Android Studio)
3. Set environment variable:
   ```powershell
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   ```

### Steps

1. **Configure `.env`** in `apps/mobile/` (values are baked in at build time):
   ```env
   EXPO_PUBLIC_API_URL=https://funnyfy-staging.vercel.app
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=test_kXXXX...
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_kXXXX...
   ```

2. **Generate native Android project** (first time, or after `app.config.js` changes):
   ```powershell
   cd apps/mobile
   npx expo prebuild --platform android
   ```

3. **Build debug APK** (easiest — for testing on your device):
   ```powershell
   cd android
   .\gradlew.bat assembleDebug
   ```

   **Output:** `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

4. **Or use the script** from project root:
   ```powershell
   .\build-apk-local.ps1
   ```

### Release APK (optional)

```powershell
cd apps/mobile/android
.\gradlew.bat assembleRelease
```

Release builds require signing configuration. Use debug builds for sideload testing.

### Rebuild after `.env` changes

```powershell
cd apps/mobile
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleDebug
```

---

## Option B: EAS Cloud Build

Uses EAS build minutes (free tier has monthly quota).

### Prerequisites

```bash
npm install -g eas-cli
eas login
cd apps/mobile
```

### Preview Build (testing APK)

```bash
eas build --profile preview --platform android
```

Or from project root:

```powershell
.\build-apk.ps1
# or
.\build-apk.ps1 -Profile preview
```

**Time**: ~10–15 minutes in the cloud.

### Production Build

```bash
eas build --profile production --platform android
```

Note: `eas.json` production profile builds an **AAB** by default (Play Store). Preview profile builds an **APK**.

---

## Installing the APK

1. Enable **Install unknown apps** for your file manager (Settings → Apps)
2. Copy APK to your Android device
3. Tap to install

---

## Environment Variables

| Build type | Where to set |
|------------|--------------|
| **Local Gradle** | `apps/mobile/.env` — rebuild after changes |
| **EAS cloud** | `eas secret:create` — see `apps/mobile/README-ENV.md` |

Required variables:
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

**Staging URL for testing:** `https://funnyfy-staging.vercel.app`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `gradlew` not found | Run `npx expo prebuild --platform android` first |
| JDK errors | Install JDK 17; set `JAVA_HOME` |
| SDK not found | Install Android SDK via Android Studio |
| Release build fails | Use `assembleDebug` for testing |
| EAS quota exhausted | Use **Option A** (local build) |
| Wrong API in APK | Update `.env` and rebuild |

---

**Last Updated**: June 2026
