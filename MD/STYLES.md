# FunnyFy — Enabled Styles Reference

**Last updated:** June 2026  
**App version:** `1.0.30` (`apps/mobile/version.json`)  
**Source of truth (prompts + enable flag):** `api/_utils/styles-config.ts` → `LEGACY_STYLES`  
**Staging API:** `GET https://funnyfy-staging.vercel.app/api/styles`

The app shows **only styles returned by `/api/styles`** on a successful fetch. Prompts and models stay on the server; the mobile app bundles thumbnails and comparison assets.

---

## Quick workflow — add or update a style

1. **Server** — Add or edit an entry in `LEGACY_STYLES` in `api/_utils/styles-config.ts` (`enabled: true`, `prompt`, `model`, `categoryId`).
2. **Deploy staging** — `npx vercel deploy --prod --yes` from repo root (uses `.vercelignore` to exclude mobile assets from the API bundle).
3. **Mobile thumbnail** — Map `id` → image in `getStyleImage()` in `apps/mobile/constants.js` (often the comparison `after` image).
4. **Comparison pair** (optional) — Add `before` / `after` in `apps/mobile/data/comparisonPairs.js` → `CURATED_PAIRS`.
5. **Offline fallback** — Add to `DEFAULT_ENABLED_STYLES` and `CATEGORY_BY_STYLE_ID` in `apps/mobile/data/styleCatalog.js`.
6. **Bump version** — `apps/mobile/version.json`.
7. **Reload app** — Shake device → Reload, or `npx expo start --clear`.

See also: `MD/ADDING_MORE_STYLES_GUIDE.md`, `To do/COMPARISON_ASSETS.md`.

---

## Models

| Constant | Replicate model | Used for |
|----------|-----------------|----------|
| `DEFAULT_MODEL` | `black-forest-labs/flux-kontext-pro` | Most cartoon / art styles |
| `NANO_BANANA` | `google/nano-banana` | Caricatures, mural, pop art v3, video-game styles |
| `SEEDREAM_4` | `bytedance/seedream-4` | lowpoly, pop art v2, graffiti, banksy, mosaic, watercolor, carc1 |

---

## Enabled styles (30)

| Id | Label | Category | Model | Comparison pair |
|----|-------|----------|-------|-----------------|
| `90s-cartoon` | 90s | cartoons | flux-kontext-pro | ✅ |
| `chibi` | Chibi | cartoons | flux-kontext-pro | ✅ |
| `neon` | Neon | art | flux-kontext-pro | ✅ |
| `anime` | Anime | anime-manga | flux-kontext-pro | — |
| `custom1` | Custom 1 | trending | flux-kontext-pro | — |
| `custom2` | Custom 2 | trending | flux-kontext-pro | — |
| `3dclay` | 3D Clay | 3d-characters | flux-kontext-pro | ✅ |
| `oil-paint` | Oil Paint | paintings | flux-kontext-pro | ✅ |
| `lowpoly` | lowpoly | art | seedream-4 | ✅ |
| `mural` | Mural | art | nano-banana | ✅ |
| `pop-art-v1` | pop art v1 | art | flux-kontext-pro | ✅ |
| `pop-art-v2` | pop art v2 | art | seedream-4 | ✅ |
| `pop-art-v3` | pop art v3 | art | nano-banana | ✅ |
| `graffiti` | graffiti | art | seedream-4 | ✅ |
| `banksy` | banksy | art | seedream-4 | ✅ |
| `mosaic` | mosaic | art | seedream-4 | ✅ |
| `e-glow` | e-glow | art | flux-kontext-pro | ✅ |
| `water-color` | Water Color | paintings | flux-kontext-pro | ✅ |
| `pixar-like` | Pixar-like | 3d-characters | flux-kontext-pro | ✅ |
| `funko-pop` | Funko Pop | 3d-characters | flux-kontext-pro | — |
| `neandc` | Neanderthal | fantasy-mythical | nano-banana | — |
| `neand3d` | Neanderthal 3D | fantasy-mythical | nano-banana | — |
| `handd` | Hand-Drawn | caricatures | nano-banana | ✅ |
| `editorial` | Editorial | caricatures | nano-banana | ✅ |
| `exaggerated` | Exaggerated | caricatures | nano-banana | ✅ |
| `watercolor` | watercolor | caricatures | seedream-4 | ✅ |
| `carc1` | Carc1 | caricatures | seedream-4 | ✅ |
| `superhero` | Superhero | video-games | nano-banana | — |
| `villian` | Super Villain | video-games | nano-banana | — |
| `cyborg` | Cyborg | video-games | nano-banana | — |

