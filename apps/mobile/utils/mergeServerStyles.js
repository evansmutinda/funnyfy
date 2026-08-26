import { DEFAULT_ENABLED_STYLES, getStyleCategory } from '../data/styleCatalog';

/**
 * The bundled DEFAULT_ENABLED_STYLES catalog is the source of truth for which
 * styles appear in the app, and for display labels/descriptions/categories.
 * Server responses may lag behind local changes until the API is redeployed;
 * keep local UI metadata, and only fill gaps from the server.
 */
export function mergeServerStyles(serverStyles) {
  if (!Array.isArray(serverStyles) || serverStyles.length === 0) {
    return DEFAULT_ENABLED_STYLES;
  }

  const serverById = new Map(serverStyles.map((s) => [s.id, s]));

  return DEFAULT_ENABLED_STYLES.map((local) => {
    const fromServer = serverById.get(local.id);
    if (!fromServer) return { ...local };

    return {
      ...fromServer,
      ...local,
      id: local.id,
      label: local.label || fromServer.label,
      description: local.description || fromServer.description,
      categoryId:
        local.categoryId ||
        fromServer.categoryId ||
        getStyleCategory(local.id),
    };
  });
}

/** Style ids the server confirmed on the last successful /api/styles fetch. */
export function getServerConfirmedStyleIds(serverStyles) {
  if (!Array.isArray(serverStyles) || serverStyles.length === 0) return null;
  return new Set(serverStyles.map((s) => s.id).filter(Boolean));
}
