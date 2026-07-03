import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export const TILE_HOLD_MS = 1200;
export const TILE_FADE_MS = 1500;

const HOLD_MS = TILE_HOLD_MS;
const FADE_MS = TILE_FADE_MS;

/** Enough to demo the effect without endless motion on tiles. */
export const DEFAULT_COMPARISON_CYCLES = 3;

/**
 * Crossfade between original (before) and styled (after).
 * Resting state is the styled result (after layer opacity = 1).
 * When paused, keeps the after frame visible — no component swap (avoids flicker).
 */
export default function ComparisonFade({
  beforeSource,
  afterSource,
  style,
  imageStyle,
  paused = false,
  holdMs = HOLD_MS,
  fadeMs = FADE_MS,
  maxCycles,
}) {
  const opacity = useSharedValue(1);
  // Lazy-load before image only while animating — saves Android decoders on idle tiles.
  const [showBefore, setShowBefore] = useState(!paused);

  useEffect(() => {
    cancelAnimation(opacity);

    if (paused) {
      opacity.value = 1;
      return undefined;
    }

    setShowBefore(true);
    opacity.value = 1;
    const ease = Easing.inOut(Easing.cubic);

    const cycle = withSequence(
      withDelay(holdMs, withTiming(0, { duration: fadeMs, easing: ease })),
      withDelay(holdMs, withTiming(1, { duration: fadeMs, easing: ease })),
    );

    const repeats = maxCycles == null || maxCycles < 0 ? -1 : maxCycles;
    opacity.value = withRepeat(cycle, repeats, false);
    return undefined;
  }, [paused, holdMs, fadeMs, maxCycles, beforeSource, afterSource, opacity]);

  const animatedAfterStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.root, style]}>
      {showBefore ? (
        <Image
          source={beforeSource}
          style={[StyleSheet.absoluteFill, styles.image, imageStyle]}
          resizeMode="cover"
        />
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, animatedAfterStyle]}>
        <Image
          source={afterSource}
          style={[StyleSheet.absoluteFill, styles.image, imageStyle]}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
