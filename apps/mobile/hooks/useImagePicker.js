import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ExpoImagePicker from 'expo-image-picker';
import { useNotifications } from '../components/NotificationProvider';

async function uriToDataUrl(uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { uri, dataUrl: `data:image/jpeg;base64,${base64}` };
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

/**
 * Gallery / camera pick with OS crop via expo-image-picker.
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
