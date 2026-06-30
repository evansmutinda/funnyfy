# Comparison assets (before/after pairs)

**Status:** 22 curated pairs on style tiles; Upload still uses placeholders for styles without pairs.

---

## Where comparisons run

| Surface | Component | Behavior |
|---------|-----------|----------|
| **Upload hero** | `ComparisonFade` in `UploadScreen.js` | Infinite crossfade; `holdMs=1800`, `fadeMs=1000` |
| **Style picker tiles** | `ComparisonFade` via `MediaTile.js` | Crossfade when a curated pair exists; `holdMs=1200`, `fadeMs=1500`, **3 cycles** max |
| **Row focus** | `hooks/useRowFocus.js` | One row animates at a time; sequences top→bottom when multiple rows are visible after scroll settles |
| **Home category rows** | `StyleScreen.js` → `CategoryRow` | Horizontal row; up to 5 style previews per category |
| **See all grid** | `StyleScreen.js` → `DiscoveryGridRow` | 2-column grid; same row-focus alternation as home |

Tiles pause when off-screen, row inactive, or app backgrounded (`useAppForeground`).

---

## Curated pairs (shipped)

Registered in `apps/mobile/data/comparisonPairs.js` → `CURATED_PAIRS`. Full list: **`MD/STYLES.md`**.

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

Styles without a curated entry fall back to `realistic.jpeg` + the style thumbnail on Upload only; picker tiles show a static thumbnail.

---

## Asset layout

```
apps/mobile/assets/comparisons/
  before/              # original portraits (one per pair)
  after/
    caricature/
    cartoons/
    3d/
    Paintings/
    Art/                 # art category pairs (neon, mural, pop art, etc.)
```

Constants: `COMPARISON_ASPECT_RATIO`, `COMPARISON_IMAGE_SIZE` in `comparisonPairs.js`.

---

## Upload hero spec (full-bleed pairs)

Upload uses `resizeMode: 'cover'` with top/bottom scrims. Mixed aspect ratios crop differently and the crossfade can **jump**.

| Property | Value |
|----------|--------|
| Aspect ratio | **2:3 portrait** (width ÷ height = 0.667) |
| Recommended pixels | **832×1248** or **1080×1620** (@2x) |
| Format | JPG (bundled assets) |
| Framing | **Same face crop** in before and after |

---

## How to add more pairs

### 1. Reference “before” faces

```
apps/mobile/assets/comparisons/before/
  face-1.jpg   # 832×1248, 2:3
```

### 2. Generate styled outputs

```powershell
$env:API_BASE = "https://funnyfy-staging.vercel.app"
$env:AUTH_TOKEN = "<jwt>"
npm run generate-comparisons
```

Script: `scripts/generate-comparison-set.js` → `comparisons/after/<categoryFolder>/<basename>.jpg`

### 3. Register in the app

Add to `CURATED_PAIRS` in `apps/mobile/data/comparisonPairs.js` and update `MD/STYLES.md`.

### 4. Rebuild APK

Assets bundle at build time — run `.\build-apk-local.ps1` or EAS after adding files.

---

## Checklist

- [x] 22 curated pairs + `CURATED_PAIRS` entries
- [x] Style tile crossfade + row focus on home and See all grid
- [ ] Remaining enabled styles — generate + register pairs
- [ ] Upload hero pairs at 832×1248 for all enabled styles (no zoom jump)
- [ ] `coloured_pencil` — add `after/caricature/colouredp.jpg` and enable style
