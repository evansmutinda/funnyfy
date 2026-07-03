import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { DARK_BG } from '../constants/theme';

/** Keep system nav bar dark — Modal on Android resets it to white without this. */
export async function configureAndroidNavigationBar() {
  if (Platform.OS !== 'android') return;
  try {
    await NavigationBar.setBackgroundColorAsync(DARK_BG);
    await NavigationBar.setButtonStyleAsync('light');
    await NavigationBar.setVisibilityAsync('visible');
  } catch (err) {
    console.warn('[NavBar] configure failed:', err?.message || err);
  }
}
