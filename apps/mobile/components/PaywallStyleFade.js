import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const HOLD_MS = 4800;
const FADE_MS = 1800;

/**
 * Cycles style previews using the same two-layer crossfade as ComparisonFade.
 * Index advances in two layout-safe steps so sources never change while visible.
 */
export default function PaywallStyleFade({
  images,
  style,
  imageStyle,
  holdMs = HOLD_MS,
  fadeMs = FADE_MS,
}) {
  const sources = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images],
  );
  const count = sources.length;
  const [pair, setPair] = useState({ back: 0, front: 1 });
  const opacity = useSharedValue(0);
  const aliveRef = useRef(true);
  const scheduleNextRef = useRef(null);
  const pendingStepRef = useRef(null);
  const skipLayoutRef = useRef(true);

  const animatedAfterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const onPhaseComplete = useCallback(() => {
    if (count <= 1) return;
    pendingStepRef.current = 'snap';
    setPair((prev) => ({ back: prev.front, front: prev.front }));
  }, [count]);

  useEffect(() => {
    aliveRef.current = true;
    skipLayoutRef.current = true;
    pendingStepRef.current = null;
    setPair({ back: 0, front: count > 1 ? 1 : 0 });
    opacity.value = 0;

    return () => {
      aliveRef.current = false;
      cancelAnimation(opacity);
    };
  }, [count, opacity]);

  useEffect(() => {
    if (count <= 1) return undefined;

    const runCycle = () => {
      if (!aliveRef.current) return;
      const ease = Easing.inOut(Easing.cubic);

      opacity.value = withTiming(0, { duration: holdMs, easing: ease }, (holdDone) => {
        'worklet';
        if (!holdDone || !aliveRef.current) return;
        opacity.value = withTiming(1, { duration: fadeMs, easing: ease }, (fadeInDone) => {
          'worklet';
          if (!fadeInDone || !aliveRef.current) return;
          opacity.value = withTiming(1, { duration: holdMs, easing: ease }, (holdAfterDone) => {
            'worklet';
            if (!holdAfterDone || !aliveRef.current) return;
            runOnJS(onPhaseComplete)();
          });
        });
      });
    };

    scheduleNextRef.current = runCycle;
    runCycle();

    return () => {
      cancelAnimation(opacity);
    };
  }, [count, holdMs, fadeMs, onPhaseComplete, opacity]);

  useLayoutEffect(() => {
    if (count <= 1) return;

    if (skipLayoutRef.current) {
      skipLayoutRef.current = false;
      return;
    }

    if (pendingStepRef.current === 'snap') {
      opacity.value = 0;
      pendingStepRef.current = 'advance';
      setPair((prev) => ({
        back: prev.back,
        front: (prev.back + 1) % count,
      }));
      return;
    }

    if (pendingStepRef.current === 'advance') {
      pendingStepRef.current = null;
      scheduleNextRef.current?.();
    }
  }, [pair, count, opacity]);

  if (count === 0) return null;

  const beforeSource = sources[pair.back % count];
  const afterSource = sources[pair.front % count];

  return (
    <View style={[styles.root, style]}>
      <Image
        source={beforeSource}
        style={[StyleSheet.absoluteFill, imageStyle]}
      />
      {count > 1 ? (
        <Animated.Image
          source={afterSource}
          style={[StyleSheet.absoluteFill, imageStyle, animatedAfterStyle]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
