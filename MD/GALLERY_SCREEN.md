# Gallery Screen

**Status:** Implemented  
**Implementation:** `apps/mobile/screens/GalleryScreen.js`  
**Album utilities:** `apps/mobile/utils/funnyfyAlbum.js`  
**Save implementation:** `saveToFunnyfyAlbum()` in `funnyfyAlbum.js` only (re-exported from `constants.js`)

---

## Canonical device path

| What | Value |
|------|--------|
| **Android folder** | **`DCIM/Funnyfy/`** — this is the path users see on device |
| **Album title** | `Funnyfy` (`FUNNYFY_FOLDER_NAME` in `funnyfyAlbum.js`) |
| **Code constant** | `FUNNYFY_DCIM_RELATIVE_PATH = 'DCIM/Funnyfy'` |
| **Legacy album titles** | `FunnyFy`, `funnyfy`, `FUNNYFY` (matched case-insensitively) |
| **Legacy filenames** | `Funnyfy-*` prefix (e.g. `Funnyfy-2026-07-04_190045.jpg` from `getSavedImageFileName()`) |
| **Path pattern** | Any URI containing `/Funnyfy/` or `/funnyfy/` (case-insensitive) |

**Important:** The app never writes directly to `DCIM/Funnyfy/`. Saves go through `expo-media-library` (`createAssetAsync` + `createAlbumAsync` / `addAssetsToAlbumAsync`), which places files in that folder on Android.

**Do not** add a root-DCIM fallback (`createAssetAsync(uri)` without an album). That regresses saves to `DCIM/` instead of `DCIM/Funnyfy/`.

---

## What My Gallery loads

My Gallery merges two sources on every open:

| Priority | Source | Location | Purpose |
|----------|--------|----------|---------|
| **1 (primary)** | Device album | **`DCIM/Funnyfy/`** via MediaLibrary | Canonical saves; survives reinstall |
| **2 (secondary)** | In-app cache | `AsyncStorage` (`@funnyfy_gallery`) + optional `documentDirectory/gallery/` | Style labels, remote URL fallback, faster repeat opens |

On open, `loadGallery({ rescanDevice: true })` **always rescans** the device (`getFunnyfyAlbumAssets({ rescan: true })`) and merges into the in-app list.

### Device load strategy (`getFunnyfyAlbumAssets`)

1. Request read photo permission (`requestGalleryReadPermission`)
2. Clear stale album cache when `rescan: true`
3. Scan **every** Funnyfy-titled album on device (not just one cached id)
4. Fall back to `resolveFunnyfyAlbum({ rescan: true })` if needed
5. Path scan: paginate up to **800** recent photos; match `DCIM/Funnyfy` URIs and `funnyfy-*` filenames
6. Enrich display URIs via `getAssetInfoAsync` → `localUri` for reliable thumbnails

Log markers (dev):

- `[Gallery] Loaded N photo(s) from DCIM/Funnyfy`
- `[Gallery] DCIM/Funnyfy path scan found N photo(s)`

---

## Overview

**My Gallery** is the in-app view of images saved to **`DCIM/Funnyfy`**. Clearing the in-app list (trash) does **not** delete files in `DCIM/Funnyfy`.

---

## UI (current)

| Element | Pattern |
|---------|---------|
| Background | `#0B0F19` (`galleryRoot`) |
| Close | Floating **`galleryCloseWrap`** + `pwdCloseCircle` top-right (X) |
| Header | Centered **My Gallery** title; **trash** left when items exist (clear in-app list only) |
| Subtitle | `{n} saved · tap to view · long-press to remove` |
| Grid | `MediaTile` in 2-column grid (image only, no style overlay) |
| Viewer | Full-screen modal; **horizontal swipe** between photos (`FlatList` paging); image fills measured pager height |
| Viewer footer | Style label + **{i} / {n}** counter + white **Share** pill |
| Empty state | Mentions **`DCIM/Funnyfy`**; prompts for photo permission if denied |

**Navigation:** Close → style home (`App.js` `setScreen('style')`). Also reachable from Result screen and menu.

---

## Viewer UX

| Action | Behavior |
|--------|----------|
| Tap tile | Opens viewer at that index |
| Swipe left/right | Previous / next image |
| X (top-right) | Close viewer |
| Share | `resolveShareableImageUri()` — handles `file://`, `content://`, and MediaLibrary assets |
| Long-press tile | Remove from in-app list (`DCIM/Funnyfy` unchanged) |
| Trash (header) | Clear in-app AsyncStorage list only |

---

## Saving from Result

1. **`saveToFunnyfyAlbum()`** — writes to device album → **`DCIM/Funnyfy/`** (write permission)
2. **`saveToGallery()`** — in-app list + optional copy under `documentDirectory/gallery/`

Toast offers **View in Gallery** after save. Save toast copy: `Gallery › Funnyfy album`.

**Saved filename:** `getSavedImageFileName()` in `constants.js` → `Funnyfy-YYYY-MM-DD_HHMMSS.jpg` (e.g. `Funnyfy-2026-07-04_190045.jpg`). On save, the app copies the result to this name before `saveToFunnyfyAlbum()` — the on-screen preview cache uses `result_preview_<timestamp>.jpg` in app cache only and must not be written to `DCIM/Funnyfy`.

---

## Why paths changed (historical)

| Cause | Fix |
|--------|-----|
| Root DCIM fallback on album failure | Removed; rescan albums |
| Stale cached album id (empty wrong album) | `rescan: true` on gallery open; scan all Funnyfy albums |
| Inconsistent album naming | Legacy title + path scan |
| Album missing after reinstall | `discoverFunnyfyAlbumFromExistingPhotos()` + `DCIM/Funnyfy` path scan |
| Gallery only scanned when AsyncStorage empty | **Always merge** device album on load |
| Old root saves | Path/filename scan across 800 recent photos |
| Share failed on device URIs | `resolveShareableImageUri()` copies `content://` to cache |

---

## Key files

| File | Role |
|------|------|
| `apps/mobile/utils/funnyfyAlbum.js` | **Canonical** — save, load, merge, share URI; exports `FUNNYFY_FOLDER_NAME`, `FUNNYFY_DCIM_RELATIVE_PATH` |
| `apps/mobile/screens/GalleryScreen.js` | UI, `loadGallery()`, in-app cache |
| `apps/mobile/screens/ResultScreen.js` | Save flow |
| `apps/mobile/constants.js` | Re-exports `saveToFunnyfyAlbum`, `FUNNYFY_FOLDER_NAME` |

---

## QA checklist

- [ ] Save from result → appears in My Gallery **and** phone **`DCIM/Funnyfy/`**
- [ ] Reinstall / clear app data → existing `DCIM/Funnyfy` photos rediscovered in My Gallery
- [ ] Photo permission granted — empty state does not show permission warning
- [ ] Viewer swipe through multiple items; counter updates; image fills screen
- [ ] Share from viewer works for device-album photos
- [ ] Clear in-app list (trash) does **not** delete `DCIM/Funnyfy` files

---

**Last updated:** July 2026
