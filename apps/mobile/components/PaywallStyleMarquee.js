import React, { useEffect } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import styles from '../styles';

const TILE_W = 96;
const GAP = 12;

export default function PaywallStyleMarquee({ images }) {
  const sources = Array.isArray(images) && images.length > 0 ? images : [];
  const loop = [...sources, ...sources];
  const segmentWidth = sources.length * (TILE_W + GAP);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-segmentWidth, {
        duration: Math.max(sources.length * 2800, 12000),
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [segmentWidth, sources.length, offset]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (sources.length === 0) return null;

  return (
    <View style={styles.paywallMarqueeWrap}>
      <Animated.View style={[styles.paywallMarqueeRow, rowStyle]}>
        {loop.map((source, index) => (
          <View key={`marquee-${index}`} style={styles.paywallMarqueeTile}>
            <Image source={source} style={styles.paywallMarqueeImage} resizeMode="cover" />
          </View>
        ))}
      </Animated.View>
      <LinearGradient
        colors={['rgba(15,23,42,0)', 'rgba(15,23,42,0.35)']}
        style={styles.paywallMarqueeGradient}
        pointerEvents="none"
      />
    </View>
  );
}
