# Gallery Screen

**Status**: Implemented  
**Implementation**: `apps/mobile/screens/GalleryScreen.js`  
**Last Updated**: June 2026

---

## Overview

The Gallery screen shows caricatures the user has saved. It uses **MediaTile** (`variant="grid"`) — full-bleed image, bottom gradient, white label. The **style picker** uses discovery variants with Plus Jakarta Sans labels and a dark backdrop pill for contrast.

---

## How It Works

1. User opens **Gallery** from the menu
2. **2-column tile grid** on gray background (`#F3F4F6`), newest first
3. Tap a tile for full-screen view (`react-native-image-viewing`)
4. Tap **✕** to close full-screen
5. Long-press a tile to delete one item; tap **🗑** to clear all (ConfirmDialog first)

---

## Tile Design

Gallery tiles reuse `components/MediaTile.js` (grid variant):

- Full-bleed image with `cover` crop
- Bottom gradient + white style label on image (no backdrop pill — picker discovery tiles use the pill)
- Gallery background: `#F3F4F6` (style picker home uses white `#FFFFFF`)

---

## Storage (Dual Layer)

| Layer | Purpose | Technology |
|-------|---------|------------|
| **Device album** | Photos visible in phone Gallery app | `expo-media-library` → **Funnyfy** album in DCIM/Pictures |
| **In-app list** | Fast grid, style labels, survives partial reinstall | `AsyncStorage` + copies in app `documentDirectory/gallery/` |

Saving from the Result screen calls both:
1. `saveToFunnyfyAlbum()` in `constants.js` — device album
2. `saveToGallery()` in `GalleryScreen.js` — in-app list

After save, a toast offers **View in Gallery** to open this screen.

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
| Same tiles as style picker | Visual consistency across app |
| ✕ closes full-screen viewer | Distinct from delete |
| 🗑 clears in-app list only | Device album photos remain unless user deletes in Gallery app |
| ConfirmDialog before clear | Prevents accidental loss |
| Toast on save with gallery action | Quick path from result → gallery |

---

## Dependencies

```json
"expo-linear-gradient": "~14.0.2",
"react-native-image-viewing": "^0.2.2",
"expo-media-library": "~17.0.6",
"@react-native-async-storage/async-storage": "^1.23.1"
```

---

## Key Files

- `apps/mobile/components/MediaTile.js` — shared tile component
- `apps/mobile/screens/GalleryScreen.js` — UI + in-app storage
- `apps/mobile/screens/ResultScreen.js` — save on download
- `apps/mobile/constants.js` — `saveToFunnyfyAlbum()`, `FUNNYFY_FOLDER_NAME`
