// Comparison pairs (before → styled after) for the UploadScreen background.
// Asset spec + generation checklist: To do/COMPARISON_ASSETS.md
//
// Placeholder: shared realistic.jpeg "before" + style picker thumbnail "after".
// Replace via COMPARISON_OVERRIDES once curated pairs exist.

import { getStyleImage } from '../constants';

/** Canonical upload comparison aspect (width / height). */
export const COMPARISON_ASPECT_RATIO = 2 / 3;

/** Recommended export size for curated before/after pairs. */
export const COMPARISON_IMAGE_SIZE = { width: 832, height: 1248 };

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
