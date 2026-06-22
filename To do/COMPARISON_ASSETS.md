# Upload comparison assets (before/after hero)

**Status:** Placeholder — UploadScreen uses `realistic.jpeg` + each style's picker thumbnail. Pairs are mismatched sizes; crossfade can look zoomed/cropped.

---

## Problem

UploadScreen shows a looping before/after via `ComparisonFade` (`apps/mobile/screens/UploadScreen.js`):

- Full-bleed background
- `resizeMode: 'cover'`
- Top scrim ~180px + safe area; bottom scrim ~320px

Mixed aspect ratios crop differently, so the preview looks **zoomed in** and the crossfade **jumps** between before and after.

| Asset (examples) | Size | Ratio |
|------------------|------|--------|
| `assets/realistic.jpeg` (before) | 832×1248 | 2:3 portrait |
| `anime.jpg`, `funko.jpg` (after placeholders) | 1024×1024 | 1:1 square |
| `cyborg.jpeg` | 896×1152 | ~7:9 |

Style **picker tiles** can stay square. **Upload hero pairs** must not.

---

## Asset spec (every before/after pair)

| Property | Value |
|----------|--------|
| Aspect ratio | **2:3 portrait** (width ÷ height = 0.667) |
| Recommended pixels | **832×1248** (current baseline) or **1080×1620** (@2x) |
| Format | JPG (bundled assets) |
| Framing | **Same face crop** in before and after — only the style changes |
| Subject placement | Face in the **vertical center third** (scrims eat top/bottom) |

Constants in code: `COMPARISON_ASPECT_RATIO`, `COMPARISON_IMAGE_SIZE` in `apps/mobile/data/comparisonPairs.js`.

---

## How to generate curated pairs

### 1. Add reference “before” faces

```
apps/mobile/assets/comparisons/before/
  face-1.jpg   # 832×1248, 2:3
  face-2.jpg
  ...
```

Use 4–8 reference portraits, all **832×1248** (or 1080×1620), same spec as above.

### 2. Run the generator script

From repo root (requires quota + auth):

```powershell
$env:API_BASE = "https://funnyfy-staging.vercel.app"
$env:AUTH_TOKEN = "<jwt>"
npm run generate-comparisons
```

Script: `scripts/generate-comparison-set.js`

Output layout:

```
apps/mobile/assets/comparisons/<styleId>/<beforeBaseName>-after.jpg
```

Re-export or post-process outputs to **832×1248** if the API returns a different size.

### 3. Register pairs in the app

Edit `apps/mobile/data/comparisonPairs.js` → `COMPARISON_OVERRIDES`:

```js
const COMPARISON_OVERRIDES = {
  '90s-cartoon': {
    before: require('../assets/comparisons/before/face-1.jpg'),
    after: require('../assets/comparisons/90s-cartoon/face-1-after.jpg'),
  },
  // ...
};
```

Pick one default pair per enabled style (or rotate later).

### 4. Rebuild APK

New assets are bundled at build time — run `.\build-apk-local.ps1` or EAS after adding files.

---

## Optional UI follow-up

If assets are standardized but crop still feels tight on some devices:

- [ ] Constrain `ComparisonFade` to a fixed **2:3 viewport** between header and Gallery/Camera cards (cover inside the box, not full screen)
- [ ] Do **not** switch to full-screen `contain` without the viewport — letterboxing on the whole screen looked worse in testing

---

## Checklist

- [ ] Reference before photos added (`assets/comparisons/before/`), all 832×1248 @ 2:3
- [ ] `npm run generate-comparisons` run for enabled styles
- [ ] After images cropped/resized to match before (832×1248)
- [ ] `COMPARISON_OVERRIDES` populated in `comparisonPairs.js`
- [ ] Verified on device: no zoom jump on crossfade; face readable under scrims
- [ ] Update `MD/UI_REDESIGN_2026_06.md` when placeholder phase is done
