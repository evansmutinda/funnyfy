// Comparison pairs (before → styled after) for the UploadScreen background
// and any future before/after hero cards.
//
// PLACEHOLDER PHASE: until real generated assets exist, every style reuses
// the same `realistic.jpeg` portrait as the "before" image, and the
// style's existing thumbnail as the "after". Visually this lets the UI
// pattern be validated. Replace with real generated pairs when ready:
//   1. Run scripts/generate-comparison-set.js (TBD)
//   2. Drop into apps/mobile/assets/comparisons/<styleId>/...
//   3. Map the per-style overrides in COMPARISON_OVERRIDES below.

import { getStyleImage } from '../constants';

const DEFAULT_BEFORE = require('../assets/realistic.jpeg');

/**
 * Per-style overrides: { [styleId]: { before, after } }.
 * Empty for now — populated as we generate real pairs.
 */
const COMPARISON_OVERRIDES = {};

/**
 * Returns the { before, after } image pair for a given style. Falls back
 * to the shared "before" portrait + the style's thumbnail when no
 * curated pair has been generated yet.
 */
export function getComparisonPair(style) {
  if (!style) {
    return { before: DEFAULT_BEFORE, after: DEFAULT_BEFORE };
  }
  const override = COMPARISON_OVERRIDES[style.id];
  if (override) return override;
  return {
    before: DEFAULT_BEFORE,
    after: getStyleImage(style),
  };
}

export { DEFAULT_BEFORE };
