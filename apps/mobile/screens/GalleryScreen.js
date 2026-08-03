import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNotifications } from '../components/NotificationProvider';
import MediaTile from '../components/MediaTile';
import PressScale from '../components/PressScale';
import { BOTTOM_INSET_MIN, getSavedImageFileName, SAVED_IMAGE_MIME } from '../constants';
import {
  addGalleryHiddenKeys,
  deleteDeviceGalleryAssets,
  filterHiddenGalleryItems,
  galleryItemHiddenKey,
  getFunnyfyAlbumAssets,
  getGalleryHiddenKeys,
  mergeGalleryItems,
  requestGalleryReadPermission,
  resolveShareableImageUri,
} from '../utils/funnyfyAlbum';
import styles from '../styles';

const GALLERY_STORAGE_KEY = '@funnyfy_gallery';
const GALLERY_MAX_ITEMS = 50;
const GALLERY_FOLDER = FileSystem.documentDirectory + 'gallery/';

async function ensureGalleryFolder() {
  try {
    const info = await FileSystem.getInfoAsync(GALLERY_FOLDER);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(GALLERY_FOLDER, { intermediates: true });
    }
  } catch (err) {
    console.warn('[Gallery] ensureGalleryFolder error:', err);
  }
}

async function saveToGallery(item) {
  try {
    await ensureGalleryFolder();

    const localFileName = `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const localPath = GALLERY_FOLDER + localFileName;

    let savedLocalUri = null;
    try {
      const dl = await FileSystem.downloadAsync(item.imageUrl, localPath);
      if (dl.status === 200) {
        savedLocalUri = dl.uri;
      }
    } catch (dlErr) {
      console.warn('[Gallery] Could not download to local (will use remote URL):', dlErr);
    }

    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = existing ? JSON.parse(existing) : [];
    const mediaAssetId = item.mediaAssetId || null;
    const newItem = {
      id: mediaAssetId ? `media_${mediaAssetId}` : `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      imageUrl: savedLocalUri || item.imageUrl,
      remoteUrl: item.imageUrl,
      isLocal: !!savedLocalUri,
      isDeviceAlbum: Boolean(mediaAssetId),
      mediaAssetId,
      styleLabel: item.styleLabel,
      styleId: item.styleId,
      createdAt: Date.now(),
    };

    const updated = [newItem, ...items].slice(0, GALLERY_MAX_ITEMS);
    const dropped = items.slice(GALLERY_MAX_ITEMS - 1);
    for (const droppedItem of dropped) {
      if (droppedItem.isLocal && droppedItem.imageUrl?.startsWith('file://')) {
        try {
          await FileSystem.deleteAsync(droppedItem.imageUrl, { idempotent: true });
        } catch {}
      }
    }

    await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return newItem;
  } catch (err) {
    console.error('[Gallery] save error:', err);
    return null;
  }
}

async function verifyStoredItems(storedItems) {
  const results = await Promise.all(
    storedItems.map(async (item) => {
      if (item.isLocal && item.imageUrl?.startsWith('file://')) {
        try {
          const info = await FileSystem.getInfoAsync(item.imageUrl);
          return info.exists ? item : null;
        } catch {
          return null;
        }
      }
      return item;
    }),
  );
  return results.filter(Boolean);
}


async function loadGallery({ rescanDevice = true } = {}) {
  try {
    const data = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const previousStored = data ? JSON.parse(data) : [];
    const verifiedStored = await verifyStoredItems(previousStored);
    const hiddenKeys = await getGalleryHiddenKeys();

    const albumItems = await getFunnyfyAlbumAssets({
      first: GALLERY_MAX_ITEMS,
      rescan: rescanDevice,
    });
    const merged = filterHiddenGalleryItems(
      mergeGalleryItems(verifiedStored, albumItems),
      hiddenKeys,
    ).slice(0, GALLERY_MAX_ITEMS);

    if (JSON.stringify(merged) !== JSON.stringify(previousStored)) {
      await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(merged));
    }

    return merged;
  } catch (err) {
    console.error('[Gallery] load error:', err);
    return [];
  }
}

