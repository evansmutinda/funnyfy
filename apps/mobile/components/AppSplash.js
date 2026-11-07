import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import StyleLoadingBar from './StyleLoadingBar';
import styles from '../styles';

const SPLASH_LOGO = require('../assets/splash-logo.png');

/** Wait before showing progress so a fast style fetch never flashes chrome. */
const PROGRESS_DELAY_MS = 480;

/**
 * Brand-continuous splash. Matches the native splash logo so cold start never
 * jumps to a different loading layout (skeleton / tagline screen).
 */
export default function AppSplash({ waiting = false }) {
  const [showProgress, setShowProgress] = useState(false);
  const breath = useSharedValue(1);

  useEffect(() => {
    if (!waiting) {
      setShowProgress(false);
      breath.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
      return undefined;
    }

    breath.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    const timer = setTimeout(() => setShowProgress(true), PROGRESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [waiting, breath]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  return (
    <View style={styles.appSplashRoot} accessibilityRole="progressbar">
      <Animated.View style={logoStyle}>
        <Image source={SPLASH_LOGO} style={styles.appSplashLogo} resizeMode="contain" />
      </Animated.View>

      {showProgress ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.appSplashProgress}>
          <StyleLoadingBar />
        </Animated.View>
      ) : null}
    </View>
  );
}
