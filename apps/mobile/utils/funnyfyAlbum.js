import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export const FUNNYFY_ALBUM_ID_KEY = '@funnyfy_media_album_id';
export const GALLERY_HIDDEN_KEY = '@funnyfy_gallery_hidden';
export const FUNNYFY_FOLDER_NAME = 'Funnyfy';
/** Canonical Android path — photos live here on device. */
export const FUNNYFY_DCIM_RELATIVE_PATH = 'DCIM/Funnyfy';

/** Saved via getSavedImageFileName() in constants.js */
const FUNNYFY_FILENAME_PREFIX = /^funnyfy-/i;
const FUNNYFY_PATH_PATTERN = /[\\/]funnyfy[\\/]/i;

const devWarn = (...args) => {
  if (__DEV__) console.warn(...args);
};

/** Legacy album titles from earlier builds — matched case-insensitively. */
const LEGACY_ALBUM_TITLES = ['Funnyfy', 'FunnyFy', 'FUNNYFY', 'funnyfy'];

function mapAssetToGalleryItem(asset, imageUrl = asset.uri) {
  return {
    id: `media_${asset.id}`,
    imageUrl,
    remoteUrl: null,
    isLocal: true,
    isDeviceAlbum: true,
    mediaAssetId: asset.id,
    styleLabel: 'FunnyFy',
    styleId: null,
    createdAt: asset.creationTime * 1000,
  };
}

async function enrichAssetDisplayUri(asset) {
  let imageUrl = asset.uri;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(asset, {
      shouldDownloadFromNetwork: false,
    });
    imageUrl = info.localUri || info.uri || asset.uri;
  } catch {
    // Some devices only expose content:// on asset.uri — keep it.
  }
  return mapAssetToGalleryItem(asset, imageUrl);
}

async function mapAssetsToGalleryItems(assets) {
  return Promise.all(assets.map((asset) => enrichAssetDisplayUri(asset)));
}

async function listFunnyfyAlbums() {
  try {
    const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
    return albums.filter((album) => isFunnyfyAlbumTitle(album.title));
  } catch (err) {
    console.warn('[Gallery] listFunnyfyAlbums failed:', err?.message || err);
    return [];
  }
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
async function scanFunnyfySavedPhotos({ first = 50, scanPool = 800 } = {}) {
  const matches = [];
  const seen = new Set();
  let after;
  const pageSize = 200;
  let scanned = 0;

  while (matches.length < first && scanned < scanPool) {
    const batchSize = Math.min(pageSize, scanPool - scanned);
    let result;
    try {
      result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: batchSize,
        after,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
    } catch (err) {
      console.warn('[Gallery] recent photo scan failed:', err?.message || err);
      break;
    }

    if (!result.assets.length) {
      break;
    }

    scanned += result.assets.length;

    for (const asset of result.assets) {
      if (matches.length >= first || seen.has(asset.id)) {
        continue;
      }

      if (FUNNYFY_PATH_PATTERN.test(asset.uri || '')) {
        seen.add(asset.id);
        matches.push(asset);
        continue;
      }

      try {
        const info = await MediaLibrary.getAssetInfoAsync(asset, {
          shouldDownloadFromNetwork: false,
        });
        if (isFunnyfySavedPhoto(info)) {
          seen.add(asset.id);
          matches.push(asset);
        }
      } catch {
        // Some Android content-uris omit filename — already checked uri above.
      }
    }

    if (!result.hasNextPage) {
      break;
    }
    after = result.endCursor;
  }

  if (matches.length > 0) {
    console.log(
      '[Gallery] DCIM/Funnyfy path scan found',
      matches.length,
      'photo(s)',
      Platform.OS === 'android' ? `(scanned ${scanned} recent)` : '',
    );
  }

  return matches;
}

export async function getFunnyfyAlbumAssets({ first = 50, rescan = false } = {}) {
  const canRead = await requestGalleryReadPermission();
  if (!canRead) {
    return [];
  }

  if (rescan) {
    await AsyncStorage.removeItem(FUNNYFY_ALBUM_ID_KEY);
  }

  const assets = [];
  const seen = new Set();

  const addAssets = (batch) => {
    for (const asset of batch) {
      if (seen.has(asset.id)) continue;
      seen.add(asset.id);
      assets.push(asset);
      if (assets.length >= first) break;
    }
  };

  const funnyfyAlbums = await listFunnyfyAlbums();
  for (const album of funnyfyAlbums) {
    if (assets.length >= first) break;
    const batch = await getAssetsFromAlbum(album, first - assets.length);
    if (batch.length > 0) {
      console.log(
        '[Gallery] album',
        album.title || FUNNYFY_FOLDER_NAME,
        ':',
        batch.length,
        'photo(s)',
      );
      addAssets(batch);
      await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, album.id);
    }
  }

  if (assets.length < first) {
    const cachedId = await AsyncStorage.getItem(FUNNYFY_ALBUM_ID_KEY);
    if (cachedId && !funnyfyAlbums.some((album) => album.id === cachedId)) {
      const cachedAlbum = { id: cachedId, title: FUNNYFY_FOLDER_NAME };
      const batch = await getAssetsFromAlbum(cachedAlbum, first - assets.length);
      if (batch.length > 0) {
        addAssets(batch);
      } else {
        await AsyncStorage.removeItem(FUNNYFY_ALBUM_ID_KEY);
      }
    }
  }

  if (assets.length < first) {
    const resolved = await resolveFunnyfyAlbum({ rescan: true });
    if (resolved && !funnyfyAlbums.some((album) => album.id === resolved.id)) {
      const batch = await getAssetsFromAlbum(resolved, first - assets.length);
      if (batch.length > 0) {
        addAssets(batch);
        await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, resolved.id);
      }
    }
  }

  if (assets.length < first) {
    const scanned = await scanFunnyfySavedPhotos({
      first: first - assets.length,
      scanPool: 800,
    });
    addAssets(scanned);
  }

  if (assets.length === 0) {
    console.log(
      '[Gallery] No photos in',
      FUNNYFY_DCIM_RELATIVE_PATH,
      `(albums found: ${funnyfyAlbums.length})`,
    );
    return [];
  }

  console.log('[Gallery] Loaded', assets.length, 'photo(s) from', FUNNYFY_DCIM_RELATIVE_PATH);
  return mapAssetsToGalleryItems(assets.slice(0, first));
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
 * @returns {Promise<{ ok: boolean, assetId?: string }>}
 */
