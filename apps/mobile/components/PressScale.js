import React from 'react';
import { TouchableOpacity } from 'react-native';

// IMPORTANT: previously this used `Pressable` + Reanimated's
// `Animated.createAnimatedComponent(Pressable)` for a spring scale-on-press.
// On Android with Expo SDK 52 / RN 0.76 / Reanimated 3.16 the combination
// caused two regressions:
//   1. `<Pressable><Animated.View>...` collapsed the Pressable's hit area
//      so small icon buttons stopped registering taps.
//   2. `createAnimatedComponent(Pressable)` triggered a JS-thread freeze
//      (Pressable maintains its own internal state which fights the
//      animated wrapper, producing infinite re-renders with no error).
//
// Reverted to a plain TouchableOpacity wrapper. Same public API so all
// callers (StyleScreen, UploadScreen, PhotoTipsSheet, SubscriptionScreen)
// keep working without changes. The spring scale-on-press visual is
// dropped for now — re-add via a different approach (e.g. a manual
// `useState` + LayoutAnimation, or `react-native-gesture-handler`'s
// Pressable which is designed for Reanimated) once we have time to test
// it thoroughly on Android.

/**
 * Press wrapper. Drop-in for TouchableOpacity that preserves the
 * `scaleTo` prop so callers don't need to change. Animation is a TODO.
 */
export default function PressScale({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  // scaleTo is accepted but currently unused — kept for API compatibility.
  // eslint-disable-next-line no-unused-vars
  scaleTo = 0.96,
  hitSlop,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={style}
      activeOpacity={0.85}
    >
      {children}
    </TouchableOpacity>
  );
}
