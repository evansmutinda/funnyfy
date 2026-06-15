import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useNotifications } from '../components/NotificationProvider';
import { BOTTOM_INSET_MIN } from '../constants';
import styles from '../styles';

export default function PhotoChooserScreen({ onSelectPhoto, onClose }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useNotifications();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          showToast('Permission needed', 'Gallery access is required to browse photos', 'warning');
          return;
        }

        const allAssets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 100,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        setPhotos(allAssets.assets || []);
      } catch (err) {
        console.error('Failed to load photos:', err);
        showToast('Error', 'Failed to load photos from gallery', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const handleSelectPhoto = async (asset) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      onSelectPhoto({
        uri: asset.uri,
        dataUrl: dataUrl,
      });
    } catch (err) {
      console.error('Failed to read photo:', err);
      showToast('Error', 'Failed to load photo', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.photoChooserContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        <View style={styles.photoChooserHeader}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>Choose Photo</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.photoChooserLoadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.photoChooserEmptyContainer}>
            <Text style={styles.photoChooserEmptyText}>No photos found</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.photoGrid}>
              {photos.map((asset, index) => (
                <TouchableOpacity
                  key={asset.id}
                  style={styles.photoGridItem}
                  onPress={() => handleSelectPhoto(asset)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: asset.uri }}
                    style={styles.photoGridImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
