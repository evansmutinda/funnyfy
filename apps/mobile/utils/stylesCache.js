import AsyncStorage from '@react-native-async-storage/async-storage';

const STYLES_CACHE_KEY = '@funnyfy/styles_cache_v1';

function normalizeStyleEntry(style) {
  if (!style?.id) return null;
  return {
    id: style.id,
    label: style.label,
    description: style.description,
    categoryId: style.categoryId || null,
  };
}

export async function readStylesCache() {
  try {
    const raw = await AsyncStorage.getItem(STYLES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const styles = Array.isArray(parsed?.styles)
      ? parsed.styles.map(normalizeStyleEntry).filter(Boolean)
      : [];
    if (!styles.length) return null;
    return { styles, savedAt: parsed.savedAt || null };
  } catch {
    return null;
  }
}

export async function writeStylesCache(serverStyles) {
  const styles = (serverStyles || []).map(normalizeStyleEntry).filter(Boolean);
  if (!styles.length) return;
  try {
    await AsyncStorage.setItem(
      STYLES_CACHE_KEY,
      JSON.stringify({ styles, savedAt: Date.now() }),
    );
  } catch (err) {
    console.warn('[Styles] cache write failed:', err?.message || err);
  }
}
