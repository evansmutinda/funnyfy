import { useRef } from 'react';
import {
  initialWindowMetrics,
  useSafeAreaInsets as useLiveSafeAreaInsets,
} from 'react-native-safe-area-context';

/**
 * First paint from a newly mounted screen can report inset 0, then snap.
 * Keep the last real inset so headers/pills do not jump on navigation.
 *
 * Bottom is special: do not seed from initialWindowMetrics. On Android with an
 * opaque system nav bar, live.bottom is often 0 while the metrics fallback is
 * ~48 — seeding that value double-pads footers above the nav bar.
 */
export default function useStableSafeAreaInsets() {
  const live = useLiveSafeAreaInsets();
  const fallback = initialWindowMetrics?.insets;
  const stable = useRef({
    top: live.top || fallback?.top || 0,
    bottom: live.bottom || 0,
    left: live.left || fallback?.left || 0,
    right: live.right || fallback?.right || 0,
  });
  const hasSeenBottom = useRef(live.bottom > 0);

  if (live.top > 0) stable.current.top = live.top;
  if (live.bottom > 0) {
    stable.current.bottom = live.bottom;
    hasSeenBottom.current = true;
  }
  if (live.left > 0) stable.current.left = live.left;
  if (live.right > 0) stable.current.right = live.right;

  return {
    ...live,
    top: live.top > 0 ? live.top : stable.current.top,
    bottom: live.bottom > 0
      ? live.bottom
      : hasSeenBottom.current
        ? stable.current.bottom
        : 0,
    left: live.left > 0 ? live.left : stable.current.left,
    right: live.right > 0 ? live.right : stable.current.right,
  };
}
