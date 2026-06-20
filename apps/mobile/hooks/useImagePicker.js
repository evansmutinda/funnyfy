import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as ExpoImagePicker from 'expo-image-picker';
import { useNotifications } from '../components/NotificationProvider';

/**
 * react-native-image-crop-picker is compiled into dev/production builds only.
 * Expo Go has no RNCImageCropPicker native module — fall back to expo-image-picker.
 */
const IS_EXPO_GO = Constants.appOwnership === 'expo';

let ImageCropPicker = null;
if (!IS_EXPO_GO) {
  ImageCropPicker = require('react-native-image-crop-picker').default;
}

const PICKER_BASE = {
  mediaType: 'photo',
  compressImageQuality: 0.9,
  compressImageMaxWidth: 2048,
  compressImageMaxHeight: 2048,
  includeBase64: true,
};

const CROP_UI = {
  ...PICKER_BASE,
  freeStyleCropEnabled: true,
  avoidEmptySpaceAroundImage: false,
  cropperToolbarTitle: 'Crop photo',
  cropperToolbarColor: '#0B0F19',
  cropperToolbarWidgetColor: '#FFFFFF',
  cropperActiveWidgetColor: '#FFFFFF',
  cropperStatusBarLight: false,
  cropperNavigationBarLight: false,
  cropperTintColor: '#FFFFFF',
  showCropGuidelines: true,
  forceJpg: true,
};

function isCancelled(err) {
  return err?.code === 'E_PICKER_CANCELLED';
}

async function uriToDataUrl(uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { uri, dataUrl: `data:image/jpeg;base64,${base64}` };
}

async function cropPickerToResult(image) {
  const uri = image.path.startsWith('file://') ? image.path : `file://${image.path}`;
  const mime = image.mime || 'image/jpeg';
  if (image.data) {
    return { uri, dataUrl: `data:${mime};base64,${image.data}` };
  }
  return uriToDataUrl(uri);
}

async function pickRawNative(useCamera) {
  if (useCamera) {
    return ImageCropPicker.openCamera({ ...PICKER_BASE, cropping: false });
  }
  return ImageCropPicker.openPicker({ ...PICKER_BASE, cropping: false });
}

async function pickThenCropNative(useCamera) {
  const picked = await pickRawNative(useCamera);
  return ImageCropPicker.openCropper({
    path: picked.path,
    width: picked.width,
    height: picked.height,
    ...CROP_UI,
  });
}

async function pickExpo(useCamera) {
  if (useCamera) {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required to take photos.');
    }
    return ExpoImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });
  }

  if (Platform.OS !== 'android') {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Photo library permission is required to select images.');
    }
  }

  return ExpoImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.9,
  });
}

async function pickImageImpl(useCamera) {
  if (IS_EXPO_GO) {
    const result = await pickExpo(useCamera);
    if (result.canceled || !result.assets?.[0]) return null;
    return uriToDataUrl(result.assets[0].uri);
  }

  const image = await pickThenCropNative(useCamera);
  return cropPickerToResult(image);
}

/**
 * Gallery / camera pick with crop.
 *
 * Dev/production build: react-native-image-crop-picker (full-image crop default)
 * Expo Go: expo-image-picker fallback (OS crop)
 */
export default function useImagePicker() {
  const { showToast } = useNotifications();
  const [picking, setPicking] = useState(false);
  const [pickingSource, setPickingSource] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      showToast('Error', error, 'error');
      setError('');
    }
  }, [error]);

  const pickImage = async (useCamera = false) => {
    if (picking) return null;

    const sourceKey = useCamera ? 'camera' : 'gallery';

    setPicking(true);
    setPickingSource(sourceKey);
    setError('');

    try {
      return await pickImageImpl(useCamera);
    } catch (err) {
      if (isCancelled(err)) return null;
      console.error('Image pick error:', err);
      const message = err?.message?.includes('permission')
        ? err.message
        : 'Failed to pick image.';
      setError(message);
      return null;
    } finally {
      setPicking(false);
      setPickingSource(null);
    }
  };

  return { pickImage, picking, pickingSource };
}