**Note:** `watercolor` (caricatures) and `water-color` (paintings) are different styles.

---

## Disabled / pending

| Id | Label | Category | Blocker |
|----|-------|----------|---------|
| `coloured_pencil` | coloured_pencil | caricatures | Missing `assets/comparisons/after/caricature/colouredp.jpg` (or `.jpeg`); set `enabled: true` after asset + mobile wiring |

160 catalog placeholders remain `enabled: false` until prompts and art are ready.

---

## Comparison pairs (`CURATED_PAIRS`)

Assets live under `apps/mobile/assets/comparisons/`. Folder name on disk is `Art/` (capital A).

| styleId | before | after |
|---------|--------|--------|
| `handd` | `before/hdd.png` | `after/caricature/handd.jpeg` |
| `editorial` | `before/man.png` | `after/caricature/editorial.jpeg` |
| `exaggerated` | `before/man2.png` | `after/caricature/Exaggerated.jpeg` |
| `watercolor` | `before/couple.png` | `after/caricature/Watercolor-c.jpg` |
| `carc1` | `before/toon.png` | `after/caricature/carc1.jpg` |
| `90s-cartoon` | `before/toon.png` | `after/cartoons/toon.jpg` |
| `chibi` | `before/chibi.png` | `after/cartoons/chibi.jpg` |
| `3dclay` | `before/3dclay.png` | `after/3d/3dclay.jpg` |
| `pixar-like` | `before/pxl.png` | `after/3d/pxl.jpg` |
| `oil-paint` | `before/oilpaint.png` | `after/Paintings/oilpaint.jpg` |
| `water-color` | `before/wc.png` | `after/Paintings/wc.jpg` |
| `mural` | `before/lady2.png` | `after/Art/mural.jpeg` |
| `neon` | `before/lady3.png` | `after/Art/neon.jpg` |
| `lowpoly` | `before/lady4.png` | `after/Art/lowpoly.jpg` |
| `pop-art-v1` | `before/lady5.png` | `after/Art/portart-fkp.jpg` |
| `pop-art-v2` | `before/man3.png` | `after/Art/popart-sr4.jpg` |
| `pop-art-v3` | `before/dude.png` | `after/Art/popart-nbn.jpeg` |
| `graffiti` | `before/dude2.png` | `after/Art/graffiti.jpg` |
| `banksy` | `before/lady6.png` | `after/Art/banksy.jpg` |
| `mosaic` | `before/man4.png` | `after/Art/mosaic.jpg` |
| `e-glow` | `before/lady6.png` | `after/Art/eglow.jpg` |

**Style picker behavior:** Home category rows and the **See all** grid use `RowFocusProvider` (`hooks/useRowFocus.js`) so one row crossfades at a time. Home rows show up to **5** previews (`ROW_PREVIEW_COUNT`); use **See all** for the full category list.

---

## File map

| Concern | File |
|---------|------|
| Prompts, models, `enabled` | `api/_utils/styles-config.ts` |
| Full 160-style catalog | `api/_utils/style-catalog.ts`, `apps/mobile/data/styleCatalog.js` |
| Tile thumbnails | `apps/mobile/constants.js` → `getStyleImage()` |
| Before/after pairs | `apps/mobile/data/comparisonPairs.js` |
| Picker UI | `apps/mobile/screens/StyleScreen.js` |
| Server-only styles list | `api/styles.ts` |

---

## Deploy checklist

- [ ] `styles-config.ts` updated and TypeScript builds
- [ ] `npx vercel deploy --prod --yes` (staging project)
- [ ] `GET /api/styles` includes new `id` with correct `categoryId`
- [ ] Mobile assets + `constants.js` + `comparisonPairs.js` updated
- [ ] `version.json` bumped
- [ ] Expo Go reload / new APK build for thumbnail assets
