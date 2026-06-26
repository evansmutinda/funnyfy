# Comparison assets (before/after pairs)

**Status:** Partial — eight curated pairs ship on style tiles; Upload still uses placeholders for other styles.

---

## Where comparisons run

| Surface | Component | Behavior |
|---------|-----------|----------|
| **Upload hero** | `ComparisonFade` in `UploadScreen.js` | Infinite crossfade; `holdMs=1800`, `fadeMs=1000` |
| **Style picker tiles** | `ComparisonFade` via `MediaTile.js` | Crossfade when a curated pair exists; `holdMs=1200`, `fadeMs=1500`, **3 cycles** max |
| **Row focus** | `hooks/useRowFocus.js` | One category row animates at a time; sequences top→bottom when multiple rows are visible after scroll settles |
| **See all grid** | `StyleScreen.js` | First two tiles with curated pairs animate |

Tiles pause when off-screen, row inactive, or app backgrounded (`useAppForeground`).

---

## Curated pairs (shipped)

Registered in `apps/mobile/data/comparisonPairs.js` → `CURATED_PAIRS`:

| styleId | before | after |
|---------|--------|--------|
| `handd` | `before/hdd.png` | `after/caricature/handd.jpeg` |
| `carc1` | `before/toon.png` | `after/caricature/carc1.jpg` |
| `90s-cartoon` | `before/toon.png` | `after/cartoons/toon.jpg` |
| `chibi` | `before/chibi.png` | `after/cartoons/chibi.jpg` |
| `3dclay` | `before/3dclay.png` | `after/3d/3dclay.jpg` |
| `pixar-like` | `before/pxl.png` | `after/3d/pxl.jpg` |
| `oil-paint` | `before/oilpaint.png` | `after/Paintings/oilpaint.jpg` |
| `water-color` | `before/wc.png` | `after/Paintings/wc.jpg` |

Styles without a curated entry fall back to `realistic.jpeg` + the style thumbnail on Upload only; picker tiles show a static thumbnail.

---

## Asset layout

```
apps/mobile/assets/comparisons/
  before/              # original portraits (one per pair)
  after/
    caricature/        # caricatures row
    cartoons/
    3d/
    Paintings/
    Anime/             # reserved for anime-manga pairs
    <category>/        # after image filename (e.g. toon.jpg, handd.jpeg)
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

Add to `CURATED_PAIRS` in `apps/mobile/data/comparisonPairs.js`.

### 4. Rebuild APK

Assets bundle at build time — run `.\build-apk-local.ps1` or EAS after adding files.

---

## Checklist

- [x] First eight curated pairs + `CURATED_PAIRS` entries
- [x] Style tile crossfade + row focus behavior
- [ ] Remaining enabled styles — generate + register pairs
- [ ] Upload hero pairs at 832×1248 for all enabled styles (no zoom jump)
- [ ] Optional: fixed 2:3 viewport on Upload between header and Gallery/Camera cards
