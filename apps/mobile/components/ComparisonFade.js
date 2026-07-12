import React, { useEffect, useMemo, useState } from 'react';
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
 * Crossfade between original (before) and styled after(s).
 * Single after: before ↔ after loop (rests on after).
 * Multiple afters: before → after1 → before → after2 → before → after3 → …
 * When paused, keeps the current after frame visible.
 */
export default function ComparisonFade({
  beforeSource,
  afterSource,
  afterSources,
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

  const afterList = useMemo(() => {
    if (Array.isArray(afterSources) && afterSources.length > 0) {
      return afterSources.filter(Boolean);
    }
    return afterSource ? [afterSource] : [];
  }, [afterSources, afterSource]);

  const isMulti = afterList.length > 1;
  const [afterIndex, setAfterIndex] = useState(0);
  const activeAfter = afterList[afterIndex % Math.max(afterList.length, 1)] || afterSource;

  useEffect(() => {
    setAfterIndex(0);
  }, [afterList]);

  // Single after — original before ↔ after loop
  useEffect(() => {
    if (isMulti) return undefined;

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
  }, [isMulti, paused, holdMs, fadeMs, maxCycles, beforeSource, activeAfter, opacity]);

  // Multi after — before → after[i] → before → after[i+1] → …
  useEffect(() => {
    if (!isMulti) return undefined;

    cancelAnimation(opacity);
    const timeouts = [];
    let cancelled = false;

    if (paused) {
      opacity.value = 1;
      return undefined;
    }

    setShowBefore(true);
    opacity.value = 0;
    setAfterIndex(0);

    const ease = Easing.inOut(Easing.cubic);
    const maxPairs = maxCycles == null || maxCycles < 0 ? Infinity : maxCycles;
    let pairIndex = 0;
    let pairsShown = 0;

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timeouts.push(id);
    };

    const runPair = () => {
      if (cancelled) return;

      setAfterIndex(pairIndex);
      // Hold before, then fade to after[i]
      later(() => {
        if (cancelled) return;
        opacity.value = withTiming(1, { duration: fadeMs, easing: ease });
        // Hold after, then fade back to before
        later(() => {
          if (cancelled) return;
          pairsShown += 1;
          const done = pairsShown >= maxPairs;
          if (done) {
            // Rest on the last shown after
            return;
          }
          opacity.value = withTiming(0, { duration: fadeMs, easing: ease });
          later(() => {
            if (cancelled) return;
            pairIndex = (pairIndex + 1) % afterList.length;
            runPair();
          }, fadeMs + holdMs);
        }, fadeMs + holdMs);
      }, holdMs);
    };

    runPair();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      cancelAnimation(opacity);
    };
  }, [isMulti, paused, holdMs, fadeMs, maxCycles, beforeSource, afterList, opacity]);

  const animatedAfterStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!activeAfter) return null;

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
          source={activeAfter}
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