export async function saveToFunnyfyAlbum(localFileUri) {
  try {
    if (!localFileUri?.startsWith('file://')) {
      devWarn('[Save] invalid file uri for MediaLibrary');
      return { ok: false };
    }

    const canWrite = await requestGalleryWritePermission();
    if (!canWrite) {
      devWarn('[Save] MediaLibrary write permission denied');
      return { ok: false };
    }

    if (Platform.OS === 'android') {
      return saveToFunnyfyAlbumAndroid(localFileUri);
    }

    return saveToFunnyfyAlbumIos(localFileUri);
  } catch (err) {
    console.error('[Save] saveToFunnyfyAlbum error:', err);
    return { ok: false };
  }
}

function saveAlbumSuccess(asset) {
  return { ok: true, assetId: asset?.id };
}

async function saveToFunnyfyAlbumAndroid(localFileUri) {
  let asset;
  try {
    asset = await MediaLibrary.createAssetAsync(localFileUri);
  } catch (assetErr) {
    console.error('[Save] createAssetAsync failed:', assetErr);
    return { ok: false };
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
      return saveAlbumSuccess(asset);
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
        return saveAlbumSuccess(asset);
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
    return saveAlbumSuccess(asset);
  } catch (createErr) {
    devWarn('[Save] createAlbumAsync failed:', createErr?.message || createErr);
  }

  // Asset is in the gallery even if album assignment failed (matches iOS behavior).
  devWarn('[Save] Saved to gallery; Funnyfy album assignment failed');
  return saveAlbumSuccess(asset);
}

async function saveToFunnyfyAlbumIos(localFileUri) {
  let asset;
  try {
    asset = await MediaLibrary.createAssetAsync(localFileUri);
  } catch (assetErr) {
    console.error('[Save] createAssetAsync failed:', assetErr);
    return { ok: false };
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
      return saveAlbumSuccess(asset);
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
        return saveAlbumSuccess(asset);
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
    return saveAlbumSuccess(asset);
  } catch (createErr) {
    devWarn('[Save] createAlbumAsync failed:', createErr?.message || createErr);
  }

  devWarn('[Save] Saved to Photos library; Funnyfy album assignment failed');
  return saveAlbumSuccess(asset);
}

