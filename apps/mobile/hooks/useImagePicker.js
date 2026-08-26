import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as ExpoImagePicker from 'expo-image-picker';
import { useNotifications } from '../components/NotificationProvider';

/**
 * Native builds: react-native-image-crop-picker → uCrop.
 * Omit width/height so uCrop uses SOURCE_IMAGE_ASPECT_RATIO (full photo selected).
 * freeStyleCropEnabled lets the user shrink the crop when needed.
 *
 * Expo Go: no native uCrop — pick full photo only (OS crop cannot default to full).
 */
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

let ImageCropPicker = null;
let hasNativeCropPicker = false;
if (!IS_EXPO_GO) {
  try {
    ImageCropPicker = require('react-native-image-crop-picker').default;
    hasNativeCropPicker = !!ImageCropPicker?.openCropper;
  } catch (err) {
    console.warn('[useImagePicker] native crop picker unavailable:', err?.message || err);
    ImageCropPicker = null;
    hasNativeCropPicker = false;
  }
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

/**
 * Pick then open uCrop. Do not pass width/height — that would call
 * withAspectRatio(w,h) and (without our patch) force-resize/stretch.
 * With no aspect set, uCrop uses SOURCE_IMAGE_ASPECT_RATIO = full photo.
 */
async function pickThenCropNative(useCamera) {
  const picked = await pickRawNative(useCamera);
  return ImageCropPicker.openCropper({
    path: picked.path,
    ...CROP_UI,
  });
}

async function pickExpo(useCamera) {
  const pickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
  };

  if (useCamera) {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required to take photos.');
    }
    return ExpoImagePicker.launchCameraAsync(pickerOptions);
  }

  if (Platform.OS !== 'android') {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Photo library permission is required to select images.');
    }
  }

  return ExpoImagePicker.launchImageLibraryAsync(pickerOptions);
}

async function pickImageImpl(useCamera) {
  if (IS_EXPO_GO || !hasNativeCropPicker) {
    const result = await pickExpo(useCamera);
    if (result.canceled || !result.assets?.[0]) return null;
    return uriToDataUrl(result.assets[0].uri);
  }

  const image = await pickThenCropNative(useCamera);
  return cropPickerToResult(image);
}

/**
 * Gallery / camera pick with integrated uCrop (native builds).
 * Toolbar title: "Crop photo". Selector starts on the full image.
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
