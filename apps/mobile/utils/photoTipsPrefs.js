import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_KEY = '@funnyfy/photo_tips_dismissed';

async function readDismissedMap() {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function isPhotoTipsDismissed(styleId) {
  if (!styleId) return false;
  const map = await readDismissedMap();
  return map[styleId] === true;
}

export async function setPhotoTipsDismissed(styleId, dismissed = true) {
  if (!styleId) return;
  const map = await readDismissedMap();
  if (dismissed) {
    map[styleId] = true;
  } else {
    delete map[styleId];
  }
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}
