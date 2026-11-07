import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import PressScale from '../components/PressScale';
import PaywallStyleFade from '../components/PaywallStyleFade';
import { getOnboardingSlides } from '../data/comparisonPairs';
import { CATEGORY_BY_STYLE_ID } from '../data/styleCatalog';
import useStableSafeAreaInsets from '../hooks/useStableSafeAreaInsets';
import {
  configureAndroidNavigationBar,
  hideAndroidNavigationBar,
} from '../utils/androidNavigationBar';
import styles from '../styles';

const DARK_BG = '#0B0F19';

/** Short category lines — one job each. */
const CATEGORY_COPY = {
  caricatures: 'Turn your face into a wild caricature',
  cartoons: 'Become a bold cartoon character',
  art: 'Transform your photo into striking art',
  paintings: 'See yourself in classic painting styles',
  photography: 'Polished, studio-ready photo looks',
  'drawings-sketches': 'A sketched or hand-drawn portrait',
  '3d-characters': 'Reimagine yourself as a 3D character',
  sculptures: 'Cast your likeness in stone or metal',
  'retro-nostalgia': 'Drop into a retro era vibe',
  'moods-moments': 'Capture a fun mood or moment',
  'age-transformation': 'Younger or older — travel through ages',
};

const MANY_MORE_COPY = 'Pick a style. Funnyfy your photo.';
const FALLBACK_COPY = 'Turn any photo into a hilarious new look';

function copyForSlideId(id) {
  if (!id) return FALLBACK_COPY;
  if (id === 'many-more') return MANY_MORE_COPY;
  const categoryId = CATEGORY_BY_STYLE_ID[id];
  return CATEGORY_COPY[categoryId] || FALLBACK_COPY;
}

export default function OnboardingScreen({ onDone }) {
  const insets = useStableSafeAreaInsets();
  const slides = useMemo(() => getOnboardingSlides('hero'), []);
  const [activeId, setActiveId] = useState(slides[0]?.id || null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    hideAndroidNavigationBar();
    return () => {
      configureAndroidNavigationBar();
    };
  }, []);

  const handleActiveChange = useCallback(({ id, index }) => {
    setActiveId(id || null);
    setActiveIndex(typeof index === 'number' ? index : 0);
  }, []);

  const handleDone = useCallback(() => {
    configureAndroidNavigationBar();
    onDone?.();
  }, [onDone]);

  const line = copyForSlideId(activeId);
  const isCollage = activeId === 'many-more';
  const isLast = slides.length === 0 || activeIndex >= slides.length - 1;

  return (
    <Animated.View
      style={styles.onboardRoot}
      entering={FadeIn.duration(560)}
    >
      <View style={[styles.onboardBody, { paddingTop: insets.top + 4 }]}>
        <View style={styles.onboardHeroZone}>
          <PaywallStyleFade
            pairs={slides}
            style={StyleSheet.absoluteFill}
            imageStyle={styles.uploadBackgroundImage}
            onActiveChange={handleActiveChange}
            holdBeforeMs={1400}
            sweepMs={1700}
            holdAfterMs={2100}
            introDelayMs={700}
            softTransitions
            loop={false}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient
              colors={['rgba(11,15,25,0.72)', 'rgba(11,15,25,0)']}
              style={styles.onboardHeroTopScrim}
            />
            {isCollage ? (
              <LinearGradient
                dither
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                colors={[
                  'rgba(11,15,25,0.15)',
                  'rgba(11,15,25,0)',
                  'rgba(11,15,25,0.45)',
                  'rgba(11,15,25,0.92)',
                  DARK_BG,
                ]}
                locations={[0, 0.22, 0.52, 0.78, 1]}
                style={styles.onboardHeroCollageScrim}
              />
            ) : (
              <LinearGradient
                dither
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                colors={[
                  'rgba(11,15,25,0)',
                  'rgba(11,15,25,0.28)',
                  'rgba(11,15,25,0.72)',
                  DARK_BG,
                  DARK_BG,
                ]}
                locations={[0, 0.38, 0.7, 0.9, 1]}
                style={styles.onboardHeroBottomScrim}
              />
            )}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.onboardBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          key={activeId || 'fallback'}
          entering={FadeIn.duration(420)}
          exiting={FadeOut.duration(220)}
          style={[
            styles.onboardCopyBlock,
            isCollage && styles.onboardCopyBlockFinale,
          ]}
        >
          <Text
            style={[styles.onboardCopy, isCollage && styles.onboardCopyFinale]}
          >
            {line}
          </Text>
        </Animated.View>

        {isLast ? (
          <Animated.View entering={FadeInUp.duration(420).delay(220)}>
            <PressScale
              onPress={handleDone}
              style={styles.onboardPrimaryButton}
              accessibilityRole="button"
              accessibilityLabel="Get started"
            >
              <Text style={styles.onboardPrimaryButtonText}>Get started</Text>
            </PressScale>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}
