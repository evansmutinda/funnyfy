import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { DARK_BG } from '../constants/theme';

/** Keep system nav bar dark — Modal on Android resets it to white without this. */
export async function configureAndroidNavigationBar() {
  if (Platform.OS !== 'android') return;
  try {
    if (typeof NavigationBar.setPositionAsync === 'function') {
      await NavigationBar.setPositionAsync('relative');
    }
    // Solid dark only — transparent + Android contrast enforcement → white/grey strip.
    await NavigationBar.setBackgroundColorAsync(DARK_BG);
    await NavigationBar.setButtonStyleAsync('light');
    await NavigationBar.setBehaviorAsync('inset-swipe');
    await NavigationBar.setVisibilityAsync('visible');
  } catch (err) {
    console.warn('[NavBar] configure failed:', err?.message || err);
  }
}

/**
 * Hide the system nav bar (immersive). Swipe up from the bottom edge
 * temporarily reveals it (`overlay-swipe`).
 *
 * Keep a solid dark background while hidden — transparent lets Android
 * paint a white contrast scrim in the nav region.
 *
 * Note: Expo Go often ignores visibility changes. A release / dev-client
 * APK with expo-navigation-bar linked is where hide reliably works.
 */
export async function hideAndroidNavigationBar() {
  if (Platform.OS !== 'android') return;
  try {
    if (typeof NavigationBar.setPositionAsync === 'function') {
      await NavigationBar.setPositionAsync('absolute');
    }
    await NavigationBar.setBackgroundColorAsync(DARK_BG);
    await NavigationBar.setButtonStyleAsync('light');
    await NavigationBar.setBehaviorAsync('overlay-swipe');
    await NavigationBar.setVisibilityAsync('hidden');
  } catch (err) {
    console.warn('[NavBar] hide failed:', err?.message || err);
  }
}
