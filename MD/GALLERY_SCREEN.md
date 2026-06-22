# Gallery Screen

**Status:** Implemented  
**Implementation:** `apps/mobile/screens/GalleryScreen.js`  
**Album utilities:** `apps/mobile/utils/funnyfyAlbum.js`  
**UI reference:** `MD/UI_REDESIGN_2026_06.md` § Gallery

---

## Overview

**My Gallery** merges:

1. **In-app list** — `AsyncStorage` + optional copies in `documentDirectory/gallery/`
2. **Device album** — `expo-media-library` **Funnyfy** album

On every open, the app **merges** the device album into the in-app list (reinstall / legacy path recovery).

---

## UI (current)

| Element | Pattern |
|---------|---------|
| Background | `#0B0F19` (`galleryRoot`) |
| Close | Floating **`pwdCloseCircle`** top-right (X) — same as Subscription |
| Header | Centered **My Gallery** title; **trash** left when items exist (clear in-app list) |
| Subtitle | `{n} saved · tap to view · long-press to remove` |
| Grid | `MediaTile` in 2-column grid |
| Viewer | Full-screen modal; **horizontal swipe** between photos (`FlatList` paging) |
| Viewer footer | Style label + **{i} / {n}** counter + white **Share** pill |

**Navigation:** Close → style home (`App.js` `setScreen('style')`). Also reachable from Result screen.

---

## Viewer UX

| Action | Behavior |
|--------|----------|
| Tap tile | Opens viewer at that index |
| Swipe left/right | Previous / next caricature |
| X (top-right) | Close viewer |
| Share | Shares current image |
| Long-press tile | Remove from in-app list (device album unchanged) |
| Trash (header) | Clear in-app list only |

---

## Device album path (canonical)

| What | Value |
|------|--------|
| **Album title** | `Funnyfy` (`FUNNYFY_FOLDER_NAME` in `constants.js`) |
| **Typical Android folder** | `DCIM/Funnyfy/` |
| **Legacy titles detected** | `FunnyFy`, `funnyfy`, `FUNNYFY` |

Always use `saveToFunnyfyAlbum()` → `MediaLibrary.createAssetAsync(uri, album)`. Do not write directly to DCIM paths.

---

## Why paths changed (historical)

| Cause | Fix (June 2026) |
|--------|------------------|
| Root DCIM fallback on album failure | Removed; rescan albums |
| Stale cached album id | `resolveFunnyfyAlbum()` validates id |
| Inconsistent album naming | Legacy title scan |
| Gallery only scanned when AsyncStorage empty | **Always merge** on load |
| Old root saves | Scan 200 recent photos for `Funnyfy-*` / `/Funnyfy/` paths |

---

## Saving from Result

1. `saveToFunnyfyAlbum()` — device album (write permission)
2. `saveToGallery()` — in-app list + local copy

Toast offers **View in Gallery** after save.

---

## Key files

- `apps/mobile/utils/funnyfyAlbum.js`
- `apps/mobile/screens/GalleryScreen.js`
- `apps/mobile/screens/ResultScreen.js`
- `apps/mobile/constants.js`

---

## QA checklist

- [ ] Save from result → appears in My Gallery + phone Funnyfy album
- [ ] Reinstall → existing album photos appear after merge
- [ ] Viewer swipe through multiple items; counter updates
- [ ] Clear in-app list does not delete device album files
