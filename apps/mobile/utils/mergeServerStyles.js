import { DEFAULT_ENABLED_STYLES } from '../data/styleCatalog';

/**
 * Merges /api/styles with the bundled offline catalog.
 * Server entries win on id collision; local-only styles (e.g. not deployed yet) are appended.
 */
export function mergeServerStyles(serverStyles) {
  if (!Array.isArray(serverStyles) || serverStyles.length === 0) {
    return DEFAULT_ENABLED_STYLES;
  }

  const serverIds = new Set(serverStyles.map((s) => s.id));
  const pendingLocal = DEFAULT_ENABLED_STYLES.filter((s) => !serverIds.has(s.id));
  return pendingLocal.length ? [...serverStyles, ...pendingLocal] : serverStyles;
}
