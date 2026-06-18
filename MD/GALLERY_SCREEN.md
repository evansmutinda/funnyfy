# Gallery Screen

**Status**: Implemented  
**Implementation**: `apps/mobile/screens/GalleryScreen.js`  
**Last Updated**: June 2026

---

## Overview

The Gallery screen shows caricatures the user has saved. Users can view them full-screen and clear the in-app gallery list.

---

## How It Works

1. User opens **Gallery** from the menu
2. Grid of saved caricatures (newest first)
3. Tap an image for full-screen view (`react-native-image-viewing`)
4. Tap **✕** to close full-screen
5. Tap **🗑** to clear in-app gallery (ConfirmDialog first)

---

## Storage (Dual Layer)

| Layer | Purpose | Technology |
|-------|---------|------------|
| **Device album** | Photos visible in phone Gallery app | `expo-media-library` → **Funnyfy** album in DCIM/Pictures |
| **In-app list** | Fast grid, style labels, survives partial reinstall | `AsyncStorage` + copies in app `documentDirectory/gallery/` |

Saving from the Result screen calls both:
1. `saveToFunnyfyAlbum()` in `constants.js` — device album
2. `saveToGallery()` in `GalleryScreen.js` — in-app list

---

## Silent Save (Android)

Photos must **not** trigger "Allow gallery to modify this photo?" on every save.

**Wrong (causes prompt):** create asset → move to album with `addAssetsToAlbumAsync`

**Correct:** save directly into album:
```js
// Existing album
await MediaLibrary.createAssetAsync(localUri, existingAlbum);
// First photo — create album with asset in one step
await MediaLibrary.createAlbumAsync('Funnyfy', localUri, false);
```

Uses **write-only** permission (`requestPermissionsAsync(true)`) — add photos only.

---

## Rebuild from Device Album

If the in-app list is empty (e.g. after reinstall), `GalleryScreen` can scan the **Funnyfy** MediaLibrary album and rebuild `AsyncStorage`.

Gallery **read** uses read permission (`requestPermissionsAsync(false)`), not write-only.

---

## Photo Picking (Upload Screen)

On **Android 13+**, the system photo picker is used — no `READ_MEDIA_IMAGES` permission prompt before picking.

---

## UX Decisions

| Decision | Reason |
|----------|--------|
| ✕ closes full-screen viewer | Distinct from delete |
| 🗑 clears in-app list only | Device album photos remain unless user deletes in Gallery app |
| ConfirmDialog before clear | Prevents accidental loss |
| Toast on save success | Consistent notification system |

---

## Dependencies

```json
"react-native-image-viewing": "^0.2.2",
"expo-media-library": "~17.0.6",
"@react-native-async-storage/async-storage": "^1.23.1"
```

---

## Key Files

- `apps/mobile/screens/GalleryScreen.js` — UI + in-app storage
- `apps/mobile/screens/ResultScreen.js` — save on download
- `apps/mobile/constants.js` — `saveToFunnyfyAlbum()`, `FUNNYFY_FOLDER_NAME`
