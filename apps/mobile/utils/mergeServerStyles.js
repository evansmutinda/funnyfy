import { DEFAULT_ENABLED_STYLES, getStyleCategory } from '../data/styleCatalog';

/**
 * The bundled DEFAULT_ENABLED_STYLES catalog is the source of truth for which
 * styles appear in the app. Server responses may lag behind local changes until
 * the API is redeployed; merge server metadata (labels/descriptions) onto local
 * entries when ids match, but never show server-only styles that were removed
 * locally.
 */
export function mergeServerStyles(serverStyles) {
  const localById = new Map(DEFAULT_ENABLED_STYLES.map((s) => [s.id, s]));

  if (!Array.isArray(serverStyles) || serverStyles.length === 0) {
    return DEFAULT_ENABLED_STYLES;
  }

  const serverById = new Map(serverStyles.map((s) => [s.id, s]));

  return DEFAULT_ENABLED_STYLES.map((local) => {
    const fromServer = serverById.get(local.id);
    if (!fromServer) return { ...local };

    return {
      ...local,
      ...fromServer,
      categoryId:
        fromServer.categoryId ||
        local.categoryId ||
        getStyleCategory(local.id),
    };
  });
}

/** Style ids the server confirmed on the last successful /api/styles fetch. */
export function getServerConfirmedStyleIds(serverStyles) {
  if (!Array.isArray(serverStyles) || serverStyles.length === 0) return null;
  return new Set(serverStyles.map((s) => s.id).filter(Boolean));
}
