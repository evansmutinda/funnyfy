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
    after: 'after/caricature/editorial.jpeg',
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
    before: 'before/pxl.png',
    after: 'after/3d/pxl.jpg',
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
  'surreal': {
    before: 'before/lady9.png',
    after: 'after/Art/surreal.jpeg',
  },
  'coloured-glass': {
    before: 'before/lady10.png',
    after: 'after/Art/coloured-glass.jpg',
  },
  'paste-up': {
    before: 'before/lady11.png',
    after: 'after/Art/Paste-up.jpg',
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
  const after = assetForTier(paths.after, tier);
  if (!before || !after) return null;
  return { before, after };
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
