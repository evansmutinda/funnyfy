// Comparison pairs (before → styled after) for UploadScreen + style tile crossfades.
// Asset spec: To do/COMPARISON_ASSETS.md
//
// Layout:
//   assets/comparisons/before/<original>.png|jpg
//   assets/comparisons/after/<categoryFolder>/<after>.jpg|jpeg

import { getStyleImage } from '../constants';

/** Canonical upload comparison aspect (width / height). */
export const COMPARISON_ASPECT_RATIO = 2 / 3;

/** Recommended export size for curated before/after pairs. */
export const COMPARISON_IMAGE_SIZE = { width: 832, height: 1248 };

const DEFAULT_BEFORE = require('../assets/realistic.jpeg');

/** Curated pairs — add one entry per style as assets land. */
const CURATED_PAIRS = {
  handd: {
    before: require('../assets/comparisons/before/hdd.png'),
    after: require('../assets/comparisons/after/caricature/handd.jpeg'),
  },
  editorial: {
    before: require('../assets/comparisons/before/man.png'),
    after: require('../assets/comparisons/after/caricature/editorial.jpeg'),
  },
  exaggerated: {
    before: require('../assets/comparisons/before/man2.png'),
    after: require('../assets/comparisons/after/caricature/Exaggerated.jpeg'),
  },
  watercolor: {
    before: require('../assets/comparisons/before/couple.png'),
    after: require('../assets/comparisons/after/caricature/Watercolor-c.jpg'),
  },
  carc1: {
    before: require('../assets/comparisons/before/toon.png'),
    after: require('../assets/comparisons/after/caricature/carc1.jpg'),
  },
  '90s-cartoon': {
    before: require('../assets/comparisons/before/toon.png'),
    after: require('../assets/comparisons/after/cartoons/toon.jpg'),
  },
  chibi: {
    before: require('../assets/comparisons/before/chibi.png'),
    after: require('../assets/comparisons/after/cartoons/chibi.jpg'),
  },
  'classic-v1': {
    before: require('../assets/comparisons/before/lady4.png'),
    after: require('../assets/comparisons/after/cartoons/classic.jpg'),
  },
  'classic-v2': {
    before: require('../assets/comparisons/before/man3.png'),
    after: require('../assets/comparisons/after/cartoons/classicv2.jpeg'),
  },
  'saturday-v1': {
    before: require('../assets/comparisons/before/dude2.png'),
    after: require('../assets/comparisons/after/cartoons/smv1.jpeg'),
  },
  'saturday-v2': {
    before: require('../assets/comparisons/before/dude2.png'),
    after: require('../assets/comparisons/after/cartoons/smv2.jpg'),
  },
  comic: {
    before: require('../assets/comparisons/before/3dclay.png'),
    after: require('../assets/comparisons/after/cartoons/comic.jpg'),
  },
  cute: {
    before: require('../assets/comparisons/before/hdd.png'),
    after: require('../assets/comparisons/after/cartoons/cute.jpg'),
  },
  dc: {
    before: require('../assets/comparisons/before/man3.png'),
    after: require('../assets/comparisons/after/cartoons/dc.jpg'),
  },
  'cyberpunk-v1': {
    before: require('../assets/comparisons/before/lady5.png'),
    after: require('../assets/comparisons/after/cartoons/cyberpunkv1.jpg'),
  },
  'cyberpunk-v2': {
    before: require('../assets/comparisons/before/dude.png'),
    after: require('../assets/comparisons/after/cartoons/cyberpunkv2.jpeg'),
  },
  disney: {
    before: require('../assets/comparisons/before/lady3.png'),
    after: require('../assets/comparisons/after/cartoons/disney.jpg'),
  },
  '3dclay': {
    before: require('../assets/comparisons/before/3dclay.png'),
    after: require('../assets/comparisons/after/3d/3dclay.jpg'),
  },
  'pixar-like': {
    before: require('../assets/comparisons/before/pxl.png'),
    after: require('../assets/comparisons/after/3d/pxl.jpg'),
  },
  'oil-paint': {
    before: require('../assets/comparisons/before/lady9.png'),
    after: require('../assets/comparisons/after/Paintings/oilpaint.jpg'),
  },
  'water-color': {
    before: require('../assets/comparisons/before/wc.png'),
    after: require('../assets/comparisons/after/Paintings/wc.jpg'),
  },
  acrylic: {
    before: require('../assets/comparisons/before/lady12.png'),
    after: require('../assets/comparisons/after/Paintings/Acrylic.jpg'),
  },
  gouache: {
    before: require('../assets/comparisons/before/lady13.png'),
    after: require('../assets/comparisons/after/Paintings/Gouache.jpg'),
  },
  expressionist: {
    before: require('../assets/comparisons/before/man6.png'),
    after: require('../assets/comparisons/after/Paintings/Expressionist.jpg'),
  },
  impressionist: {
    before: require('../assets/comparisons/before/man6.png'),
    after: require('../assets/comparisons/after/Paintings/Impressionist.jpg'),
  },
  baroque: {
    before: require('../assets/comparisons/before/man7.png'),
    after: require('../assets/comparisons/after/Paintings/Baroque.jpg'),
  },
  'van-gogh': {
    before: require('../assets/comparisons/before/lady14.png'),
    after: require('../assets/comparisons/after/Paintings/van-gogh.jpg'),
  },
  monet: {
    before: require('../assets/comparisons/before/lady4.png'),
    after: require('../assets/comparisons/after/Paintings/monet.jpg'),
  },
  renoir: {
    before: require('../assets/comparisons/before/lady11.png'),
    after: require('../assets/comparisons/after/Paintings/Renoir.jpeg'),
  },
  cezanne: {
    before: require('../assets/comparisons/before/man5.png'),
    after: require('../assets/comparisons/after/Paintings/Cézanne.jpg'),
  },
  gauguin: {
    before: require('../assets/comparisons/before/lady10.png'),
    after: require('../assets/comparisons/after/Paintings/Gauguin.jpg'),
  },
  matisse: {
    before: require('../assets/comparisons/before/lady8.png'),
    after: require('../assets/comparisons/after/Paintings/Matisse.jpg'),
  },
  seurat: {
    before: require('../assets/comparisons/before/lady2.png'),
    after: require('../assets/comparisons/after/Paintings/Seurat.jpg'),
  },
  'ink-wash': {
    before: require('../assets/comparisons/before/lady5.png'),
    after: require('../assets/comparisons/after/Paintings/Ink-Wash.jpg'),
  },
  impasto: {
    before: require('../assets/comparisons/before/dude.png'),
    after: require('../assets/comparisons/after/Paintings/Impasto.jpeg'),
  },
  'hokusai-v1': {
    before: require('../assets/comparisons/before/man.png'),
    after: require('../assets/comparisons/after/Paintings/Hokusai.jpg'),
  },
  'hokusai-v2': {
    before: require('../assets/comparisons/before/dude.png'),
    after: require('../assets/comparisons/after/Paintings/Hokusai2.jpeg'),
  },
  hiroshige: {
    before: require('../assets/comparisons/before/lady12.png'),
    after: require('../assets/comparisons/after/Paintings/Hiroshige.jpeg'),
  },
  sesshu: {
    before: require('../assets/comparisons/before/lady5.png'),
    after: require('../assets/comparisons/after/Paintings/Sesshū.jpeg'),
  },
  mural: {
    before: require('../assets/comparisons/before/lady2.png'),
    after: require('../assets/comparisons/after/Art/mural.jpeg'),
  },
  neon: {
    before: require('../assets/comparisons/before/lady3.png'),
    after: require('../assets/comparisons/after/Art/neon.jpg'),
  },
  lowpoly: {
    before: require('../assets/comparisons/before/lady4.png'),
    after: require('../assets/comparisons/after/Art/lowpoly.jpg'),
  },
  'pop-art-v1': {
    before: require('../assets/comparisons/before/lady5.png'),
    after: require('../assets/comparisons/after/Art/portart-fkp.jpg'),
  },
  'pop-art-v2': {
    before: require('../assets/comparisons/before/man3.png'),
    after: require('../assets/comparisons/after/Art/popart-sr4.jpg'),
  },
  'pop-art-v3': {
    before: require('../assets/comparisons/before/dude.png'),
    after: require('../assets/comparisons/after/Art/popart-nbn.jpeg'),
  },
  graffiti: {
    before: require('../assets/comparisons/before/dude2.png'),
    after: require('../assets/comparisons/after/Art/graffiti.jpg'),
  },
  banksy: {
    before: require('../assets/comparisons/before/lady6.png'),
    after: require('../assets/comparisons/after/Art/banksy.jpg'),
  },
  mosaic: {
    before: require('../assets/comparisons/before/man4.png'),
    after: require('../assets/comparisons/after/Art/mosaic.jpg'),
  },
  'e-glow': {
    before: require('../assets/comparisons/before/lady7.png'),
    after: require('../assets/comparisons/after/Art/eglow.jpg'),
  },
  'abstract-v1': {
    before: require('../assets/comparisons/before/lady8.png'),
    after: require('../assets/comparisons/after/Art/abstractv1.jpeg'),
  },
  'abstract-v2': {
    before: require('../assets/comparisons/before/lady8.png'),
    after: require('../assets/comparisons/after/Art/abstractv2.jpg'),
  },
  geometric: {
    before: require('../assets/comparisons/before/man5.png'),
    after: require('../assets/comparisons/after/Art/geometric.jpg'),
  },
  surreal: {
    before: require('../assets/comparisons/before/lady9.png'),
    after: require('../assets/comparisons/after/Art/surreal.jpeg'),
  },
  'coloured-glass': {
    before: require('../assets/comparisons/before/lady10.png'),
    after: require('../assets/comparisons/after/Art/coloured-glass.jpg'),
  },
  'paste-up': {
    before: require('../assets/comparisons/before/lady11.png'),
    after: require('../assets/comparisons/after/Art/Paste-up.jpg'),
  },
};

export function hasCuratedComparisonPair(style) {
  return Boolean(style?.id && CURATED_PAIRS[style.id]);
}

/**
 * Returns the { before, after } image pair for a given style. Falls back
 * to the shared "before" portrait + the style's thumbnail when no
 * curated pair has been generated yet.
 */
export function getComparisonPair(style) {
  if (!style) {
    return { before: DEFAULT_BEFORE, after: DEFAULT_BEFORE };
  }
  const curated = CURATED_PAIRS[style.id];
  if (curated) return curated;
  return {
    before: DEFAULT_BEFORE,
    after: getStyleImage(style),
  };
}

export { DEFAULT_BEFORE, CURATED_PAIRS };
