# FunnyFy — Enabled Styles Reference

**Last updated:** July 2026  
**App version:** see [`apps/mobile/version.json`](../apps/mobile/version.json) (single source of truth — do not hardcode semver here)  
**Source of truth (prompts + enable flag):** `api/_utils/styles-config.ts` → `LEGACY_STYLES`  
**Staging API:** `GET https://funnyfy-staging.vercel.app/api/styles`

The app shows **only styles returned by `/api/styles`** on a successful fetch. Prompts and models stay on the server; the mobile app bundles thumbnails and comparison assets.

---

## Quick workflow — add or update a style

### You (before prompting)

1. Drop **full-size** before + after files in `apps/mobile/assets/comparisons/source/` (see folder layout below).
2. Prompt the new style (name, category, model, prompt, and which before/after files you used).

### Agent (when you prompt)

1. **Server** — Add entry in `LEGACY_STYLES` (`api/_utils/styles-config.ts`): `enabled: true`, `prompt`, `model`, `categoryId`.
2. **Deploy staging** — `npx vercel deploy --prod --yes` from repo root.
3. **Mobile** — Register `CURATED_PAIR_PATHS` in `comparisonPairs.js` (paths relative to `assets/comparisons/source/`).
4. **Thumbnail** — Map style id → tile `after` image in `constants.js` → `getStyleImage()`.
5. **Offline fallback** — `DEFAULT_ENABLED_STYLES` + `CATEGORY_BY_STYLE_ID` in `styleCatalog.js`.
6. **Build assets** — `npm run build-comparison-assets` (generates `tiles/` + `hero/` from your originals).
7. **Bump version** — `apps/mobile/version.json`.
8. **Update this doc** — add row to the enabled-styles table.

You do **not** need to run the conversion script or edit generated files — only place originals in `assets/comparisons/source/`.

**Source folders (originals, not bundled):**

```
apps/mobile/assets/comparisons/source/before/<photo>.png
apps/mobile/assets/comparisons/source/after/<categoryFolder>/<styled>.jpg
```

Category folders: `caricature`, `cartoons`, `3d`, `Sculptures`, `Paintings`, `Art` (capital A for Art/Paintings).

See also: `MD/PROMPTS.md`, `MD/ADDING_MORE_STYLES_GUIDE.md`, `apps/mobile/assets/comparisons/source/README.md`, `ToDo/COMPARISON_ASSETS.md`.

---

## Models

| Constant | Replicate model | Used for |
|----------|-----------------|----------|
| `DEFAULT_MODEL` | `black-forest-labs/flux-kontext-pro` | Most cartoon / art styles, dc |
| `NANO_BANANA` | `google/nano-banana` | Caricatures, mural, pop art v3, video-game styles, classic-v2, saturday-v1 |
| `NANO_BANANA_2` | `google/nano-banana-2` | renoir, impasto, expressive-impasto, hokusai-v2, hiroshige, sesshu, cyberpunk-v2, disney |
| `SEEDREAM_4` | `bytedance/seedream-4` | lowpoly, pop art v2, graffiti, banksy, mosaic, watercolor, acrylic, gouache, expressionist, impressionist, baroque, van-gogh, monet, classic-v1, saturday-v2, carc1 |
| `SEEDREAM_4_5` | `bytedance/seedream-4.5` | cezanne, gauguin, matisse, seurat, ink-wash, hokusai-v1, comic, cute, cyberpunk-v1, expressive-impasto-v2 |

---

## Enabled styles (123)