async function removeGalleryItems(items, { deleteFromDevice = false } = {}) {
  if (!items?.length) return { ok: true };

  try {
    const hiddenKeys = items.map(galleryItemHiddenKey).filter(Boolean);
    await addGalleryHiddenKeys(hiddenKeys);

    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const storedItems = existing ? JSON.parse(existing) : [];
    const removeIds = new Set(items.map((item) => item.id));
    const updated = storedItems.filter((item) => !removeIds.has(item.id));

    for (const item of items) {
      const isAppCache = item.isLocal && item.imageUrl?.startsWith('file://') && !item.isDeviceAlbum;
      if (isAppCache && (deleteFromDevice || !item.mediaAssetId)) {
        try {
          await FileSystem.deleteAsync(item.imageUrl, { idempotent: true });
        } catch {}
      }
    }

    await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));

    if (deleteFromDevice) {
      const deviceResult = await deleteDeviceGalleryAssets(items);
      if (!deviceResult.ok) {
        return { ok: false, reason: deviceResult.reason };
      }
      if (deviceResult.notFound > 0 && deviceResult.deleted === 0) {
        return { ok: true, deviceNotFound: true };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error('[Gallery] remove error:', err);
    return { ok: false, reason: 'error' };
  }
}

async function clearGallery(currentItems) {
  try {
    const hiddenKeys = (currentItems || []).map(galleryItemHiddenKey).filter(Boolean);
    if (hiddenKeys.length > 0) {
      await addGalleryHiddenKeys(hiddenKeys);
    }

    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = existing ? JSON.parse(existing) : [];
    for (const item of items) {
      if (item.isLocal && item.imageUrl?.startsWith('file://') && !item.isDeviceAlbum) {
        try {
          await FileSystem.deleteAsync(item.imageUrl, { idempotent: true });
        } catch {}
      }
    }
    await AsyncStorage.removeItem(GALLERY_STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('[Gallery] clear error:', err);
    return false;
  }
}

export { saveToGallery };

export default function GalleryScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const viewerListRef = useRef(null);

  const closeTop = insets.top + 12;
  const selectedCount = selectedIds.size;

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const canRead = await requestGalleryReadPermission();
      setPermissionDenied(!canRead);

      const merged = await loadGallery({ rescanDevice: true });
      setItems(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const performRemove = useCallback(async (itemsToRemove, { deleteFromDevice = false } = {}) => {
    const removeIds = new Set(itemsToRemove.map((item) => item.id));
    setItems((prev) => prev.filter((item) => !removeIds.has(item.id)));
    exitSelectionMode();

    const result = await removeGalleryItems(itemsToRemove, { deleteFromDevice });
    if (!result.ok) {
      await refresh();
      if (result.reason === 'permission') {
        showToast(
          'Permission needed',
          'Allow photo access to delete images from your phone.',
          'warning',
        );
      } else {
        showToast('Remove failed', 'Could not remove the selected photos. Try again.', 'error');
      }
      return;
    }

    await refresh();
    const count = itemsToRemove.length;
    if (deleteFromDevice && result.deviceNotFound) {
      showToast(
        'Removed from app',
        'Could not find the photo on your phone, but it was removed from My Gallery.',
        'warning',
      );
      return;
    }
    showToast(
      deleteFromDevice ? 'Deleted' : 'Removed',
      deleteFromDevice
        ? `${count} photo${count === 1 ? '' : 's'} deleted from your phone`
        : `${count} photo${count === 1 ? '' : 's'} removed from My Gallery`,
      'success',
    );
  }, [exitSelectionMode, refresh, showToast]);

  const promptRemove = useCallback((itemsToRemove) => {
    if (!itemsToRemove.length) return;

    const count = itemsToRemove.length;
    showDialog({
      title: count === 1 ? 'Remove photo?' : `Remove ${count} photos?`,
      message: 'This removes the selected photos from My Gallery.',
      checkboxLabel: 'Also remove from device',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async (alsoFromDevice) => {
        closeDialog();
        await performRemove(itemsToRemove, { deleteFromDevice: !!alsoFromDevice });
      },
    });
  }, [closeDialog, performRemove, showDialog]);

  const handleRemoveSelected = useCallback(() => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    promptRemove(selectedItems);
  }, [items, promptRemove, selectedIds]);

  const handleEnterSelection = useCallback((initialItemId = null) => {
    setSelectionMode(true);
    setSelectedIds(initialItemId ? new Set([initialItemId]) : new Set());
  }, []);

  const handleClearAll = () => {
    showDialog({
      title: 'Clear My Gallery?',
      message: 'This clears the in-app list only. Photos in your phone\'s Funnyfy album are not deleted.',
      confirmLabel: 'Clear all',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        exitSelectionMode();
        await clearGallery(items);
        setItems([]);
        showToast('Gallery cleared', 'In-app list cleared', 'success');
      },
    });
  };

  const handleViewerShare = useCallback(async () => {
    const item = items[viewerIndex];
    if (!item) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showToast('Share unavailable', 'Sharing is not supported on this device', 'warning');
        return;
      }
      const fileName = getSavedImageFileName();
      const shareUri = await resolveShareableImageUri(item, fileName);
      await Sharing.shareAsync(shareUri, {
        mimeType: SAVED_IMAGE_MIME,
        dialogTitle: 'Check out my caricature!',
      });
    } catch (err) {
      console.error('[Gallery] share error:', err);
      showToast('Share failed', 'Could not share this photo. Try again.', 'error');
    }
  }, [items, viewerIndex, showToast]);

  const scrollViewerToIndex = useCallback((index, animated = false) => {
    if (!viewerListRef.current || index < 0 || index >= items.length) return;
    viewerListRef.current.scrollToIndex({ index, animated });
  }, [items.length]);

  useEffect(() => {
    if (!viewerVisible) return undefined;
    const indexToShow = viewerIndex;
    const timer = setTimeout(() => scrollViewerToIndex(indexToShow, false), 0);
    return () => clearTimeout(timer);
  }, [viewerVisible, scrollViewerToIndex]);

  const handleViewerScrollEnd = useCallback((event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    if (nextIndex >= 0 && nextIndex < items.length && nextIndex !== viewerIndex) {
      setViewerIndex(nextIndex);
    }
  }, [items.length, viewerIndex, windowWidth]);

  const activeViewerItem = items[viewerIndex];

  return (
    <View style={styles.galleryRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={[styles.galleryCloseWrap, { top: closeTop, right: 8 }]}>
        <PressScale onPress={onBack} style={styles.pwdCloseCircle} hitSlop={8}>
          <Feather name="x" size={20} color="#FFFFFF" />
        </PressScale>
      </View>

      <View style={[styles.galleryHeaderBand, { paddingTop: insets.top + 8, paddingRight: 52 }]}>
        <View style={styles.galleryHeaderRow}>
          {selectionMode ? (
            <PressScale onPress={exitSelectionMode} style={styles.uploadCircleButton}>
              <Feather name="x" size={18} color="#FFFFFF" />
            </PressScale>
          ) : items.length > 0 ? (
            <View style={styles.galleryHeaderActions}>
              <PressScale onPress={() => handleEnterSelection()} style={styles.uploadCircleButton}>
                <Feather name="check-square" size={18} color="#FFFFFF" />
              </PressScale>
              <PressScale onPress={handleClearAll} style={styles.uploadCircleButton}>
                <Feather name="trash-2" size={18} color="#FFFFFF" />
              </PressScale>
            </View>
          ) : (
            <View style={styles.galleryHeaderSpacer} />
          )}
          <Text style={styles.galleryHeaderTitle}>
            {selectionMode ? `${selectedCount} selected` : 'My Gallery'}
          </Text>
          {selectionMode ? (
            <PressScale
              onPress={handleRemoveSelected}
              style={[styles.uploadCircleButton, selectedCount === 0 && styles.galleryActionDisabled]}
              disabled={selectedCount === 0}
            >
              <Feather name="trash-2" size={18} color={selectedCount === 0 ? '#6B7280' : '#FFFFFF'} />
            </PressScale>
          ) : (
            <View style={styles.galleryHeaderSpacer} />
          )}
        </View>
        {!loading && items.length > 0 ? (
          <Text style={styles.galleryHeaderSubtitle}>
            {selectionMode
              ? (selectedCount < items.length
                ? 'Tap photos to select'
                : 'All photos selected')
              : `${items.length} saved · tap to view · Select to remove`}
          </Text>
        ) : null}
        {selectionMode && items.length > 0 && selectedCount < items.length ? (
          <PressScale onPress={selectAllItems} style={styles.gallerySelectAllButton}>
            <Text style={styles.gallerySelectAllText}>Select all</Text>
          </PressScale>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.galleryLoadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.galleryLoadingText}>Loading your caricatures…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.galleryEmptyContainer}>
          <View style={styles.galleryEmptyIcon}>
            <Feather name="image" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.galleryEmptyTitle}>No caricatures yet</Text>
          <Text style={styles.galleryEmptyText}>
            {permissionDenied
              ? 'Allow photo access in Settings so FunnyFy can show your DCIM/Funnyfy saves.'
              : 'Save a result from the generation screen and it will appear here and in DCIM/Funnyfy on your phone.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + (selectionMode ? 88 : 16),
          }}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          <View style={styles.galleryGrid}>
            {items.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={() => {
                    if (selectionMode) {
                      toggleItemSelection(item.id);
                      return;
                    }
                    setViewerIndex(index);
                    setViewerVisible(true);
                  }}
                  onLongPress={() => handleEnterSelection(item.id)}
                  android_ripple={null}
                >
                  <MediaTile
                    imageSource={{ uri: item.imageUrl }}
                    isSelected={isSelected}
                  />
                  {selectionMode && isSelected ? (
                    <View style={styles.gallerySelectBadge}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {selectionMode && items.length > 0 ? (
        <View style={[styles.gallerySelectionBar, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 }]}>
          <Text style={styles.gallerySelectionBarLabel}>
            {selectedCount === 0 ? 'Select photos to remove' : `${selectedCount} selected`}
          </Text>
          <PressScale
            style={[styles.gallerySelectionRemoveButton, selectedCount === 0 && styles.galleryActionDisabled]}
            onPress={handleRemoveSelected}
            disabled={selectedCount === 0}
          >
            <Text style={[styles.gallerySelectionRemoveText, selectedCount === 0 && styles.gallerySelectionRemoveTextDisabled]}>
              Remove
            </Text>
          </PressScale>
        </View>
      ) : null}

      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.galleryViewerRoot}>
          <View style={[styles.galleryCloseWrap, { top: closeTop, right: 8 }]}>
            <PressScale
              onPress={() => setViewerVisible(false)}
              style={styles.pwdCloseCircle}
              hitSlop={8}
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </PressScale>
          </View>

          <View
            style={styles.galleryViewerPagerWrap}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              if (height > 0 && height !== pagerHeight) {
                setPagerHeight(height);
              }
            }}
          >
            <FlatList
              ref={viewerListRef}
              data={items}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              bounces={items.length > 1}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={viewerIndex}
              style={styles.galleryViewerPager}
              getItemLayout={(_, index) => ({
                length: windowWidth,
                offset: windowWidth * index,
                index,
              })}
              onMomentumScrollEnd={handleViewerScrollEnd}
              onScrollToIndexFailed={({ index }) => {
                viewerListRef.current?.scrollToOffset({
                  offset: index * windowWidth,
                  animated: false,
                });
              }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.galleryViewerPage,
                    {
                      width: windowWidth,
                      height: pagerHeight || windowHeight * 0.72,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.galleryViewerImage}
                    resizeMode="contain"
                    fadeDuration={0}
                  />
                </View>
              )}
            />
          </View>

          {activeViewerItem ? (
            <View style={[styles.galleryViewerFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
              <View style={styles.galleryViewerFooterMeta}>
                <Text style={styles.galleryViewerLabel} numberOfLines={1}>
                  {activeViewerItem.styleLabel || 'Caricature'}
                </Text>
                {items.length > 1 ? (
                  <Text style={styles.galleryViewerCounter}>
                    {viewerIndex + 1} / {items.length}
                  </Text>
                ) : null}
              </View>
              <PressScale style={styles.uploadGenerateButton} onPress={handleViewerShare}>
                <Text style={styles.uploadGenerateButtonText}>Share</Text>
              </PressScale>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
