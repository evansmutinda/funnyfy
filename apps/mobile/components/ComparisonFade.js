import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const HOLD_MS = 1800;
const FADE_MS = 700;

/**
 * Crossfades between a `beforeSource` and `afterSource` indefinitely.
 * Used on UploadScreen to preview what the selected style does.
 * If `paused` is true, holds on `beforeSource`.
 */
export default function ComparisonFade({
  beforeSource,
  afterSource,
  style,
  imageStyle,
  paused = false,
  holdMs = HOLD_MS,
  fadeMs = FADE_MS,
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      opacity.value = withTiming(0, { duration: fadeMs });
      return;
    }
    const ease = Easing.inOut(Easing.cubic);
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: holdMs, easing: ease }),
        withTiming(1, { duration: fadeMs, easing: ease }),
        withTiming(1, { duration: holdMs, easing: ease }),
        withTiming(0, { duration: fadeMs, easing: ease }),
      ),
      -1,
    );
  }, [paused, holdMs, fadeMs]);

  const animatedAfterStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.root, style]}>
      <Image source={beforeSource} style={[StyleSheet.absoluteFill, imageStyle]} />
      <Animated.Image
        source={afterSource}
        style={[StyleSheet.absoluteFill, imageStyle, animatedAfterStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