export function galleryItemHiddenKey(item) {
  if (item?.mediaAssetId) return `media:${item.mediaAssetId}`;
  if (item?.id) return `id:${item.id}`;
  return null;
}

export async function getGalleryHiddenKeys() {
  try {
    const raw = await AsyncStorage.getItem(GALLERY_HIDDEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export async function addGalleryHiddenKeys(keys) {
  const hidden = await getGalleryHiddenKeys();
  for (const key of keys) {
    if (key) hidden.add(key);
  }
  await AsyncStorage.setItem(GALLERY_HIDDEN_KEY, JSON.stringify([...hidden]));
}

export function isGalleryItemHidden(item, hiddenKeys) {
  const key = galleryItemHiddenKey(item);
  return Boolean(key && hiddenKeys.has(key));
}

export function filterHiddenGalleryItems(items, hiddenKeys) {
  return items.filter((item) => !isGalleryItemHidden(item, hiddenKeys));
}

const DEVICE_MATCH_WINDOW_MS = 60_000;

async function resolveDeviceAssetIdsForGalleryItems(items) {
  const assetIds = new Set();
  const unresolved = [];

  for (const item of items) {
    if (item.mediaAssetId) {
      assetIds.add(item.mediaAssetId);
    } else {
      unresolved.push(item);
    }
  }

  if (unresolved.length === 0) {
    return [...assetIds];
  }

  const albumItems = await getFunnyfyAlbumAssets({ first: 100, rescan: false });
  const usedAlbumIds = new Set(assetIds);

  for (const item of unresolved) {
    const createdAt = item.createdAt || 0;
    const match = albumItems.find((album) => {
      if (!album.mediaAssetId || usedAlbumIds.has(album.mediaAssetId)) {
        return false;
      }
      const albumTime = album.createdAt || 0;
      return Math.abs(albumTime - createdAt) <= DEVICE_MATCH_WINDOW_MS;
    });

    if (match?.mediaAssetId) {
      assetIds.add(match.mediaAssetId);
      usedAlbumIds.add(match.mediaAssetId);
    }
  }

  return [...assetIds];
}

export async function deleteDeviceGalleryAssets(items) {
  const assetIds = await resolveDeviceAssetIdsForGalleryItems(items);
  if (!assetIds.length) {
    return { ok: true, deleted: 0, notFound: items.length };
  }

  const canWrite = await requestGalleryWritePermission();
  if (!canWrite) {
    return { ok: false, reason: 'permission' };
  }

  try {
    await MediaLibrary.deleteAssetsAsync(assetIds);
    return { ok: true, deleted: assetIds.length };
  } catch (err) {
    console.error('[Gallery] deleteAssetsAsync failed:', err);
    return { ok: false, reason: 'error' };
  }
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

/**
 * Resolve a gallery item URI to a local file:// path suitable for expo-sharing.
 */
export async function resolveShareableImageUri(item, fileName) {
  const imageUrl = item?.imageUrl;
  if (!imageUrl) {
    throw new Error('Missing image');
  }

  if (imageUrl.startsWith('file://')) {
    const info = await FileSystem.getInfoAsync(imageUrl);
    if (info.exists) {
      return imageUrl;
    }
  }

  const cachePath = `${FileSystem.cacheDirectory}${fileName}`;

  if (item?.mediaAssetId) {
    const info = await MediaLibrary.getAssetInfoAsync(item.mediaAssetId);
    const sourceUri = info.localUri || info.uri || imageUrl;
    if (sourceUri.startsWith('file://')) {
      const localInfo = await FileSystem.getInfoAsync(sourceUri);
      if (localInfo.exists) {
        return sourceUri;
      }
    }
    await FileSystem.copyAsync({ from: sourceUri, to: cachePath });
    return cachePath;
  }

  if (
    imageUrl.startsWith('content://')
    || imageUrl.startsWith('ph://')
    || (Platform.OS === 'ios' && imageUrl.startsWith('assets-library://'))
  ) {
    await FileSystem.copyAsync({ from: imageUrl, to: cachePath });
    return cachePath;
  }

  const dl = await FileSystem.downloadAsync(imageUrl, cachePath);
  if (dl.status !== 200) {
    throw new Error(`Download failed (${dl.status})`);
  }
  return dl.uri;
}
