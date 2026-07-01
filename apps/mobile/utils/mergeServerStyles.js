import { DEFAULT_ENABLED_STYLES, getStyleCategory } from '../data/styleCatalog';

/**
 * Use styles from GET /api/styles when the server responds.
 * Only falls back to the bundled catalog when offline or the request fails —
 * do not append local-only styles on top of a successful response, or users can
 * pick styles the API will reject with INVALID_STYLE_ID.
 */
export function mergeServerStyles(serverStyles) {
  if (!Array.isArray(serverStyles) || serverStyles.length === 0) {
    return DEFAULT_ENABLED_STYLES;
  }

  const localById = new Map(DEFAULT_ENABLED_STYLES.map((s) => [s.id, s]));

  return serverStyles.map((style) => ({
    ...localById.get(style.id),
    ...style,
    categoryId:
      style.categoryId ||
      localById.get(style.id)?.categoryId ||
      getStyleCategory(style.id),
  }));
}
