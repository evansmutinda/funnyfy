# App entry & native integration (checklist)

**Status:** In place — verify after native config or dependency changes.

---

## What changed

The app no longer uses Expo’s default entry (`node_modules/expo/AppEntry.js`). Boot order is explicit:

```
index.js → polyfills.js → App.js
```

| File | Role |
|------|------|
| `apps/mobile/index.js` | Custom entry; loads polyfills first, then registers root component |
| `apps/mobile/polyfills.js` | `react-native-url-polyfill` + `window.location` stub for RevenueCat Expo Go / `purchases-js` |
| `apps/mobile/package.json` | `"main": "index.js"` |
| `apps/mobile/App.js` | `expo-splash-screen` — hide when fonts + auth ready |
| `apps/mobile/app.config.js` | `expo-splash-screen` plugin + splash config |
| `apps/mobile/plugins/withAndroidNavBarContrast.js` | Nav bar: no contrast scrim, edge-to-edge MainActivity, translucent `DARK_BG` |
| `apps/mobile/constants/theme.js` | `DARK_BG`, nav bar 15% transparent — runtime + native hex helpers |

---

## After changing native config or adding native modules

Required for: splash plugin, **navigation bar transparency**, RevenueCat native modules, new permissions, etc.

1. Update `app.config.js` / plugins if needed.
2. Regenerate native project (local only — not EAS):
   ```powershell
   cd apps/mobile
   npx expo prebuild --platform android
   ```
3. If Gradle fails with `drawable/splashscreen_logo not found`, ensure either:
   - `splash.image` is set in `app.config.js` (currently `splash-transparent.png`), **or**
   - `android/app/src/main/res/drawable/splashscreen_logo.xml` exists (transparent placeholder).
4. Build debug APK:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   cd apps/mobile/android
   .\gradlew.bat assembleDebug
   ```

---

## Verify integration

- [ ] Metro starts: `cd apps/mobile && npx expo start`
- [ ] Expo Go: no `sdk_initialized` / `window.location.search` error on launch (polyfills)
- [ ] Native debug APK: launches to dark splash → StyleScreen (no white flash)
- [ ] **Nav bar:** `#0B0F19` tint, ~15% transparent — scroll style rows to see tiles through bar; rebuild after `theme.js` / plugin changes
- [ ] RevenueCat init works in **dev APK** (native module), not only Expo Go browser mode
- [ ] After `expo prebuild --clean`, Gradle `assembleDebug` succeeds without manual patches

---

## Related

- Branded splash (optional later): `To do/SPLASH_ASSET.md`
- Local APK build: `MD/BUILD_APK_GUIDE.md`
- JDK for Gradle: **Java 17** at `C:\Program Files\Java\jdk-17` (not Java 25)
