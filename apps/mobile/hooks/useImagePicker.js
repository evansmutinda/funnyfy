import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ExpoImagePicker from 'expo-image-picker';
import { useNotifications } from '../components/NotificationProvider';

/**
 * REVERT — forced OS crop on every upload (pre-2026-08-05):
 *
 *   allowsEditing: true
 *
 * Android opened a centered ~1:1 crop box (~75% of landscape shots), which
 * users had to expand every time. Product choice: use the full photo; no
 * in-app / optional crop step.
 *
 * To restore OS crop: set ALLOWS_EDITING = true below.
 */
const ALLOWS_EDITING = false;

async function uriToDataUrl(uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { uri, dataUrl: `data:image/jpeg;base64,${base64}` };
}

async function pickExpo(useCamera) {
  const pickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: ALLOWS_EDITING,
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

/**
 * Gallery / camera pick via expo-image-picker.
 * Default: full photo (ALLOWS_EDITING false). See REVERT note above.
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
      const result = await pickExpo(useCamera);
      if (result.canceled || !result.assets?.[0]) return null;
      return uriToDataUrl(result.assets[0].uri);
    } catch (err) {
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