| Id | Label | Category | Model | Comparison pair |
|----|-------|----------|-------|-----------------|
| `monday-mood` | Monday | moods-moments | seedream-4.5 / nano-banana-2 / nano-banana (random) | ✅ (3 afters) |
| `friday-feeling` | Friday | moods-moments | nano-banana-2 / nano-banana (random) | ✅ (2 afters) |
| `payday` | Payday | moods-moments | nano-banana | — |
| `end-of-month` | End of Month | moods-moments | nano-banana | — |
| `before-coffee` | Before Coffee | moods-moments | nano-banana | — |
| `after-coffee` | After Coffee | moods-moments | nano-banana | — |
| `deadline-mode` | Deadline Mode | moods-moments | nano-banana | — |
| `vacation-mood` | Vacation Mood | moods-moments | nano-banana | — |
| `gym-motivation` | Gym Motivation | moods-moments | nano-banana | — |
| `forgot-my-password` | Forgot My Password | moods-moments | nano-banana | — |
| `90s-cartoon` | 90s | cartoons | flux-kontext-pro | ✅ |
| `chibi` | Chibi | cartoons | flux-kontext-pro | ✅ |
| `classic-v1` | Classic V1 | cartoons | seedream-4 | ✅ |
| `classic-v2` | Classic V2 | cartoons | nano-banana | ✅ |
| `saturday-v1` | Saturday V1 | cartoons | nano-banana | ✅ |
| `saturday-v2` | Saturday V2 | cartoons | seedream-4 | ✅ |
| `comic` | Comic | cartoons | seedream-4.5 | ✅ |
| `comic-v1` | Comic V1 | cartoons | flux-kontext-pro | ✅ |
| `comic-v2` | Comic V2 | cartoons | seedream-4.5 | ✅ |
| `cute` | Cute | cartoons | seedream-4.5 | ✅ |
| `dc` | DC | cartoons | flux-kontext-pro | ✅ |
| `cyberpunk-v1` | Cyberpunk V1 | cartoons | seedream-4.5 | ✅ |
| `cyberpunk-v2` | Cyberpunk V2 | cartoons | nano-banana-2 | ✅ |
| `disney` | Disney | cartoons | nano-banana-2 | ✅ |
| `pixel` | Pixel | cartoons | seedream-4.5 | ✅ |
| `3d-render-v1` | 3D Render V1 | cartoons | flux-kontext-pro | ✅ |
| `3d-render-v2` | 3D Render V2 | cartoons | seedream-4.5 | ✅ |
| `neon` | Neon | art | flux-kontext-pro | ✅ |
| `anime` | Anime | anime-manga | flux-kontext-pro | — |
| `3dclay` | 3D Clay | 3d-characters | flux-kontext-pro | ✅ |
| `oil-paint` | Oil Paint | paintings | flux-kontext-pro | ✅ |
| `lowpoly` | Low Poly | art | seedream-4 | ✅ |
| `mural` | Mural | art | nano-banana | ✅ |
| `pop-art-v1` | Pop Art V1 | art | flux-kontext-pro | ✅ |
| `pop-art-v2` | Pop Art V2 | art | seedream-4 | ✅ |
| `pop-art-v3` | Pop Art V3 | art | nano-banana | ✅ |
| `graffiti` | Graffiti | art | seedream-4 | ✅ |
| `banksy` | Banksy | art | seedream-4 | ✅ |
| `mosaic` | Mosaic | art | seedream-4 | ✅ |
| `hexagonal-mosaic` | Hexagonal Mosaic | art | nano-banana | ✅ |
| `e-glow` | E-Glow | art | flux-kontext-pro | ✅ |
| `abstract-v1` | Abstract V1 | art | nano-banana | ✅ |
| `abstract-v2` | Abstract V2 | art | seedream-4 | ✅ |
| `geometric` | Geometric | art | seedream-4 | ✅ |
| `coloured-glass` | Coloured Glass | art | seedream-4 | ✅ |
| `paste-up` | Paste-up | art | seedream-4 | ✅ |
| `pencil-sketch-v1` | Pencil Sketch V1 | art | nano-banana | ✅ |
| `pencil-sketch-v2` | Pencil Sketch V2 | art | nano-banana-2 | ✅ |
| `origami` | Origami | 3d-characters | seedream-4.5 | ✅ |
| `paper-cut` | Paper Cut | art | flux-kontext-pro | ✅ |
| `water-color` | Water Color | paintings | flux-kontext-pro | ✅ |
| `acrylic` | Acrylic | paintings | seedream-4 | ✅ |
| `gouache` | Gouache | paintings | seedream-4 | ✅ |
| `expressionist` | Expressionist | paintings | seedream-4 | ✅ |
| `impressionist` | Impressionist | paintings | seedream-4 | ✅ |
| `baroque` | Baroque | paintings | seedream-4 | ✅ |
| `van-gogh` | Van Gogh | paintings | seedream-4 | ✅ |
| `expressive-impasto` | Expressive Impasto V1 | paintings | nano-banana-2 | ✅ |
| `expressive-impasto-v2` | Expressive Impasto V2 | paintings | seedream-4.5 | ✅ |
| `monet` | Monet | paintings | seedream-4 | ✅ |
| `renoir` | Renoir | paintings | nano-banana-2 | ✅ |
| `cezanne` | Cézanne | paintings | seedream-4.5 | ✅ |
| `gauguin` | Gauguin | paintings | seedream-4.5 | ✅ |
| `matisse` | Matisse | paintings | seedream-4.5 | ✅ |
| `seurat` | Seurat | paintings | seedream-4.5 | ✅ |
| `ink-wash` | Ink-Wash | paintings | seedream-4.5 | ✅ |
| `impasto` | Impasto | paintings | nano-banana-2 | ✅ |
| `hokusai-v1` | Hokusai V1 | paintings | seedream-4.5 | ✅ |
| `hokusai-v2` | Hokusai V2 | paintings | nano-banana-2 | ✅ |
| `hiroshige` | Hiroshige | paintings | nano-banana-2 | ✅ |
| `sesshu` | Sesshū | paintings | nano-banana-2 | ✅ |
| `wc-marker` | Watercolor Marker | paintings | flux-kontext-pro | ✅ |
| `pixar-like` | Pixar-like | 3d-characters | flux-kontext-pro | ✅ |
| `funko-pop` | Funko Pop | 3d-characters | flux-kontext-pro | ✅ |
| `aardman` | Aardman | 3d-characters | seedream-4.5 | ✅ |
| `modern-animation` | Modern Animation | 3d-characters | seedream-4.5 | ✅ |
| `carved-stone` | Carved Stone | sculptures | flux-kontext-pro | ✅ |
| `marble` | Marble | sculptures | nano-banana-2 | ✅ |
| `black-granite` | Black Granite | sculptures | nano-banana-2 | ✅ |
| `weathered-limestone` | Weathered Limestone | sculptures | nano-banana-2 | ✅ |
| `sandstone` | Sand Stone | sculptures | nano-banana-2 | ✅ |
| `sand-sculpture` | Sand | sculptures | flux-kontext-pro | ✅ |
| `bronze-cast` | Bronze | sculptures | nano-banana-2 | ✅ |
| `jade` | Jade | sculptures | nano-banana-2 | ✅ |
| `ivory` | Ivory | sculptures | flux-kontext-pro | ✅ |
| `crystal` | Crystal | sculptures | nano-banana-2 | ✅ |
| `ice` | Ice | sculptures | nano-banana-2 | ✅ |
| `metal` | Metal | sculptures | nano-banana-2 | ✅ |
| `wood` | Wood | sculptures | nano-banana-2 | ✅ |
| `gold` | Gold | sculptures | nano-banana-2 | ✅ |
| `porcelain` | Porcelain | sculptures | seedream-4.5 | ✅ |
| `voxel-block` | Voxel Block | 3d-characters | seedream-4.5 | ✅ |
| `3d-portrait-v1` | 3D Portrait V1 | 3d-characters | seedream-4.5 | ✅ |
| `3d-portrait-v2` | 3D Portrait V2 | 3d-characters | nano-banana-2 | ✅ |
| `minime` | Minime | 3d-characters | nano-banana-2 | ✅ |
| `dancing-3d` | Dancing | 3d-characters | seedream-4.5 | ✅ |
| `yarn` | Yarn | 3d-characters | flux-kontext-pro | ✅ |
| `vinyl` | Vinyl | 3d-characters | nano-banana-2 | ✅ |
| `plush` | Plush | 3d-characters | nano-banana-2 | ✅ |
| `bobblehead` | Bobblehead | 3d-characters | seedream-4.5 | ✅ |
| `miniature` | Miniature | 3d-characters | seedream-4.5 | ✅ |
| `plastic-toy-v1` | Plastic Toy V1 | 3d-characters | seedream-4.5 | ✅ |
| `plastic-toy-v2` | Plastic Toy V2 | 3d-characters | nano-banana-2 | ✅ |
| `figurine-v1` | Figurine V1 | 3d-characters | seedream-4.5 | ✅ |
| `figurine-v2` | Figurine V2 | 3d-characters | nano-banana-2 | ✅ |
| `figurine-v3` | Figurine V3 | 3d-characters | seedream-4.5 | ✅ |
| `figurine-v4` | Figurine V4 | 3d-characters | nano-banana-2 | ✅ |
| `handd` | Hand-Drawn | caricatures | nano-banana | ✅ |
| `editorial` | Editorial | art | nano-banana | ✅ |
| `exaggerated` | Exaggerated | caricatures | nano-banana | ✅ |
| `watercolor` | Watercolor | cartoons | seedream-4 | ✅ |
| `carc1` | Caricature 1 | caricatures | seedream-4 | ✅ |
| `carc2` | Caricature 2 | caricatures | nano-banana-2 | ✅ |
| `mugface` | Mugface | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc3` | Caricature 3 | caricatures | nano-banana-2 | ✅ |
| `carc4` | Caricature 4 | caricatures | nano-banana-2 | ✅ |
| `carc5` | Caricature 5 | caricatures | seedream-4.5 | ✅ |
| `carc6` | Caricature 6 | caricatures | nano-banana | ✅ |
| `carc7` | Caricature 7 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc8` | Caricature 8 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc9` | Caricature 9 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc10` | Caricature 10 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc12` | Caricature 12 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc13` | Caricature 13 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc14` | Caricature 14 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc15` | Caricature 15 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `carc16` | Caricature 16 | caricatures | nano-banana-2 (+ style ref) | ✅ |
| `3d-bd` | 3D BD | caricatures | nano-banana-2 | ✅ |
| `3d` | 3D | caricatures | seedream-4.5 | ✅ |
| `dancing-carc` | Dancing | caricatures | nano-banana-2 | ✅ |
| `tiny-muscle-v1` | Tiny Muscle V1 | caricatures | seedream-4.5 | ✅ |
| `tiny-muscle-v2` | Tiny Muscle V2 | caricatures | nano-banana | ✅ |

