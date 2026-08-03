# Comparison source assets (not bundled)

Full-resolution before/after photos. **Not shipped in the APK** — excluded via `app.config.js` `assetBundlePatterns`.

Run after adding or replacing images:

```bash
npm run build-comparison-assets
```

## Layout

```
apps/mobile/assets/comparisons/source/
  before/           # Original portrait photos (.png / .jpg)
  after/
    caricature/
    cartoons/
    3d/
    Paintings/
    Art/
```

## Output (bundled)

| Tier | Path | Used for |
|------|------|----------|
| **tiles** | `../tiles/` | Style picker thumbnails + tile crossfades |
| **hero** | `../hero/` | Upload screen before/after crossfade |

## Adding a new style pair

**You:** place originals in `before/` and `after/<category>/`.

**Agent (when you prompt a new style):** wires server config, `CURATED_PAIR_PATHS`, thumbnails, runs `npm run build-comparison-assets`, bumps version.

Paths in `comparisonPairs.js` are relative to this folder, e.g. `before/man.png`, `after/caricature/editorial.jpeg`.
