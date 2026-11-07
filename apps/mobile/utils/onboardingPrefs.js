import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_KEY = '@funnyfy/onboarding_seen';

export async function hasSeenOnboarding() {
  // Expo reload keeps AsyncStorage — always re-show while developing.
  if (__DEV__) return false;

  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen() {
  if (__DEV__) return;

  try {
    await AsyncStorage.setItem(SEEN_KEY, '1');
  } catch (err) {
    console.warn('[onboarding] Failed to persist seen flag:', err?.message || err);
  }
}
