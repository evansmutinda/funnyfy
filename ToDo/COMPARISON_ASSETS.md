# Comparison assets (before/after pairs)

**Status:** Most enabled styles have pairs; a few still missing — see [`MD/STYLES.md`](../MD/STYLES.md).

**In plain English:** These are the before → after photos that animate on style tiles and the upload screen. When a style has no pair, it shows a static picture (or a placeholder).

---

## Where comparisons run

| Surface | Component | Behavior |
|---------|-----------|----------|
| **Upload hero** | `ComparisonFade` in `UploadScreen.js` | Infinite crossfade; `holdMs=1800`, `fadeMs=1000` |
| **Style picker tiles** | `ComparisonFade` via `MediaTile.js` in `StyleScreen.js` | Crossfade when curated pair exists; `holdMs=1200`, `fadeMs=1500`, **3 cycles** max; row-focus sequencing on home and **See all** |
| **Row focus** | `hooks/useRowFocus.js` | One row animates at a time; sequences top→bottom when multiple rows are visible after scroll settles |
| **Home category rows** | `StyleScreen.js` → `CategoryRow` | Horizontal row; up to 5 style previews per category |
| **See all grid** | `StyleScreen.js` → `DiscoveryGridRow` | 2-column grid; same row-focus alternation as home |

Tiles pause when off-screen, row inactive, or app backgrounded (`useAppForeground`).

---

## Curated pairs (shipped)

Registered in `apps/mobile/data/comparisonPairs.js` → `CURATED_PAIR_PATHS`.

**Full list:** [`MD/STYLES.md`](../MD/STYLES.md) → Comparison pairs.

Styles **without** a curated entry use a static tile thumbnail when mapped in `constants.js`; Upload hero may still use a placeholder. See `MD/STYLES.md` → Comparison pairs.

---

## Asset layout

```
apps/mobile/assets/comparisons/
  source/                        # originals — NOT bundled (~85 MB)
    before/
    after/
  tiles/                         # ~400px — style picker + tile crossfades
  hero/                          # ~832px — upload screen crossfade
```

Build converted assets:

```bash
npm run build-comparison-assets
```

Script: `scripts/build-comparison-assets.js` → writes `tiles/`, `hero/`, and `comparisonPairAssets.generated.js`.

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
apps/mobile/assets/comparisons/source/before/
  face-1.jpg   # 832×1248, 2:3
```

### 2. Generate styled outputs

```powershell
$env:API_BASE = "https://funnyfy-staging.vercel.app"
$env:AUTH_TOKEN = "<jwt>"
npm run generate-comparisons
```

Script: `scripts/generate-comparison-set.js` → `apps/mobile/assets/comparisons/source/after/<categoryFolder>/<basename>.jpg`

### 3. Register in the app

Add to `CURATED_PAIR_PATHS` in `apps/mobile/data/comparisonPairs.js`, then:

```bash
npm run build-comparison-assets
```

Update `MD/STYLES.md`.

### 4. Rebuild APK

Assets bundle at build time — run `.\build-apk-local.ps1` or EAS after adding files.

---

## Checklist

- [x] Curated pairs + `CURATED_PAIR_PATHS` entries (count in `MD/STYLES.md`)
- [x] Tile + hero asset tiers (`npm run build-comparison-assets`)
- [x] Style tile crossfade + row focus on home and See all grid
- [ ] Remaining enabled styles without pairs — generate + register
- [ ] Upload hero pairs at 832×1248 for all enabled styles (no zoom jump)
- [ ] `coloured_pencil` — add `source/after/caricature/colouredp.jpg`, run `build-comparison-assets`, and enable style
