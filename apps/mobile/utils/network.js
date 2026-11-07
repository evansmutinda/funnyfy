/** Shared offline copy (toasts, banner, disabled CTAs). */
export const NO_INTERNET_TITLE = 'No Internet';
export const NO_INTERNET_MESSAGE = 'Check your internet connection and try again';

/** True when the device has a usable connection (NetInfo state). */
export function isNetworkOnline(state) {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}
