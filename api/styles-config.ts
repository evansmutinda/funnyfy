/**
 * Style config re-export.
 *
 * **Edit styles in `api/_utils/styles-config.ts`** (LEGACY_STYLES block).
 * Enqueue, /api/styles, and the queue worker all use that file.
 * This module exists for older imports (e.g. api/test.ts).
 */

export type { StyleConfig } from './_utils/styles-config';
export {
  STYLES_CONFIG,
  getStyleById,
  getEnabledStyles,
  getFreeStyles,
} from './_utils/styles-config';
