import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export const FUNNYFY_ALBUM_ID_KEY = '@funnyfy_media_album_id';
export const FUNNYFY_FOLDER_NAME = 'Funnyfy';

/** Saved via getSavedImageFileName() in constants.js */
const FUNNYFY_FILENAME_PREFIX = /^funnyfy-/i;
const FUNNYFY_PATH_PATTERN = /[\\/]funnyfy[\\/]/i;

const devWarn = (...args) => {
  if (__DEV__) console.warn(...args);
};

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

  const discovered = await discoverFunnyfyAlbumFromExistingPhotos();
  if (discovered) {
    return discovered;
  }

  return null;
}

/**
 * Locate the Funnyfy album from photos already on the device (DCIM/Funnyfy or
 * Funnyfy-* filenames). Caches album id for saves after reinstall / cache loss.
 */
async function discoverFunnyfyAlbumFromExistingPhotos() {
  const canRead = await requestGalleryReadPermission();
  if (!canRead) {
    return null;
  }

  try {
    const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
    const funnyfyAlbums = albums.filter((album) => isFunnyfyAlbumTitle(album.title));

    for (const album of funnyfyAlbums) {
      const count = album.assetCount;
      if (typeof count === 'number' && count > 0) {
        await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, album.id);
        return album;
      }
      const sample = await getAssetsFromAlbum(album, 1);
      if (sample.length > 0) {
        await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, album.id);
        return album;
      }
    }

    if (funnyfyAlbums.length > 0) {
      await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, funnyfyAlbums[0].id);
      return funnyfyAlbums[0];
    }
  } catch (err) {
    devWarn('[Album] title scan discovery failed:', err?.message || err);
  }

  const matches = await scanFunnyfySavedPhotos({ first: 20, scanPool: 500 });
  if (matches.length === 0) {
    return null;
  }

  const matchIds = new Set(matches.map((asset) => asset.id));

  try {
    const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
    for (const album of albums) {
      if (!isFunnyfyAlbumTitle(album.title)) {
        continue;
      }
      const sample = await getAssetsFromAlbum(album, 100);
      if (sample.some((asset) => matchIds.has(asset.id))) {
        await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, album.id);
        return album;
      }
    }
  } catch (err) {
    devWarn('[Album] photo-to-album match failed:', err?.message || err);
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

  let album = await resolveFunnyfyAlbum();
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
  }

  const scanned = await scanFunnyfySavedPhotos({ first, scanPool: 500 });

  if (!album && scanned.length > 0) {
    album = await discoverFunnyfyAlbumFromExistingPhotos();
    if (album) {
      const albumAssets = await getAssetsFromAlbum(album, first);
      if (albumAssets.length > 0) {
        console.log(
          '[Gallery] discovered album from existing photos:',
          albumAssets.length,
          'in',
          album.title || FUNNYFY_FOLDER_NAME,
        );
        assets = albumAssets;
      }
    }
  } else if (album && assets.length === 0 && scanned.length > 0) {
    const rediscovered = await discoverFunnyfyAlbumFromExistingPhotos();
    if (rediscovered) {
      const albumAssets = await getAssetsFromAlbum(rediscovered, first);
      if (albumAssets.length > 0) {
        album = rediscovered;
        assets = albumAssets;
      }
    }
  }

  const seen = new Set(assets.map((asset) => asset.id));
  for (const asset of scanned) {
    if (!seen.has(asset.id)) {
      assets.push(asset);
      seen.add(asset.id);
    }
  }

  if (assets.length === 0 && scanned.length === 0 && !album) {
    console.log(
      '[Gallery] No',
      FUNNYFY_FOLDER_NAME,
      'album or matching photos found on device',
    );
  }

  return assets.slice(0, first).map(mapAssetToGalleryItem);
}

export async function requestGalleryWritePermission() {
  let perm = await MediaLibrary.getPermissionsAsync(true);
  if (perm.status !== 'granted') {
    perm = await MediaLibrary.requestPermissionsAsync(true);
  }
  return perm.status === 'granted';
}

/**
 * Save into the Funnyfy device album (DCIM/Funnyfy on Android).
 * Never falls back to DCIM root — see MD/GALLERY_SCREEN.md.
 */
