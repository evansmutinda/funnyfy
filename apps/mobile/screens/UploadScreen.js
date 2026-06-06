import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, View, TouchableOpacity, Image, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNotifications } from '../components/NotificationProvider';
import styles from '../styles';

const BOTTOM_INSET_MIN = Platform.OS === 'android' ? 48 : 34;

export default function UploadScreen({ style, onStart, onBackToStyle, canGenerateMore, subscriptionInfo, onSubscribe }) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [imageUri, setImageUri] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [picking, setPicking] = useState(false);
  const [pickingSource, setPickingSource] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      showToast('Error', error, 'error');
      setError('');
    }
  }, [error]);

  // Calculate quota percentage for progress bar
  const getQuotaInfo = () => {
    if (!subscriptionInfo || !subscriptionInfo.usage) {
      return { current: 0, limit: 3, percentage: 0, isLow: false, isExceeded: false };
    }
    const { current, limit } = subscriptionInfo.usage;
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const isLow = percentage >= 80 && percentage < 100;
    const isExceeded = percentage >= 100;
    return { current, limit, percentage, isLow, isExceeded };
  };

  const quotaInfo = getQuotaInfo();

  const pickImage = async (useCamera = false) => {
    if (picking) return;

    setPicking(true);
    setPickingSource(useCamera ? 'camera' : 'gallery');
    setError('');

    try {
      let result;

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.9,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Photo library permission is required to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.9,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);

        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          setImageDataUrl(dataUrl);
        } catch (fsErr) {
          console.error('Failed to read image file:', fsErr);
          setError('Failed to read image file.');
        }
      }
    } catch (err) {
      console.error('Image pick error:', err);
      setError('Failed to pick image.');
    } finally {
      setPicking(false);
      setPickingSource(null);
    }
  };

  const quotaOk = canGenerateMore !== false;
  const canGenerate = !!imageUri && !picking && quotaOk;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.uploadContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBackToStyle} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          {subscriptionInfo && (
            <View style={styles.headerPill}>
              <View style={styles.headerPillProgress}>
                <View style={[styles.headerPillProgressFill, { width: `${Math.min(quotaInfo.percentage, 100)}%` }]} />
              </View>
              <Text style={styles.headerPillText}>
                {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                  ? `Trial · ${quotaInfo.current}/${quotaInfo.limit}`
                  : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} · ${quotaInfo.current}/${quotaInfo.limit}`}
              </Text>
            </View>
          )}
          <View style={{ width: 36 }} />
        </View>

        {quotaInfo.isExceeded && (
          <TouchableOpacity onPress={onSubscribe} style={styles.quotaExceededBanner}>
            <Text style={styles.quotaExceededBannerText}>Quota reached — tap to upgrade</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.uploadImageContainer}
          onPress={() => !imageUri && !picking && pickImage(false)}
          activeOpacity={imageUri ? 1 : 0.8}
          disabled={picking}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoPlaceholderIcon}>
                <Text style={styles.photoPlaceholderIconText}>+</Text>
              </View>
              <Text style={styles.photoPlaceholderTitle}>Add a photo</Text>
              <Text style={styles.photoPlaceholderHint}>Tap to choose</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.uploadButtonsContainer}>
          <View style={styles.uploadSourceRow}>
            <TouchableOpacity
              style={[styles.slimButton, picking && styles.buttonDisabled]}
              onPress={() => pickImage(true)}
              disabled={picking}
            >
              <Text style={styles.slimButtonText}>
                {picking && pickingSource === 'camera' ? 'Opening…' : 'Camera'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.slimButton, picking && styles.buttonDisabled]}
              onPress={() => pickImage(false)}
              disabled={picking}
            >
              <Text style={styles.slimButtonText}>
                {picking && pickingSource === 'gallery' ? 'Opening…' : 'Gallery'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!canGenerate || picking) && styles.buttonDisabled]}
            onPress={() => {
              if (!quotaOk && onSubscribe) {
                showDialog({
                  title: 'Quota Exceeded',
                  message: `You've used all ${quotaInfo.limit} caricatures this month. Upgrade your plan to continue generating amazing caricatures!`,
                  cancelLabel: 'Cancel',
                  confirmLabel: 'Upgrade',
                  onCancel: closeDialog,
                  onConfirm: () => {
                    closeDialog();
                    onSubscribe();
                  },
                });
              } else {
                onStart({ imageUri, imageDataUrl });
              }
            }}
            disabled={!canGenerate || picking}
          >
            <Text style={styles.primaryButtonText}>
              {quotaOk ? 'Generate caricature' : 'Upgrade to continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
