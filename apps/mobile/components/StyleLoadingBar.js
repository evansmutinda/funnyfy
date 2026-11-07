import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_COUNT = 4;
const CYCLE_MS = 420;

function Dot({ delay }) {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: CYCLE_MS, easing: Easing.out(Easing.cubic) }),
          withTiming(0.35, { duration: CYCLE_MS, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.85 + pulse.value * 0.2 }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

/**
 * Quiet indeterminate loader — three soft dots.
 * Fits splash + empty states better than a track/fill bar.
 */
export default function StyleLoadingBar() {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <Dot key={i} delay={i * 140} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
    height: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
