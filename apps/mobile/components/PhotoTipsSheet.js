import React, { useEffect, useState } from 'react';
import { BackHandler, Dimensions, Image, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PressScale from './PressScale';
import styles from '../styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Each tip is rendered as a color-coded concept card so the grid is
// meaningful even before real example photos are sourced.
//
// To swap an icon card for a real photo later:
//   1. Drop the image into apps/mobile/assets/tips/ (e.g. tip-good-1.jpg)
//   2. Add `image: require('../assets/tips/tip-good-1.jpg')` to that item
//   3. The component automatically renders the photo instead of the icon.
const TIP_EXAMPLES = [
  {
    id: 'good-front',
    icon: 'user',
    good: true,
    title: 'Face forward',
    subtitle: 'Looking at camera',
  },
  {
    id: 'good-light',
    icon: 'sun',
    good: true,
    title: 'Even lighting',
    subtitle: 'No harsh shadows',
  },
  {
    id: 'bad-sunglasses',
    icon: 'eye-off',
    good: false,
    title: 'No sunglasses',
    subtitle: 'Eyes need to show',
  },
  {
    id: 'bad-profile',
    icon: 'refresh-cw',
    good: false,
    title: 'No side angles',
    subtitle: 'Stay frontal',
  },
];

const RULES = [
  'One person per photo (Custom 2 and Neanderthal 3D handle groups)',
  'Avoid hats, masks, or heavy shadows on the face',
  'No nudity or sexually suggestive content — repeated violations will suspend your account',
];

/**
 * In-tree slide-up sheet for photo guidelines. Renders as an absolutely
 * positioned overlay (NOT a React Native <Modal>) because Modal on Android
 * spawns a separate window, which breaks SafeAreaProvider context, can
 * appear translucent when combined with statusBarTranslucent, and has
 * inconsistent onRequestClose behavior across SDKs.
 *
 * Animation: slide up on open, slide down on close. Android hardware
 * back is handled via BackHandler while visible.
 */
export default function PhotoTipsSheet({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 280 });
    } else if (mounted) {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [visible, mounted, translateY]);

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onClose) onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.tipsRoot, animatedStyle]}
      pointerEvents="auto"
    >
      <View style={[styles.tipsTopRow, { paddingTop: insets.top + 8 }]}>
        <PressScale onPress={onClose} style={styles.tipsCloseCircle} hitSlop={8}>
          <Feather name="chevron-down" size={22} color="#FFFFFF" />
        </PressScale>
        <Text style={styles.tipsTopTitle}>Photo Tips</Text>
        <View style={styles.tipsCloseCirclePlaceholder} />
      </View>

      <ScrollView
        style={styles.tipsScroll}
        contentContainerStyle={[
          styles.tipsScrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tipsLead}>
          Front-facing, well-lit portraits give the AI the most to work with.
        </Text>

        <View style={styles.tipsGrid}>
          {TIP_EXAMPLES.map((item) => {
            const cardStyle = [
              styles.tipsConceptCard,
              item.good ? styles.tipsConceptCardGood : styles.tipsConceptCardBad,
            ];
            const iconBgStyle = [
              styles.tipsConceptIconBg,
              item.good ? styles.tipsConceptIconBgGood : styles.tipsConceptIconBgBad,
            ];
            const badgeStyle = [
              styles.tipsBadge,
              item.good ? styles.tipsBadgeGood : styles.tipsBadgeBad,
            ];

            return (
              <View key={item.id} style={styles.tipsGridCell}>
                <View style={cardStyle}>
                  {item.image ? (
                    <Image
                      source={item.image}
                      style={styles.tipsConceptImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={iconBgStyle}>
                      <Feather
                        name={item.icon}
                        size={42}
                        color={item.good ? '#10B981' : '#EF4444'}
                      />
                    </View>
                  )}
                  <View style={badgeStyle}>
                    <Feather
                      name={item.good ? 'check' : 'x'}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
                <Text style={styles.tipsConceptTitle}>{item.title}</Text>
                <Text style={styles.tipsConceptSubtitle}>{item.subtitle}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.tipsRulesBlock}>
          {RULES.map((rule, i) => (
            <View key={rule} style={styles.tipsRuleRow}>
              <View style={styles.tipsRuleBullet}>
                <Text style={styles.tipsRuleBulletText}>{i + 1}</Text>
              </View>
              <Text style={styles.tipsRuleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.tipsFooter,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <PressScale onPress={onClose} style={styles.tipsContinueButton}>
          <Text style={styles.tipsContinueButtonText}>Got it</Text>
        </PressScale>
      </View>
    </Animated.View>
  );
}
