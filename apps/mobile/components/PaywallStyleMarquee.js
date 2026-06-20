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

const DEFAULT_TILE_W = 96;
const DEFAULT_TILE_H = 120;
const DEFAULT_WRAP_H = 132;
const DEFAULT_GAP = 12;

export default function PaywallStyleMarquee({
  images,
  tileWidth = DEFAULT_TILE_W,
  tileHeight = DEFAULT_TILE_H,
  wrapHeight = DEFAULT_WRAP_H,
  gap = DEFAULT_GAP,
}) {
  const sources = Array.isArray(images) && images.length > 0 ? images : [];
  const loop = [...sources, ...sources];
  const segmentWidth = sources.length * (tileWidth + gap);
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
    <View style={[styles.paywallMarqueeWrap, { height: wrapHeight }]}>
      <Animated.View style={[styles.paywallMarqueeRow, { gap }, rowStyle]}>
        {loop.map((source, index) => (
          <View
            key={`marquee-${index}`}
            style={[
              styles.paywallMarqueeTile,
              { width: tileWidth, height: tileHeight },
            ]}
          >
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
