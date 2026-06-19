# How to Build APK for FunnyFy App

Two options: **local Gradle build** (free, no EAS quota) or **EAS cloud build**.

**Recommended for daily testing:** use a **local debug APK** instead of Expo Go. Expo Go auto-updates from the store and can break SDK 52 compatibility; a debug APK matches your project’s native modules (RevenueCat, NetInfo, etc.). See `MD/TESTING.md` → **Method 2**.

---

## Option A: Local Build (Recommended)

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

2. **One-command build** (recommended — auto-bumps version, prebuilds, assembles APK):
   ```powershell
   # From project root
   .\build-apk-local.ps1
   ```
   Skip version bump: `.\build-apk-local.ps1 -NoVersionBump`  
   See `MD/TESTING.md` → **App versioning** for `version.json` details.

3. **Manual steps** (if you prefer):
   ```powershell
   cd apps/mobile
   npx expo prebuild --platform android
   ```

4. **Build debug APK** (when using manual prebuild):
   ```powershell
   cd apps/mobile/android
   .\gradlew.bat assembleDebug
   ```

   **Output:** `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

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
4. Run `npm start` in `apps/mobile` on your PC — the installed app loads JS from Metro on the same Wi‑Fi network (fast refresh)

---

## Expo Go vs debug APK

| Concern | Debug APK (`build-apk-local.ps1`) | Expo Go |
|---------|-------------------------------------|---------|
| SDK version drift | No — tied to your project | Yes — app store updates |
| Subscriptions (RevenueCat) | Supported | Unreliable |
| Offline banner (NetInfo) | Native module included | May vary |
| Production parity | High | Low |

**Block Expo Go auto-update (Android):** Play Store → Expo Go → **⋮** → disable **Enable auto-update**.

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
