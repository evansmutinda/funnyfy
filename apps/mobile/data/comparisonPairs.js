// Comparison pairs (before → styled after) for UploadScreen + style tile crossfades.
// Asset spec: To do/COMPARISON_ASSETS.md
//
// Layout:
//   assets/comparisons/before/<original>.png|jpg
//   assets/comparisons/<styleId>/<after>.jpg|jpeg

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
    after: require('../assets/comparisons/handd/handd.jpeg'),
  },
  '90s-cartoon': {
    before: require('../assets/comparisons/before/toon.png'),
    after: require('../assets/comparisons/90s-cartoon/toon.jpg'),
  },
  chibi: {
    before: require('../assets/comparisons/before/chibi.png'),
    after: require('../assets/comparisons/chibi/chibi.jpg'),
  },
  '3dclay': {
    before: require('../assets/comparisons/before/3dclay.png'),
    after: require('../assets/comparisons/3dclay/3dclay.jpg'),
  },
  'pixar-like': {
    before: require('../assets/comparisons/before/pxl.png'),
    after: require('../assets/comparisons/pxl/pxl.jpg'),
  },
  'oil-paint': {
    before: require('../assets/comparisons/before/oilpaint.png'),
    after: require('../assets/comparisons/oilpaint/oilpaint.jpg'),
  },
  'water-color': {
    before: require('../assets/comparisons/before/wc.png'),
    after: require('../assets/comparisons/wc/wc.jpg'),
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
