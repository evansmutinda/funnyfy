import { useRef } from 'react';
import {
  initialWindowMetrics,
  useSafeAreaInsets as useLiveSafeAreaInsets,
} from 'react-native-safe-area-context';

/**
 * First paint from a newly mounted screen can report inset 0, then snap.
 * Keep the last real inset so headers/pills do not jump on navigation.
 */
export default function useStableSafeAreaInsets() {
  const live = useLiveSafeAreaInsets();
  const fallback = initialWindowMetrics?.insets;
  const stable = useRef({
    top: live.top || fallback?.top || 0,
    bottom: live.bottom || fallback?.bottom || 0,
    left: live.left || fallback?.left || 0,
    right: live.right || fallback?.right || 0,
  });

  if (live.top > 0) stable.current.top = live.top;
  if (live.bottom > 0) stable.current.bottom = live.bottom;
  if (live.left > 0) stable.current.left = live.left;
  if (live.right > 0) stable.current.right = live.right;

  return {
    ...live,
    top: live.top > 0 ? live.top : stable.current.top,
    bottom: live.bottom > 0 ? live.bottom : stable.current.bottom,
    left: live.left > 0 ? live.left : stable.current.left,
    right: live.right > 0 ? live.right : stable.current.right,
  };
}
