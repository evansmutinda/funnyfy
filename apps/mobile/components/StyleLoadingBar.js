import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import styles from '../styles';

const FILL_RATIO = 0.4;

export default function StyleLoadingBar() {
  const slide = useSharedValue(0);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    slide.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [slide]);

  const fillStyle = useAnimatedStyle(() => {
    const travel = Math.max(0, trackWidth.value * (1 - FILL_RATIO));
    return {
      transform: [{ translateX: slide.value * travel }],
    };
  });

  return (
    <View
      style={styles.styleLoadingBarTrack}
      accessibilityRole="progressbar"
      onLayout={(event) => {
        trackWidth.value = event.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.styleLoadingBarFill, fillStyle]} />
    </View>
  );
}