export async function saveToFunnyfyAlbum(localFileUri) {
  try {
    if (!localFileUri?.startsWith('file://')) {
      devWarn('[Save] invalid file uri for MediaLibrary');
      return false;
    }

    const canWrite = await requestGalleryWritePermission();
    if (!canWrite) {
      devWarn('[Save] MediaLibrary write permission denied');
      return false;
    }

    if (Platform.OS === 'android') {
      return saveToFunnyfyAlbumAndroid(localFileUri);
    }

    return saveToFunnyfyAlbumIos(localFileUri);
  } catch (err) {
    console.error('[Save] saveToFunnyfyAlbum error:', err);
    return false;
  }
}

async function saveToFunnyfyAlbumAndroid(localFileUri) {
  let asset;
  try {
    asset = await MediaLibrary.createAssetAsync(localFileUri);
  } catch (assetErr) {
    console.error('[Save] createAssetAsync failed:', assetErr);
    return false;
  }

  const persistAlbumId = async (albumRef) => {
    const id = typeof albumRef === 'string' ? albumRef : albumRef?.id;
    if (id) {
      await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, id);
    }
  };

  const addToAlbum = async (albumRef) => {
    await MediaLibrary.addAssetsToAlbumAsync([asset], albumRef, false);
    await persistAlbumId(albumRef);
  };

  const cachedId = await AsyncStorage.getItem(FUNNYFY_ALBUM_ID_KEY);
  if (cachedId) {
    try {
      await addToAlbum(cachedId);
      return true;
    } catch (err) {
      devWarn('[Save] add to cached album failed:', err?.message || err);
      await AsyncStorage.removeItem(FUNNYFY_ALBUM_ID_KEY);
    }
  }

  const canRead = await requestGalleryReadPermission();
  if (canRead) {
    const existing = await resolveFunnyfyAlbum({ rescan: true });
    if (existing) {
      try {
        await addToAlbum(existing);
        return true;
      } catch (err) {
        devWarn('[Save] add to resolved album failed:', err?.message || err);
      }
    }
  }

  try {
    const album = await MediaLibrary.createAlbumAsync(
      FUNNYFY_FOLDER_NAME,
      asset,
      false,
    );
    await persistAlbumId(album);
    return true;
  } catch (createErr) {
    devWarn('[Save] createAlbumAsync failed:', createErr?.message || createErr);
  }

  // Asset is in the gallery even if album assignment failed (matches iOS behavior).
  devWarn('[Save] Saved to gallery; Funnyfy album assignment failed');
  return true;
}

async function saveToFunnyfyAlbumIos(localFileUri) {
  let asset;
  try {
    asset = await MediaLibrary.createAssetAsync(localFileUri);
  } catch (assetErr) {
    console.error('[Save] createAssetAsync failed:', assetErr);
    return false;
  }

  const persistAlbumId = async (albumRef) => {
    const id = typeof albumRef === 'string' ? albumRef : albumRef?.id;
    if (id) {
      await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, id);
    }
  };

  const addToAlbum = async (albumRef) => {
    await MediaLibrary.addAssetsToAlbumAsync([asset], albumRef, false);
    await persistAlbumId(albumRef);
  };

  const cachedId = await AsyncStorage.getItem(FUNNYFY_ALBUM_ID_KEY);
  if (cachedId) {
    try {
      await addToAlbum(cachedId);
      return true;
    } catch (err) {
      devWarn('[Save] add to cached album failed:', err?.message || err);
      await AsyncStorage.removeItem(FUNNYFY_ALBUM_ID_KEY);
    }
  }

  const canRead = await requestGalleryReadPermission();
  if (canRead) {
    const existing = await resolveFunnyfyAlbum({ rescan: true });
    if (existing) {
      try {
        await addToAlbum(existing);
        return true;
      } catch (err) {
        devWarn('[Save] add to resolved album failed:', err?.message || err);
      }
    }
  }

  try {
    const album = await MediaLibrary.createAlbumAsync(
      FUNNYFY_FOLDER_NAME,
      asset,
      false,
    );
    await persistAlbumId(album);
    return true;
  } catch (createErr) {
    devWarn('[Save] createAlbumAsync failed:', createErr?.message || createErr);
  }

  devWarn('[Save] Saved to Photos library; Funnyfy album assignment failed');
  return true;
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
