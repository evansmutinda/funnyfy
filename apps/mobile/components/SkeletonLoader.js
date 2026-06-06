import React, { useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import styles from '../styles';

export default function SkeletonLoader() {
  const delays = [0, 150, 300, 450];
  return (
    <View style={styles.skeletonContainer}>
      {delays.map((delay, i) => (
        <PulsingSquare key={i} delay={delay} />
      ))}
    </View>
  );
}

function PulsingSquare({ delay }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.2, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Reanimated.View style={[styles.skeletonSquare, animStyle]} />;
}
