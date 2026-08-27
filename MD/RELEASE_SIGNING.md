# Android release signing

**When:** Before your first Play Store upload (internal test track counts).

Staging day-to-day testing still uses **debug APKs** (`build-apk-local.ps1`). Release signing is separate from staging vs production API URLs.

---

## Option A — EAS Build (recommended for Play Store)

1. Create the keystore once (below) or let EAS generate one:
   ```powershell
   cd apps/mobile
   eas credentials -p android
   ```
2. Build production AAB:
   ```powershell
   eas build --profile production --platform android
   ```
3. Upload the `.aab` to Google Play Console.

EAS stores the keystore in Expo's credential service — back up when prompted.

---

## Option B — Local release APK

1. Prebuild native project:
   ```powershell
   cd apps/mobile
   npx expo prebuild --platform android
   ```
2. Generate keystore + `keystore.properties` (gitignored):
   ```powershell
   .\scripts\generate-release-keystore.ps1
   ```
3. Copy `keystore.properties.example` layout if you need to edit paths manually.
4. Build release:
   ```powershell
   cd ..\..
   .\build-apk-local.ps1 -Release
   ```

The `withReleaseSigning` config plugin wires Gradle to read `keystore.properties`. Without that file, release builds still fall back to the debug key (fine for local experiments only).

---

## Backup checklist

- [ ] `.jks` file saved offline (password manager + encrypted backup)
- [ ] Store password + key alias recorded
- [ ] Same keystore used for all future Play Store updates (never lose it)

See also: `MD/BUILD_APK_GUIDE.md`, `MD/SECURITY_AUDIT.md` (debug signing finding).
