# Splash asset

**Status:** Done — colorful ribbon `F` mark ships as the splash, app icon, and Android adaptive icon.

---

## Current setup

All three assets are 1024×1024 PNGs with the mark centered on an opaque `#0B0F19`
background, matching `splash.backgroundColor` exactly so the native → JS handoff has no
visible seam.

| Asset | File | Art size | Used by |
|-------|------|----------|---------|
| Splash | `assets/splash-logo.png` | 55% of canvas | `splash` + `expo-splash-screen` plugin |
| App icon | `assets/icon.png` | 72% of canvas | `icon` (iOS + Android legacy) |
| Adaptive foreground | `assets/adaptive-icon.png` | 56% of canvas | `android.adaptiveIcon` |
| In-app mark | `assets/logo-mark.png` | tight crop, transparent | home header lockup, `AppSplash` |

The splash and adaptive-icon art is kept small because Android crops both into a circle;
the legacy icon only loses its corners, so it can run larger.

`logo-mark.png` is the odd one out: it has a real alpha channel and no background, because
it renders over app surfaces rather than as a standalone tile. The home header pairs it with
the text `unnyfy` (`headerBrand` in `styles.js`) so the mark reads as the F in "Funnyfy" —
its `headerLogo` width is tied to the mark's aspect ratio, so re-check it when the art
changes.

`expo-splash-screen` keeps the native splash visible until fonts + auth finish
(`apps/mobile/App.js`), so no in-app splash component is needed.

---

## Regenerating from a new source logo

All four assets are derived from one source render of the mark on a black background:

```
cd apps/mobile
node scripts/build-brand-assets.js <path-to-logo-on-black.png>
npx expo prebuild --platform android --no-install
```

The script keys black out to real transparency (with an un-premultiply pass so soft edges
do not fringe dark), keeps only the largest connected blob, crops tight, then composites
each output at the fraction in the table above. The blob filter matters: generated art
usually carries faint texture in its "black" area, with specks as bright as the mark's own
antialiased edges, so no brightness threshold alone separates them — left in, they inflate
the crop box and leave grey dust on the splash.

The script prints the new mark's aspect ratio and the `headerLogo` size to match it.

---

## Notes

- Icon and splash config is baked into native builds — changes need a new EAS build or
  `npx expo run:android`. Expo Go and OTA updates will not reflect them.
- **Expo Go:** the Expo Go app always shows its own splash and icon. Your `splash-logo.png`
  and `icon.png` are ignored there. `AppSplash` (`components/AppSplash.js`) renders the
  logo from the JS bundle after startup so Expo Go shows the current mark on reload.
  Run `npm run start:clean` if Metro still serves a stale image.
- After changing splash/icon assets, run `npx expo prebuild --platform android --no-install`
  (if `android/` exists) and rebuild. Clear Metro cache with `npx expo start -c` if needed.
- `assets/icon.jpg` (the old caricature icon) is retained but no longer referenced.
