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
import { BOTTOM_INSET_MIN, getSavedImageFileName } from '../constants';
import { getFunnyfyAlbumAssets, mergeGalleryItems, requestGalleryReadPermission, resolveShareableImageUri } from '../utils/funnyfyAlbum';
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
    const newItem = {
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      imageUrl: savedLocalUri || item.imageUrl,
      remoteUrl: item.imageUrl,
      isLocal: !!savedLocalUri,
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

    const albumItems = await getFunnyfyAlbumAssets({
      first: GALLERY_MAX_ITEMS,
      rescan: rescanDevice,
    });
    const merged = mergeGalleryItems(verifiedStored, albumItems).slice(0, GALLERY_MAX_ITEMS);

    if (JSON.stringify(merged) !== JSON.stringify(previousStored)) {
      await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(merged));
    }

    return merged;
  } catch (err) {
    console.error('[Gallery] load error:', err);
    return [];
  }
}

async function deleteFromGallery(id) {
  try {
    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = existing ? JSON.parse(existing) : [];
    const target = items.find((item) => item.id === id);
    const updated = items.filter((item) => item.id !== id);

    if (target?.isLocal && target?.imageUrl?.startsWith('file://') && !target?.isDeviceAlbum) {
      try {
        await FileSystem.deleteAsync(target.imageUrl, { idempotent: true });
      } catch {}
    }

    await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('[Gallery] delete error:', err);
    return false;
  }
}

async function clearGallery() {
  try {
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
  const viewerListRef = useRef(null);

  const closeTop = insets.top + 12;

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

  const handleDelete = (item) => {
    showDialog({
      title: 'Remove from My Gallery?',
      message: item.isDeviceAlbum
        ? 'This removes it from the in-app list only. The photo stays in your phone\'s Funnyfy album unless you delete it in the Gallery app.'
        : 'This removes it from your in-app gallery. Photos already saved to your phone are not affected.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        await deleteFromGallery(item.id);
        refresh();
        showToast('Removed', 'Caricature removed from My Gallery', 'success');
      },
    });
  };

  const handleClearAll = () => {
    showDialog({
      title: 'Clear My Gallery?',
      message: 'This clears the in-app list only. Photos in your phone\'s Funnyfy album are not deleted.',
      confirmLabel: 'Clear all',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        await clearGallery();
        refresh();
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
        mimeType: 'image/jpeg',
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
          {items.length > 0 ? (
            <PressScale onPress={handleClearAll} style={styles.uploadCircleButton}>
              <Feather name="trash-2" size={18} color="#FFFFFF" />
            </PressScale>
          ) : (
            <View style={styles.galleryHeaderSpacer} />
          )}
          <Text style={styles.galleryHeaderTitle}>My Gallery</Text>
          <View style={styles.galleryHeaderSpacer} />
        </View>
        {!loading && items.length > 0 ? (
          <Text style={styles.galleryHeaderSubtitle}>
            {items.length} saved · tap to view · long-press to remove
          </Text>
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
            paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 16,
          }}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          <View style={styles.galleryGrid}>
            {items.map((item, index) => (
              <Pressable
                key={item.id}
                style={styles.galleryItem}
                onPress={() => {
                  setViewerIndex(index);
                  setViewerVisible(true);
                }}
                onLongPress={() => handleDelete(item)}
                android_ripple={null}
              >
                <MediaTile imageSource={{ uri: item.imageUrl }} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

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