**Note:** `watercolor` (cartoons) and `water-color` (paintings) are different styles.

---

## Disabled / pending

| Id | Label | Category | Blocker |
|----|-------|----------|---------|
| `coloured_pencil` | coloured_pencil | caricatures | Missing `source/after/caricature/colouredp.jpg`; set `enabled: true` after asset + mobile wiring |

160 catalog placeholders remain `enabled: false` until prompts and art are ready.

---

## Comparison pairs (`CURATED_PAIR_PATHS`)

**Originals (not bundled):** `apps/mobile/assets/comparisons/source/before|after/`  
**Bundled:** `apps/mobile/assets/comparisons/tiles/` (picker) and `hero/` (upload).  
Run `npm run build-comparison-assets` after adding or replacing source files. Folder name on disk is `Art/` (capital A).

| styleId | before | after |
|---------|--------|--------|
| `handd` | `before/hdd.png` | `after/caricature/handd.jpg` |
| `editorial` | `before/man.png` | `after/Art/editorial.jpeg` |
| `exaggerated` | `before/man2.png` | `after/caricature/Exaggerated.jpeg` |
| `watercolor` | `before/couple.png` | `after/cartoons/Watercolor-c.jpg` |
| `carc1` | `before/toon.png` | `after/caricature/carc1.jpg` |
| `carc2` | `before/man6.png` | `after/caricature/carc2.jpeg` |
| `mugface` | `before/man5.png` | `after/caricature/mugface.jpeg` |
| `carc3` | `before/lady7.png` | `after/caricature/carc3.jpeg` |
| `carc4` | `before/man6.png` | `after/caricature/carc4.jpg` |
| `carc5` | `before/man6.png` | `after/caricature/carc5.jpg` |
| `carc6` | `before/lady7.png` | `after/caricature/carc6.jpeg` |
| `carc7` | `before/dude2.png` | `after/caricature/carc7.jpeg` |
| `carc8` | `before/man6.png` | `after/caricature/carc8.jpeg` |
| `carc9` | `before/man9.png` | `after/caricature/carc9.jpeg` |
| `carc10` | `before/lady7.png` | `after/caricature/carc10.jpeg` |
| `carc12` | `before/man6.png` | `after/caricature/carc12.jpeg` |
| `carc13` | `before/man6.png` | `after/caricature/carc13.jpeg` |
| `carc14` | `before/lady4.png` | `after/caricature/carc14.jpeg` |
| `carc15` | `before/lady9.png` | `after/caricature/carc15.jpeg` |
| `carc16` | `before/lady9.png` | `after/caricature/carc16.jpeg` |
| `3d-bd` | `before/lady.png` | `after/caricature/3dbd.jpeg` |
| `3d` | `before/lady6.png` | `after/caricature/3d.jpg` |
| `dancing-carc` | `before/lady6.png` | `after/caricature/dancing-carc.jpeg` |
| `tiny-muscle-v1` | `before/man3.png` | `after/caricature/tiny-muscle1.jpg` |
| `tiny-muscle-v2` | `before/man3.png` | `after/caricature/tiny-muscle2.jpeg` |
| `90s-cartoon` | `before/toon.png` | `after/cartoons/toon.jpg` |
| `chibi` | `before/chibi.png` | `after/cartoons/chibi.jpg` |
| `classic-v1` | `before/lady4.png` | `after/cartoons/classic.jpg` |
| `classic-v2` | `before/man3.png` | `after/cartoons/classicv2.jpeg` |
| `saturday-v1` | `before/dude2.png` | `after/cartoons/smv1.jpeg` |
| `saturday-v2` | `before/dude2.png` | `after/cartoons/smv2.jpg` |
| `comic` | `before/3dclay.png` | `after/cartoons/comic.jpg` |
| `comic-v1` | `before/man7.png` | `after/cartoons/comic-v1.jpg` |
| `comic-v2` | `before/man7.png` | `after/cartoons/comic-v2.jpg` |
| `cute` | `before/hdd.png` | `after/cartoons/cute.jpg` |
| `dc` | `before/man3.png` | `after/cartoons/dc.jpg` |
| `cyberpunk-v1` | `before/lady5.png` | `after/cartoons/cyberpunkv1.jpg` |
| `cyberpunk-v2` | `before/dude.png` | `after/cartoons/cyberpunkv2.jpeg` |
| `disney` | `before/lady3.png` | `after/cartoons/disney.jpg` |
| `pixel` | `before/lady15.png` | `after/cartoons/pixel.jpg` |
| `3d-render-v1` | `before/teen.png` | `after/cartoons/3d-renderv1.jpg` |
| `3d-render-v2` | `before/teen.png` | `after/cartoons/3d-renderv2.jpg` |
| `3dclay` | `before/3dclay.png` | `after/3d/3dclay.jpg` |
| `pixar-like` | `before/lady8.png` | `after/3d/pxl.png` |
| `funko-pop` | `before/teen2.png` | `after/3d/funko.jpg` |
| `aardman` | `before/couple.png` | `after/3d/Aardman.jpg` |
| `modern-animation` | `before/lady13.png` | `after/3d/Modern-Animated.jpg` |
| `carved-stone` | `before/man5.png` | `after/Sculptures/curved-stone.jpg` |
| `marble` | `before/lady4.png` | `after/Sculptures/Marble.jpeg` |
| `black-granite` | `before/man8.png` | `after/Sculptures/Black-granite.jpeg` |
| `weathered-limestone` | `before/man6.png` | `after/Sculptures/weathered-limestone.jpeg` |
| `sandstone` | `before/lady3.png` | `after/Sculptures/sandstone sculpture.jpeg` |
| `sand-sculpture` | `before/lady13.png` | `after/Sculptures/sand.jpg` |
| `bronze-cast` | `before/man9.png` | `after/Sculptures/bronze.jpeg` |
| `jade` | `before/lady14.png` | `after/Sculptures/jade.jpeg` |
| `ivory` | `before/lady8.png` | `after/Sculptures/ivory.jpg` |
| `crystal` | `before/lady4.png` | `after/Sculptures/crystal.jpeg` |
| `ice` | `before/lady12.png` | `after/Sculptures/ice.jpeg` |
| `metal` | `before/man8.png` | `after/Sculptures/metal.jpeg` |
| `wood` | `before/man8.png` | `after/Sculptures/wood.jpeg` |
| `gold` | `before/man9.png` | `after/Sculptures/gold.jpeg` |
| `porcelain` | `before/lady3.png` | `after/Sculptures/porcelain.jpg` |
| `voxel-block` | `before/lady6.png` | `after/3d/voxel-block.jpg` |
| `3d-portrait-v1` | `before/lady2.png` | `after/3d/3d-portraitv1.jpg` |
| `3d-portrait-v2` | `before/lady2.png` | `after/3d/3d-portraitv2.jpeg` |
| `minime` | `before/lady6.png` | `after/3d/minime.jpeg` |
| `dancing-3d` | `before/teen2.png` | `after/3d/dancing-3d.jpg` |
| `yarn` | `before/lady9.png` | `after/3d/yarn.jpg` |
| `vinyl` | `before/lady7.png` | `after/3d/vinyl.jpeg` |
| `plush` | `before/lady7.png` | `after/3d/plush.jpeg` |
| `bobblehead` | `before/man4.png` | `after/3d/bobblehead.jpg` |
| `miniature` | `before/teen2.png` | `after/3d/miniature.jpg` |
| `plastic-toy-v1` | `before/couple.png` | `after/3d/toyv1.jpg` |
| `plastic-toy-v2` | `before/couple.png` | `after/3d/toyv2.jpeg` |
| `figurine-v1` | `before/man10.png` | `after/3d/figurinev1.jpg` |
| `figurine-v2` | `before/man10.png` | `after/3d/figurinev2.jpeg` |
| `figurine-v3` | `before/teen2.png` | `after/3d/figurinev3.jpg` |
| `figurine-v4` | `before/man10.png` | `after/3d/figurinev4.jpeg` |
| `oil-paint` | `before/lady9.png` | `after/Paintings/oilpaint.jpg` |
| `water-color` | `before/wc.png` | `after/Paintings/wc.jpg` |
| `acrylic` | `before/lady12.png` | `after/Paintings/Acrylic.jpg` |
| `gouache` | `before/lady13.png` | `after/Paintings/Gouache.jpg` |
| `expressionist` | `before/man6.png` | `after/Paintings/Expressionist.jpg` |
| `impressionist` | `before/man6.png` | `after/Paintings/Impressionist.jpg` |
| `baroque` | `before/man7.png` | `after/Paintings/Baroque.jpg` |
| `van-gogh` | `before/lady14.png` | `after/Paintings/van-gogh.jpg` |
| `expressive-impasto` | `before/man8.png` | `after/Paintings/Expressive- Impasto.jpeg` |
| `expressive-impasto-v2` | `before/man8.png` | `after/Paintings/Expressive- Impasto2.jpg` |
| `monet` | `before/lady4.png` | `after/Paintings/monet.jpg` |
| `renoir` | `before/lady11.png` | `after/Paintings/Renoir.jpeg` |
| `cezanne` | `before/man5.png` | `after/Paintings/Cézanne.jpg` |
| `gauguin` | `before/lady10.png` | `after/Paintings/Gauguin.jpg` |
| `matisse` | `before/lady8.png` | `after/Paintings/Matisse.jpg` |
| `seurat` | `before/lady2.png` | `after/Paintings/Seurat.jpg` |
| `ink-wash` | `before/lady5.png` | `after/Paintings/Ink-Wash.jpg` |
| `impasto` | `before/dude.png` | `after/Paintings/Impasto.jpeg` |
| `hokusai-v1` | `before/man.png` | `after/Paintings/Hokusai.jpg` |
| `hokusai-v2` | `before/dude.png` | `after/Paintings/Hokusai2.jpeg` |
| `hiroshige` | `before/lady12.png` | `after/Paintings/Hiroshige.jpeg` |
| `sesshu` | `before/lady5.png` | `after/Paintings/Sesshū.jpeg` |
| `wc-marker` | `before/lady3.png` | `after/Paintings/wc-marker.jpg` |
| `mural` | `before/lady2.png` | `after/Art/mural.jpeg` |
| `neon` | `before/lady3.png` | `after/Art/neon.jpg` |
| `lowpoly` | `before/lady4.png` | `after/Art/lowpoly.jpg` |
| `pop-art-v1` | `before/lady5.png` | `after/Art/portart-fkp.jpg` |
| `pop-art-v2` | `before/man3.png` | `after/Art/popart-sr4.jpg` |
| `pop-art-v3` | `before/dude.png` | `after/Art/popart-nbn.jpeg` |
| `graffiti` | `before/dude2.png` | `after/Art/graffiti.jpg` |
| `banksy` | `before/lady6.png` | `after/Art/banksy.jpg` |
| `mosaic` | `before/man4.png` | `after/Art/mosaic.jpg` |
| `hexagonal-mosaic` | `before/lady2.png` | `after/Art/hexagon-mosaic.jpeg` |
| `e-glow` | `before/lady7.png` | `after/Art/eglow.jpg` |
| `abstract-v1` | `before/lady8.png` | `after/Art/abstractv1.jpeg` |
| `abstract-v2` | `before/lady8.png` | `after/Art/abstractv2.jpg` |
| `geometric` | `before/man5.png` | `after/Art/geometric.jpg` |
| `coloured-glass` | `before/lady10.png` | `after/Art/coloured-glass.jpg` |
| `paste-up` | `before/lady11.png` | `after/Art/Paste-up.jpg` |
| `pencil-sketch-v1` | `before/man9.png` | `after/Art/Pencil Sketch1.jpeg` |
| `pencil-sketch-v2` | `before/man9.png` | `after/Art/Pencil Sketch2.jpeg` |
| `origami` | `before/lady14.png` | `after/3d/origami.jpg` |
| `paper-cut` | `before/man5.png` | `after/Art/paper-cut.jpg` |
| `monday-mood` | `before/lady3.png` | `after/Moods&Moments/mondays1.jpg`, `mondays2.jpeg`, `mondays3.jpeg` |
| `friday-feeling` | `before/man9.png` | `after/Moods&Moments/fridays1.jpeg`, `fridays2.jpeg` |

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
