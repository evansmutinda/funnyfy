import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useNotifications } from '../components/NotificationProvider';
import MediaTile from '../components/MediaTile';
import { BOTTOM_INSET_MIN, FUNNYFY_FOLDER_NAME, getSavedImageFileName } from '../constants';
import styles from '../styles';

const GALLERY_STORAGE_KEY = '@funnyfy_gallery';
const GALLERY_MAX_ITEMS = 50;
const GALLERY_FOLDER = FileSystem.documentDirectory + 'gallery/';

async function ensureGalleryFolder() {
  try {
    const info = await FileSystem.getInfoAsync(GALLERY_FOLDER);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(GALLERY_FOLDER, { intermediates: true });
      console.log('[Gallery] Created gallery folder');
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
        console.log('[Gallery] Downloaded image to:', savedLocalUri);
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
    for (const dropped_item of dropped) {
      if (dropped_item.isLocal && dropped_item.imageUrl?.startsWith('file://')) {
        try {
          await FileSystem.deleteAsync(dropped_item.imageUrl, { idempotent: true });
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

async function scanFunnyfyAlbumAssets() {
  try {
    let permResult = await MediaLibrary.getPermissionsAsync();
    if (permResult.status !== 'granted') {
      // Read access for gallery scan (writeOnly=true is only for saving photos)
      permResult = await MediaLibrary.requestPermissionsAsync(false);
    }
    if (permResult.status !== 'granted') {
      return [];
    }

    const album = await MediaLibrary.getAlbumAsync(FUNNYFY_FOLDER_NAME);
    if (!album) {
      console.log('[Gallery] No', FUNNYFY_FOLDER_NAME, 'album found');
      return [];
    }

    const result = await MediaLibrary.getAssetsAsync({
      album: album.id,
      mediaType: MediaLibrary.MediaType.photo,
      first: GALLERY_MAX_ITEMS,
      sortBy: MediaLibrary.SortBy.creationTime,
    });

    console.log('[Gallery] album scan found', result.assets.length, 'asset(s) in', FUNNYFY_FOLDER_NAME);

    return result.assets.map((asset) => ({
      id: `media_${asset.id}`,
      imageUrl: asset.uri,
      remoteUrl: null,
      isLocal: true,
      styleLabel: 'FunnyFy',
      styleId: null,
      createdAt: asset.creationTime,
    }));
  } catch (err) {
    console.warn('[Gallery] scanFunnyfyAlbumAssets error:', err.message || err);
    return [];
  }
}

async function rebuildGalleryFromMediaLibrary() {
  console.log('[Gallery] Starting rebuild from MediaLibrary...');
  const rebuilt = await scanFunnyfyAlbumAssets();
  if (rebuilt.length > 0) {
    await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(rebuilt));
    console.log('[Gallery] Rebuilt and saved', rebuilt.length, 'items');
  }
  return rebuilt;
}

async function loadGallery() {
  try {
    const data = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const storedItems = data ? JSON.parse(data) : [];

    if (storedItems.length === 0) {
      const rebuilt = await rebuildGalleryFromMediaLibrary();
      return rebuilt;
    }

    const verified = [];
    for (const item of storedItems) {
      if (item.isLocal && item.imageUrl?.startsWith('file://')) {
        try {
          const info = await FileSystem.getInfoAsync(item.imageUrl);
          if (info.exists) {
            verified.push(item);
          }
        } catch {
          // File missing, skip it
        }
      } else {
        verified.push(item);
      }
    }

    if (verified.length !== storedItems.length) {
      await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(verified));
    }

    return verified;
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

    if (target?.isLocal && target?.imageUrl?.startsWith('file://')) {
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
      if (item.isLocal && item.imageUrl?.startsWith('file://')) {
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
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const refresh = async () => {
    setLoading(true);
    const data = await loadGallery();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (item) => {
    showDialog({
      title: 'Delete caricature?',
      message: 'This only removes it from your in-app gallery. Photos already saved to your phone are not affected.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        await deleteFromGallery(item.id);
        refresh();
        showToast('Removed', 'Caricature removed from gallery', 'success');
      },
    });
  };

  const handleClearAll = () => {
    showDialog({
      title: 'Clear all caricatures?',
      message: 'This removes all items from your in-app gallery. Photos saved to your phone are not affected.',
      confirmLabel: 'Clear All',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        await clearGallery();
        refresh();
        showToast('Gallery cleared', 'All caricatures removed', 'success');
      },
    });
  };

  const handleViewerShare = useCallback(async () => {
    const item = items[viewerIndex];
    if (!item) return;
    try {
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.cacheDirectory + fileName;
      const dl = await FileSystem.downloadAsync(item.imageUrl, localPath);
      await Sharing.shareAsync(dl.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Check out my caricature!',
      });
    } catch (err) {
      console.error('[Gallery] share error:', err);
    }
  }, [items, viewerIndex]);

  const renderViewerHeader = useCallback(() => {
    return (
      <View style={[styles.viewerHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.viewerCloseButton}
          onPress={() => setViewerVisible(false)}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Text style={styles.viewerCloseIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }, [insets.top]);

  const renderViewerFooter = useCallback(() => {
    const item = items[viewerIndex];
    if (!item) return null;
    return (
      <View style={[styles.viewerFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Text style={styles.viewerFooterLabel} numberOfLines={1}>
          {item.styleLabel || 'Caricature'}
        </Text>
        <View style={styles.viewerActionsRow}>
          <TouchableOpacity style={styles.viewerActionButton} onPress={handleViewerShare}>
            <Text style={styles.viewerActionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [items, viewerIndex, handleViewerShare, insets.bottom]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={{ height: insets.top, backgroundColor: '#F3F4F6' }} />
      <View style={styles.galleryContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>My Gallery</Text>
          <View style={styles.galleryHeaderActions}>
            {items.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.iconButton}>
                <Text style={styles.galleryClearIcon}>🗑</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <Text style={styles.iconButtonIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.galleryLoadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.galleryEmptyContainer}>
            <View style={styles.galleryEmptyIcon}>
              <Text style={styles.galleryEmptyIconText}>✦</Text>
            </View>
            <Text style={styles.galleryEmptyTitle}>No caricatures yet</Text>
            <Text style={styles.galleryEmptyText}>
              Your generated caricatures will show up here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 16 }}
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
                  <MediaTile
                    imageSource={{ uri: item.imageUrl }}
                    label={item.styleLabel || 'Caricature'}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.galleryHint}>Long-press an item to delete</Text>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="none"
        onRequestClose={() => setViewerVisible(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {renderViewerHeader()}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {items[viewerIndex] && (
              <Image
                source={{ uri: items[viewerIndex].imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                fadeDuration={0}
              />
            )}
          </View>
          {renderViewerFooter()}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
