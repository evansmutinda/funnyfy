import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export const FUNNYFY_ALBUM_ID_KEY = '@funnyfy_media_album_id';
export const FUNNYFY_FOLDER_NAME = 'Funnyfy';

/** Saved via getSavedImageFileName() in constants.js */
const FUNNYFY_FILENAME_PREFIX = /^funnyfy-/i;
const FUNNYFY_PATH_PATTERN = /[\\/]funnyfy[\\/]/i;

/** Legacy album titles from earlier builds — matched case-insensitively. */
const LEGACY_ALBUM_TITLES = ['Funnyfy', 'FunnyFy', 'FUNNYFY', 'funnyfy'];

function mapAssetToGalleryItem(asset) {
  return {
    id: `media_${asset.id}`,
    imageUrl: asset.uri,
    remoteUrl: null,
    isLocal: true,
    isDeviceAlbum: true,
    mediaAssetId: asset.id,
    styleLabel: 'FunnyFy',
    styleId: null,
    createdAt: asset.creationTime * 1000,
  };
}

function normalizeTitle(title) {
  return String(title || '').trim().toLowerCase();
}

function isFunnyfyAlbumTitle(title) {
  const normalized = normalizeTitle(title);
  if (!normalized) return false;
  if (LEGACY_ALBUM_TITLES.some((t) => normalizeTitle(t) === normalized)) {
    return true;
  }
  return normalized.includes('funnyfy');
}

function isFunnyfySavedPhoto(info) {
  const filename = String(info?.filename || '');
  const localUri = String(info?.localUri || info?.uri || '');
  return FUNNYFY_FILENAME_PREFIX.test(filename) || FUNNYFY_PATH_PATTERN.test(localUri);
}

export async function requestGalleryReadPermission() {
  let perm = await MediaLibrary.getPermissionsAsync(false);
  if (perm.status !== 'granted' && perm.accessPrivileges !== 'limited') {
    perm = await MediaLibrary.requestPermissionsAsync(false);
  }
  const allowed = perm.status === 'granted' || perm.accessPrivileges === 'limited';
  if (!allowed) {
    console.log('[Gallery] Read permission not granted — cannot scan device photos');
  }
  return allowed;
}

/**
 * Find the FunnyFy device album via cached MediaLibrary id or legacy titles.
 * Always prefer this over writing to DCIM paths directly.
 */
export async function resolveFunnyfyAlbum({ rescan = false } = {}) {
  if (!rescan) {
    const cachedId = await AsyncStorage.getItem(FUNNYFY_ALBUM_ID_KEY);
    if (cachedId) {
      try {
        const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
        const cached = albums.find((album) => album.id === cachedId);
        if (cached) {
          return cached;
        }
      } catch (err) {
        console.warn('[Album] cached id lookup failed:', err?.message || err);
      }
      await AsyncStorage.removeItem(FUNNYFY_ALBUM_ID_KEY);
    }
  }

  for (const title of LEGACY_ALBUM_TITLES) {
    try {
      const album = await MediaLibrary.getAlbumAsync(title);
      if (album) {
        await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, album.id);
        return album;
      }
    } catch {
      // try next title
    }
  }

  try {
    const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
    const match = albums.find((album) => isFunnyfyAlbumTitle(album.title));
    if (match) {
      await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, match.id);
      return match;
    }

    if (__DEV__) {
      const sample = albums
        .slice(0, 12)
        .map((album) => album.title)
        .filter(Boolean);
      if (sample.length > 0) {
        console.log('[Gallery] Album titles on device (sample):', sample.join(', '));
      }
    }
  } catch (err) {
    console.warn('[Album] getAlbumsAsync failed:', err?.message || err);
  }

  return null;
}

async function getAssetsFromAlbum(album, first) {
  try {
    const result = await MediaLibrary.getAssetsAsync({
      album: album.id,
      mediaType: MediaLibrary.MediaType.photo,
      first,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });
    return result.assets;
  } catch (err) {
    console.warn('[Gallery] getAssetsAsync(album) failed:', err?.message || err);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        album: album.id,
        mediaType: MediaLibrary.MediaType.photo,
        first,
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      return result.assets;
    } catch (fallbackErr) {
      console.warn('[Gallery] album asset fallback failed:', fallbackErr?.message || fallbackErr);
      return [];
    }
  }
}

/**
 * Fallback when no MediaLibrary album exists: scan recent camera roll photos
 * saved with Funnyfy-* filenames or under a .../Funnyfy/ folder (includes
 * photos that landed in DCIM root before the album fix).
 */
async function scanFunnyfySavedPhotos({ first = 50, scanPool = 200 } = {}) {
  let result;
  try {
    result = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: scanPool,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });
  } catch (err) {
    console.warn('[Gallery] recent photo scan failed:', err?.message || err);
    return [];
  }

  const matches = [];
  for (const asset of result.assets) {
    if (matches.length >= first) break;
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset, {
        shouldDownloadFromNetwork: false,
      });
      if (isFunnyfySavedPhoto(info)) {
        matches.push(asset);
      }
    } catch {
      // Some Android content-uris omit filename — match uri when possible
      if (FUNNYFY_PATH_PATTERN.test(asset.uri || '')) {
        matches.push(asset);
      }
    }
  }

  if (matches.length > 0) {
    console.log(
      '[Gallery] filename/path scan found',
      matches.length,
      'Funnyfy photo(s)',
      Platform.OS === 'android' ? '(album may be missing — e.g. saved to DCIM root)' : '',
    );
  }

  return matches;
}

export async function getFunnyfyAlbumAssets({ first = 50 } = {}) {
  const canRead = await requestGalleryReadPermission();
  if (!canRead) {
    return [];
  }

  const album = await resolveFunnyfyAlbum();
  let assets = [];

  if (album) {
    assets = await getAssetsFromAlbum(album, first);
    if (assets.length > 0) {
      console.log(
        '[Gallery] album scan:',
        assets.length,
        'photo(s) in',
        album.title || FUNNYFY_FOLDER_NAME,
      );
    }
  } else {
    console.log(
      '[Gallery] No',
      FUNNYFY_FOLDER_NAME,
      'album — scanning recent photos for Funnyfy-* saves',
    );
  }

  if (assets.length < first) {
    const scanned = await scanFunnyfySavedPhotos({ first: first - assets.length });
    const seen = new Set(assets.map((asset) => asset.id));
    for (const asset of scanned) {
      if (!seen.has(asset.id)) {
        assets.push(asset);
        seen.add(asset.id);
      }
    }
  }

  return assets.map(mapAssetToGalleryItem);
}
export function mergeGalleryItems(storedItems, albumItems) {
  const merged = [];
  const seen = new Set();

  const addItem = (item) => {
    const key = item.mediaAssetId
      ? `media:${item.mediaAssetId}`
      : item.imageUrl || item.id;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  };

  for (const item of albumItems) {
    addItem(item);
  }

  for (const item of storedItems) {
    if (item.mediaAssetId && seen.has(`media:${item.mediaAssetId}`)) {
      continue;
    }
    addItem(item);
  }

  return merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
