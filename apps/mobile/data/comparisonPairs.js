// Comparison pairs (before → styled after) for UploadScreen + style tile crossfades.
// Asset spec: ToDo/COMPARISON_ASSETS.md
//
// Layout:
//   assets/comparisons/source/before|after/  (originals — not bundled)
//   assets/comparisons/tiles/           (picker thumbnails)
//   assets/comparisons/hero/            (upload crossfade)

import { getStyleImage } from '../constants';
import { COMPARISON_HERO_ASSETS, COMPARISON_TILE_ASSETS } from './comparisonPairAssets.generated';

/** Canonical upload comparison aspect (width / height). */
export const COMPARISON_ASPECT_RATIO = 2 / 3;

/** Recommended export size for curated before/after pairs. */
export const COMPARISON_IMAGE_SIZE = { width: 832, height: 1248 };

const DEFAULT_BEFORE = require('../assets/realistic.jpeg');

/** Curated pairs — add one entry per style as assets land. */
const CURATED_PAIR_PATHS = {
  'handd': {
    before: 'before/hdd.png',
    after: 'after/caricature/handd.jpeg',
  },
  'editorial': {
    before: 'before/man.png',
    after: 'after/Art/editorial.jpeg',
  },
  'exaggerated': {
    before: 'before/man2.png',
    after: 'after/caricature/Exaggerated.jpeg',
  },
  'watercolor': {
    before: 'before/couple.png',
    after: 'after/caricature/Watercolor-c.jpg',
  },
  'carc1': {
    before: 'before/toon.png',
    after: 'after/caricature/carc1.jpg',
  },
  'carc2': {
    before: 'before/man6.png',
    after: 'after/caricature/carc2.jpeg',
  },
  'carc3': {
    before: 'before/lady7.png',
    after: 'after/caricature/carc3.jpeg',
  },
  'carc4': {
    before: 'before/man6.png',
    after: 'after/caricature/carc4.jpg',
  },
  'carc5': {
    before: 'before/man6.png',
    after: 'after/caricature/carc5.jpg',
  },
  'carc6': {
    before: 'before/lady7.png',
    after: 'after/caricature/carc6.jpeg',
  },
  '3d-bd': {
    before: 'before/lady.png',
    after: 'after/caricature/3dbd.jpeg',
  },
  '3d': {
    before: 'before/lady6.png',
    after: 'after/caricature/3d.jpg',
  },
  'dancing-carc': {
    before: 'before/lady6.png',
    after: 'after/caricature/dancing-carc.jpeg',
  },
  'tiny-muscle-v1': {
    before: 'before/man3.png',
    after: 'after/caricature/tiny-muscle1.jpg',
  },
  'tiny-muscle-v2': {
    before: 'before/man3.png',
    after: 'after/caricature/tiny-muscle2.jpeg',
  },
  '90s-cartoon': {
    before: 'before/toon.png',
    after: 'after/cartoons/toon.jpg',
  },
  'chibi': {
    before: 'before/chibi.png',
    after: 'after/cartoons/chibi.jpg',
  },
  'classic-v1': {
    before: 'before/lady4.png',
    after: 'after/cartoons/classic.jpg',
  },
  'classic-v2': {
    before: 'before/man3.png',
    after: 'after/cartoons/classicv2.jpeg',
  },
  'saturday-v1': {
    before: 'before/dude2.png',
    after: 'after/cartoons/smv1.jpeg',
  },
  'saturday-v2': {
    before: 'before/dude2.png',
    after: 'after/cartoons/smv2.jpg',
  },
  'comic': {
    before: 'before/3dclay.png',
    after: 'after/cartoons/comic.jpg',
  },
  'cute': {
    before: 'before/hdd.png',
    after: 'after/cartoons/cute.jpg',
  },
  'dc': {
    before: 'before/man3.png',
    after: 'after/cartoons/dc.jpg',
  },
  'cyberpunk-v1': {
    before: 'before/lady5.png',
    after: 'after/cartoons/cyberpunkv1.jpg',
  },
  'cyberpunk-v2': {
    before: 'before/dude.png',
    after: 'after/cartoons/cyberpunkv2.jpeg',
  },
  'disney': {
    before: 'before/lady3.png',
    after: 'after/cartoons/disney.jpg',
  },
  'pixel': {
    before: 'before/lady15.png',
    after: 'after/cartoons/pixel.jpg',
  },
  '3d-render-v1': {
    before: 'before/teen.png',
    after: 'after/cartoons/3d-renderv1.jpg',
  },
  '3d-render-v2': {
    before: 'before/teen.png',
    after: 'after/cartoons/3d-renderv2.jpg',
  },
  'comic-v1': {
    before: 'before/man7.png',
    after: 'after/cartoons/comic-v1.jpg',
  },
  'comic-v2': {
    before: 'before/man7.png',
    after: 'after/cartoons/comic-v2.jpg',
  },
  '3dclay': {
    before: 'before/3dclay.png',
    after: 'after/3d/3dclay.jpg',
  },
  'pixar-like': {
    before: 'before/lady8.png',
    after: 'after/3d/pxl.png',
  },
  'funko-pop': {
    before: 'before/teen2.png',
    after: 'after/3d/funko.jpg',
  },
  'aardman': {
    before: 'before/couple.png',
    after: 'after/3d/Aardman.jpg',
  },
  'modern-animation': {
    before: 'before/lady13.png',
    after: 'after/3d/Modern-Animated.jpg',
  },
  'carved-stone': {
    before: 'before/man5.png',
    after: 'after/Sculptures/curved-stone.jpg',
  },
  'marble': {
    before: 'before/lady4.png',
    after: 'after/Sculptures/Marble.jpeg',
  },
  'black-granite': {
    before: 'before/man8.png',
    after: 'after/Sculptures/Black-granite.jpeg',
  },
  'weathered-limestone': {
    before: 'before/man6.png',
    after: 'after/Sculptures/weathered-limestone.jpeg',
  },
  'sandstone': {
    before: 'before/lady3.png',
    after: 'after/Sculptures/sandstone sculpture.jpeg',
  },
  'sand-sculpture': {
    before: 'before/lady13.png',
    after: 'after/Sculptures/sand.jpg',
  },
  'bronze-cast': {
    before: 'before/man9.png',
    after: 'after/Sculptures/bronze.jpeg',
  },
  'jade': {
    before: 'before/lady14.png',
    after: 'after/Sculptures/jade.jpeg',
  },
  'ivory': {
    before: 'before/lady8.png',
    after: 'after/Sculptures/ivory.jpg',
  },
  'crystal': {
    before: 'before/lady4.png',
    after: 'after/Sculptures/crystal.jpeg',
  },
  'ice': {
    before: 'before/lady12.png',
    after: 'after/Sculptures/ice.jpeg',
  },
  'metal': {
    before: 'before/man8.png',
    after: 'after/Sculptures/metal.jpeg',
  },
  'wood': {
    before: 'before/man8.png',
    after: 'after/Sculptures/wood.jpeg',
  },
  'gold': {
    before: 'before/man9.png',
    after: 'after/Sculptures/gold.jpeg',
  },
  'porcelain': {
    before: 'before/lady3.png',
    after: 'after/Sculptures/porcelain.jpg',
  },
  'voxel-block': {
    before: 'before/lady6.png',
    after: 'after/3d/voxel-block.jpg',
  },
  '3d-portrait-v1': {
    before: 'before/lady2.png',
    after: 'after/3d/3d-portraitv1.jpg',
  },
  '3d-portrait-v2': {
    before: 'before/lady2.png',
    after: 'after/3d/3d-portraitv2.jpeg',
  },
  'minime': {
    before: 'before/lady6.png',
    after: 'after/3d/minime.jpeg',
  },
  'dancing-3d': {
    before: 'before/teen2.png',
    after: 'after/3d/dancing-3d.jpg',
  },
  'yarn': {
    before: 'before/lady9.png',
    after: 'after/3d/yarn.jpg',
  },
  'vinyl': {
    before: 'before/lady7.png',
    after: 'after/3d/vinyl.jpeg',
  },
  'plush': {
    before: 'before/lady7.png',
    after: 'after/3d/plush.jpeg',
  },
  'bobblehead': {
    before: 'before/man4.png',
    after: 'after/3d/bobblehead.jpg',
  },
  'miniature': {
    before: 'before/teen2.png',
    after: 'after/3d/miniature.jpg',
  },
  'plastic-toy-v1': {
    before: 'before/couple.png',
    after: 'after/3d/toyv1.jpg',
  },
  'plastic-toy-v2': {
    before: 'before/couple.png',
    after: 'after/3d/toyv2.jpeg',
  },
  'figurine-v1': {
    before: 'before/man10.png',
    after: 'after/3d/figurinev1.jpg',
  },
  'figurine-v2': {
    before: 'before/man10.png',
    after: 'after/3d/figurinev2.jpeg',
  },
  'figurine-v3': {
    before: 'before/teen2.png',
    after: 'after/3d/figurinev3.jpg',
  },
  'figurine-v4': {
    before: 'before/man10.png',
    after: 'after/3d/figurinev4.jpeg',
  },
  'oil-paint': {
    before: 'before/lady9.png',
    after: 'after/Paintings/oilpaint.jpg',
  },
  'water-color': {
    before: 'before/wc.png',
    after: 'after/Paintings/wc.jpg',
  },
  'acrylic': {
    before: 'before/lady12.png',
    after: 'after/Paintings/Acrylic.jpg',
  },
  'gouache': {
    before: 'before/lady13.png',
    after: 'after/Paintings/Gouache.jpg',
  },
  'expressionist': {
    before: 'before/man6.png',
    after: 'after/Paintings/Expressionist.jpg',
  },
  'impressionist': {
    before: 'before/man6.png',
    after: 'after/Paintings/Impressionist.jpg',
  },
  'baroque': {
    before: 'before/man7.png',
    after: 'after/Paintings/Baroque.jpg',
  },
  'van-gogh': {
    before: 'before/lady14.png',
    after: 'after/Paintings/van-gogh.jpg',
  },
  'expressive-impasto': {
    before: 'before/man8.png',
    after: 'after/Paintings/Expressive- Impasto.jpeg',
  },
  'expressive-impasto-v2': {
    before: 'before/man8.png',
    after: 'after/Paintings/Expressive- Impasto2.jpg',
  },
  'monet': {
    before: 'before/lady4.png',
    after: 'after/Paintings/monet.jpg',
  },
  'renoir': {
    before: 'before/lady11.png',
    after: 'after/Paintings/Renoir.jpeg',
  },
  'cezanne': {
    before: 'before/man5.png',
    after: 'after/Paintings/Cézanne.jpg',
  },
  'gauguin': {
    before: 'before/lady10.png',
    after: 'after/Paintings/Gauguin.jpg',
  },
  'matisse': {
    before: 'before/lady8.png',
    after: 'after/Paintings/Matisse.jpg',
  },
  'seurat': {
    before: 'before/lady2.png',
    after: 'after/Paintings/Seurat.jpg',
  },
  'ink-wash': {
    before: 'before/lady5.png',
    after: 'after/Paintings/Ink-Wash.jpg',
  },
  'impasto': {
    before: 'before/dude.png',
    after: 'after/Paintings/Impasto.jpeg',
  },
  'hokusai-v1': {
    before: 'before/man.png',
    after: 'after/Paintings/Hokusai.jpg',
  },
  'hokusai-v2': {
    before: 'before/dude.png',
    after: 'after/Paintings/Hokusai2.jpeg',
  },
  'hiroshige': {
    before: 'before/lady12.png',
    after: 'after/Paintings/Hiroshige.jpeg',
  },
  'sesshu': {
    before: 'before/lady5.png',
    after: 'after/Paintings/Sesshū.jpeg',
  },
  'wc-marker': {
    before: 'before/lady3.png',
    after: 'after/Paintings/wc-marker.jpg',
  },
  'mural': {
    before: 'before/lady2.png',
    after: 'after/Art/mural.jpeg',
  },
  'neon': {
    before: 'before/lady3.png',
    after: 'after/Art/neon.jpg',
  },
  'lowpoly': {
    before: 'before/lady4.png',
    after: 'after/Art/lowpoly.jpg',
  },
  'pop-art-v1': {
    before: 'before/lady5.png',
    after: 'after/Art/portart-fkp.jpg',
  },
  'pop-art-v2': {
    before: 'before/man3.png',
    after: 'after/Art/popart-sr4.jpg',
  },
  'pop-art-v3': {
    before: 'before/dude.png',
    after: 'after/Art/popart-nbn.jpeg',
  },
  'graffiti': {
    before: 'before/dude2.png',
    after: 'after/Art/graffiti.jpg',
  },
  'banksy': {
    before: 'before/lady6.png',
    after: 'after/Art/banksy.jpg',
  },
  'mosaic': {
    before: 'before/man4.png',
    after: 'after/Art/mosaic.jpg',
  },
  'hexagonal-mosaic': {
    before: 'before/lady2.png',
    after: 'after/Art/hexagon-mosaic.jpeg',
  },
  'e-glow': {
    before: 'before/lady7.png',
    after: 'after/Art/eglow.jpg',
  },
  'abstract-v1': {
    before: 'before/lady8.png',
    after: 'after/Art/abstractv1.jpeg',
  },
  'abstract-v2': {
    before: 'before/lady8.png',
    after: 'after/Art/abstractv2.jpg',
  },
  'geometric': {
    before: 'before/man5.png',
    after: 'after/Art/geometric.jpg',
  },
  'coloured-glass': {
    before: 'before/lady10.png',
    after: 'after/Art/coloured-glass.jpg',
  },
  'paste-up': {
    before: 'before/lady11.png',
    after: 'after/Art/Paste-up.jpg',
  },
  'pencil-sketch-v1': {
    before: 'before/man9.png',
    after: 'after/Art/Pencil Sketch1.jpeg',
  },
  'pencil-sketch-v2': {
    before: 'before/man9.png',
    after: 'after/Art/Pencil Sketch2.jpeg',
  },
  'origami': {
    before: 'before/lady14.png',
    after: 'after/3d/origami.jpg',
  },
  'paper-cut': {
    before: 'before/man5.png',
    after: 'after/Art/paper-cut.jpg',
  },
  'monday-mood': {
    before: 'before/lady3.png',
    after: ['after/Moods&Moments/mondays1.jpg', 'after/Moods&Moments/mondays2.jpeg', 'after/Moods&Moments/mondays3.jpeg'],
  },
  'friday-feeling': {
    before: 'before/man9.png',
    after: ['after/Moods&Moments/fridays1.jpeg', 'after/Moods&Moments/fridays2.jpeg'],
  },
};

