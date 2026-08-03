import React, { useEffect } from 'react';
import { StatusBar, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyleLoadingBar from './StyleLoadingBar';
import { BOTTOM_INSET_MIN } from '../constants';
import styles from '../styles';

const SKELETON_ROWS = [
  { titleWidth: 108, tiles: 3 },
  { titleWidth: 132, tiles: 3 },
  { titleWidth: 96, tiles: 2 },
];

function ShimmerBone({ style, delay = 0 }) {
  const opacity = useSharedValue(0.38);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.72, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.38, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.launchShimmerBone, style, animatedStyle]} />;
}

function SkeletonCategoryRow({ titleWidth, tileCount, rowIndex }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(rowIndex * 70).duration(320)}
      style={styles.launchSkeletonSection}
    >
      <View style={styles.launchSkeletonHeader}>
        <ShimmerBone delay={rowIndex * 90} style={{ width: titleWidth, height: 14, borderRadius: 7 }} />
        <ShimmerBone delay={rowIndex * 90 + 40} style={{ width: 52, height: 12, borderRadius: 6 }} />
      </View>
      <View style={styles.launchSkeletonTileRow}>
        {Array.from({ length: tileCount }).map((_, index) => (
          <View key={index} style={styles.launchSkeletonTile}>
            <ShimmerBone
              delay={rowIndex * 90 + index * 55}
              style={styles.launchSkeletonTileImage}
            />
            <ShimmerBone
              delay={rowIndex * 90 + index * 55 + 30}
              style={styles.launchSkeletonTileCaption}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function StylesLaunchLoader() {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.launchLoaderRoot, { paddingTop: insets.top + 12 }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={styles.launchLoaderBrand}>
        <Text style={styles.launchLoaderMark}>FunnyFy</Text>
        <Text style={styles.launchLoaderTagline}>Pick a style · Make it funny</Text>
      </View>

      <View style={styles.launchLoaderSkeletonWrap}>
        {SKELETON_ROWS.map((row, index) => (
          <SkeletonCategoryRow
            key={index}
            rowIndex={index}
            titleWidth={row.titleWidth}
            tileCount={row.tiles}
          />
        ))}
      </View>

      <View style={[styles.launchLoaderFooter, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 12 }]}>
        <Text style={styles.launchLoaderStatus}>Loading styles…</Text>
        <Text style={styles.launchLoaderHint}>Fetching the latest looks from the server</Text>
        <StyleLoadingBar />
      </View>
    </Animated.View>
  );
}
