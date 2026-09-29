import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Soft “Not now” — resurface after this many cold starts. */
export const SOFT_UPDATE_SNOOZE_LAUNCHES = 3;

const SOFT_SNOOZE_KEY = 'funnyfy_update_soft_snooze_v2';
const LEGACY_DISMISS_KEY = 'funnyfy_update_banner_dismissed_for';

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

export function shouldForceUpdate(installedVersion, minRequiredAppVersion) {
  if (!installedVersion || !minRequiredAppVersion) return false;
  return compareSemver(installedVersion, minRequiredAppVersion) < 0;
}

/**
 * Soft prompt visibility for this cold start.
 * After “Not now”, skip the next SOFT_UPDATE_SNOOZE_LAUNCHES launches, then show again.
 */
export async function shouldShowSoftUpdatePrompt(latestAppVersion) {
  if (!latestAppVersion) return false;

  try {
    await AsyncStorage.removeItem(LEGACY_DISMISS_KEY).catch(() => {});

    const raw = await AsyncStorage.getItem(SOFT_SNOOZE_KEY);
    if (!raw) return true;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      await AsyncStorage.removeItem(SOFT_SNOOZE_KEY);
      return true;
    }

    if (data?.version !== latestAppVersion) {
      await AsyncStorage.removeItem(SOFT_SNOOZE_KEY);
      return true;
    }

    const skipped = Number(data.skipped) || 0;
    if (skipped < SOFT_UPDATE_SNOOZE_LAUNCHES) {
      await AsyncStorage.setItem(
        SOFT_SNOOZE_KEY,
        JSON.stringify({ version: latestAppVersion, skipped: skipped + 1 }),
      );
      return false;
    }

    await AsyncStorage.removeItem(SOFT_SNOOZE_KEY);
    return true;
  } catch {
    return true;
  }
}

/** Call when user taps Not now on a soft update. */
export async function snoozeSoftUpdatePrompt(latestAppVersion) {
  if (!latestAppVersion) return;
  try {
    await AsyncStorage.setItem(
      SOFT_SNOOZE_KEY,
      JSON.stringify({ version: latestAppVersion, skipped: 0 }),
    );
  } catch {
    // Non-fatal
  }
}

/** @deprecated Use shouldShowSoftUpdatePrompt / snoozeSoftUpdatePrompt */
export async function wasUpdateBannerDismissed(latestAppVersion) {
  return !(await shouldShowSoftUpdatePrompt(latestAppVersion));
}

/** @deprecated Use snoozeSoftUpdatePrompt */
export async function dismissUpdateBanner(latestAppVersion) {
  return snoozeSoftUpdatePrompt(latestAppVersion);
}