function assetForTier(relPath, tier) {
  const key = toOutputRel(relPath);
  const table = tier === 'tiles' ? COMPARISON_TILE_ASSETS : COMPARISON_HERO_ASSETS;
  return table[key] || null;
}

function resolveCuratedPair(styleId, tier) {
  const paths = CURATED_PAIR_PATHS[styleId];
  if (!paths) return null;
  const before = assetForTier(paths.before, tier);
  const afterPathList = Array.isArray(paths.after) ? paths.after : [paths.after];
  const afters = afterPathList
    .map((rel) => assetForTier(rel, tier))
    .filter(Boolean);
  if (!before || afters.length === 0) return null;
  return { before, after: afters[0], afters };
}

function toOutputRel(inputRel) {
  const slash = inputRel.replace(/\\/g, '/');
  const last = slash.lastIndexOf('/');
  const dir = last >= 0 ? slash.slice(0, last) : '';
  const file = last >= 0 ? slash.slice(last + 1) : slash;
  const dot = file.lastIndexOf('.');
  const stem = dot >= 0 ? file.slice(0, dot) : file;
  return dir ? `${dir}/${stem}.jpg` : `${stem}.jpg`;
}

export function hasCuratedComparisonPair(style, tier = 'tiles') {
  if (!style?.id || !CURATED_PAIR_PATHS[style.id]) return false;
  return Boolean(resolveCuratedPair(style.id, tier));
}

/**
 * Returns the { before, after } image pair for a given style. Falls back
 * to the shared "before" portrait + the style's thumbnail when no
 * curated pair has been generated yet.
 */
export function getComparisonPair(style, tier = 'hero') {
  if (!style) {
    return { before: DEFAULT_BEFORE, after: DEFAULT_BEFORE };
  }
  const curated = resolveCuratedPair(style.id, tier);
  if (curated) return curated;
  return {
    before: DEFAULT_BEFORE,
    after: getStyleImage(style),
  };
}

export function getTileComparisonPair(style) {
  return getComparisonPair(style, 'tiles');
}

/** Picker thumbnail — prefer bundled tile "after" asset, same path pixel uses. */
export function getPickerThumbnail(style) {
  const curated = style?.id ? resolveCuratedPair(style.id, 'tiles') : null;
  if (curated?.after) return curated.after;
  return getStyleImage(style);
}

export { DEFAULT_BEFORE, CURATED_PAIR_PATHS };
