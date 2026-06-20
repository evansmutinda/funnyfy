# Splash asset (revisit when ready)

**Status:** Deferred — app currently uses a plain `#0B0F19` native splash with no image.

---

## Current setup

- Native splash: solid dark background only (`apps/mobile/app.config.js`)
- `expo-splash-screen` keeps it visible until fonts + auth finish (`apps/mobile/App.js`)
- No in-app splash component (removed)
- App icon still uses `apps/mobile/assets/icon.jpg` (unchanged)

---

## When you have a splash asset

### 1. Add the file

Place a PNG in `apps/mobile/assets/`, e.g.:

```
apps/mobile/assets/splash.png
```

**Suggested spec:**

| Property | Value |
|----------|--------|
| Format | PNG with transparency (logo/wordmark only) |
| Background | Transparent — `#0B0F19` comes from config |
| Size | ~1284×2778 px source (Expo scales down) or at least 1024×1024 centered logo |
| Content | Logo + optional “FunnyFy” wordmark; keep safe margins for notches |

Do **not** bake the dark background into the PNG unless you want a full-bleed image splash.

### 2. Wire it in `app.config.js`

```js
splash: {
  image: './assets/splash.png',
  resizeMode: 'contain',
  backgroundColor: '#0B0F19',
},
```

### 3. Rebuild native app

Splash config is baked into native builds. After changing the asset or config:

- Run a new **EAS build**, or
- `npx expo run:android` / `npx expo run:ios` for local dev builds

Expo Go may not reflect splash image changes accurately.

### 4. Optional polish (only if needed)

- **Animation:** brief fade on first screen after `ExpoSplashScreen.hideAsync()` — only if native → StyleScreen feels abrupt
- **Minimum display time:** not required; splash already waits for auth
- **Docs:** update `MD/UI_REDESIGN_2026_06.md` if splash becomes part of the branded launch story

---

## Checklist

- [ ] Splash PNG created and added to `apps/mobile/assets/`
- [ ] `app.config.js` updated with `image` + `resizeMode`
- [ ] Tested on Android dev build / release APK
- [ ] Tested on iOS (if shipping iOS)
- [ ] No flash between native splash and StyleScreen
