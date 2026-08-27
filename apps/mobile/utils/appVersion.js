import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISS_KEY = 'funnyfy_update_banner_dismissed_for';

/** Compare dotted semver. Returns -1 / 0 / 1. */
export function compareSemver(a, b) {
  const parse = (v) =>
    String(v || '0')
      .trim()
      .replace(/^v/i, '')
      .split(/[.+-]/)
      .map((part) => {
        const n = parseInt(part, 10);
        return Number.isFinite(n) ? n : 0;
      });

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d < 0) return -1;
    if (d > 0) return 1;
  }
  return 0;
}

export function getInstalledAppVersion() {
  return (
    Constants.expoConfig?.version ||
    Constants.nativeApplicationVersion ||
    Constants.manifest2?.extra?.expoClient?.version ||
    Constants.manifest?.version ||
    null
  );
}

export function shouldPromptUpdate(installedVersion, latestAppVersion) {
  if (!installedVersion || !latestAppVersion) return false;
  return compareSemver(installedVersion, latestAppVersion) < 0;
}

export async function wasUpdateBannerDismissed(latestAppVersion) {
  if (!latestAppVersion) return true;
  try {
    const dismissedFor = await AsyncStorage.getItem(DISMISS_KEY);
    return dismissedFor === latestAppVersion;
  } catch {
    return false;
  }
}

export async function dismissUpdateBanner(latestAppVersion) {
  if (!latestAppVersion) return;
  try {
    await AsyncStorage.setItem(DISMISS_KEY, latestAppVersion);
  } catch {
    // Non-fatal — banner may reappear next launch.
  }
}
