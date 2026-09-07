import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import { ANDROID_PACKAGE_ID, APP_STORE_LISTING_URL } from '../constants';

const STORAGE_KEY = '@funnyfy/rate_app';
/** Prompt after this many successful generations. */
const FIRST_PROMPT_AFTER = 2;
/** If they tap Not now, wait this many more successes before asking once more. */
const SNOOZE_EVERY = 5;
export const RATE_PROMPT_DELAY_MS = 2200;

export const PLAY_STORE_LISTING_URL =
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`;

const EMPTY = {
  successCount: 0,
  status: 'pending',
  lastPromptAtCount: 0,
  lastJobId: null,
};

async function readState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...EMPTY, ...parsed } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

async function writeState(next) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal — prompt may reappear.
  }
}

export function getPlayStoreListingUrl() {
  return (APP_STORE_LISTING_URL || '').trim() || PLAY_STORE_LISTING_URL;
}

export async function openPlayStoreListing() {
  const httpsUrl = getPlayStoreListingUrl();
  if (Platform.OS === 'android') {
    const marketUrl = `market://details?id=${ANDROID_PACKAGE_ID}`;
    try {
      await Linking.openURL(marketUrl);
      return true;
    } catch {
      // Fall through to HTTPS listing.
    }
  }
  try {
    await Linking.openURL(httpsUrl);
    return true;
  } catch {
    return false;
  }
}

export async function markRateAppRated() {
  const state = await readState();
  await writeState({ ...state, status: 'rated' });
}

export async function markRateAppLater() {
  const state = await readState();
  const alreadySnoozed = state.lastPromptAtCount > 0;
  await writeState({
    ...state,
    status: alreadySnoozed ? 'declined' : 'pending',
    lastPromptAtCount: state.successCount,
  });
}

function shouldPrompt(state) {
  if (state.status !== 'pending') return false;
  if (state.successCount < FIRST_PROMPT_AFTER) return false;
  if (!state.lastPromptAtCount) return true;
  return state.successCount >= state.lastPromptAtCount + SNOOZE_EVERY;
}

export async function shouldPromptRateApp() {
  return shouldPrompt(await readState());
}

/** Count a successful generation once per job. */
export async function noteSuccessfulGeneration(jobId) {
  const state = await readState();
  if (jobId && state.lastJobId === jobId) return;
  await writeState({
    ...state,
    successCount: state.successCount + 1,
    lastJobId: jobId || state.lastJobId,
  });
}

export function presentRateAppDialog({ showDialog, closeDialog, showToast }) {
  showDialog({
    title: 'Rate FunnyFy',
    message: 'If FunnyFy made you smile, a Play Store rating helps others find it.',
    cancelLabel: 'Not now',
    confirmLabel: 'Rate',
    onCancel: () => {
      closeDialog();
      markRateAppLater();
    },
    onConfirm: async () => {
      closeDialog();
      const opened = await openPlayStoreListing();
      if (opened) {
        await markRateAppRated();
      } else if (showToast) {
        showToast('Play Store', 'Could not open the Play Store listing.', 'error');
      }
    },
  });
}
