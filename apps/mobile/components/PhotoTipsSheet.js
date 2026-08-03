import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PressScale from './PressScale';
import { GENERIC_STYLE_PHOTO_TIPS } from '../data/stylePhotoTips';
import styles from '../styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * In-tree slide-up sheet for photo guidelines. Renders as an absolutely
 * positioned overlay (NOT a React Native <Modal>) because Modal on Android
 * spawns a separate window, which breaks SafeAreaProvider context, can
 * appear translucent when combined with statusBarTranslucent, and has
 * inconsistent onRequestClose behavior across SDKs.
 */
export default function PhotoTipsSheet({
  visible,
  onClose,
  styleLabel,
  tips = GENERIC_STYLE_PHOTO_TIPS,
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [mounted, setMounted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (visible) {
      setDontShowAgain(false);
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

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose({ dontShowAgain });
    }
  }, [onClose, dontShowAgain]);

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, handleClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted || !tips) return null;

  const title = styleLabel ? `Photo tips · ${styleLabel}` : 'Photo tips';

  return (
    <Animated.View
      style={[styles.tipsRoot, animatedStyle]}
      pointerEvents="auto"
    >
      <View style={[styles.tipsTopRow, { paddingTop: insets.top + 8 }]}>
        <PressScale onPress={handleClose} style={styles.tipsCloseCircle} hitSlop={8}>
          <Feather name="chevron-down" size={22} color="#FFFFFF" />
        </PressScale>
        <Text style={styles.tipsTopTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.tipsCloseCirclePlaceholder} />
      </View>

      <ScrollView
        style={styles.tipsScroll}
        contentContainerStyle={[
          styles.tipsScrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tipsLead}>{tips.lead}</Text>

        <View style={styles.tipsGrid}>
          {tips.examples.map((item) => {
            const cardStyle = [
              styles.tipsConceptCard,
              item.good ? styles.tipsConceptCardGood : styles.tipsConceptCardBad,
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
                  ) : item.placeholder ? (
                    <View style={styles.tipsPlaceholder}>
                      <Feather name="image" size={32} color="rgba(255,255,255,0.35)" />
                      <Text style={styles.tipsPlaceholderLabel}>Example coming soon</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.tipsConceptIconBg,
                        item.good ? styles.tipsConceptIconBgGood : styles.tipsConceptIconBgBad,
                      ]}
                    >
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

        {tips.rules?.length ? (
          <View style={styles.tipsRulesBlock}>
            {tips.rules.map((rule, i) => (
              <View key={rule} style={styles.tipsRuleRow}>
                <View style={styles.tipsRuleBullet}>
                  <Text style={styles.tipsRuleBulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.tipsRuleText}>{rule}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.tipsFooter,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <TouchableOpacity
          onPress={() => setDontShowAgain((v) => !v)}
          style={styles.tipsDontShowRow}
          activeOpacity={0.85}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: dontShowAgain }}
        >
          <View style={[styles.tipsCheckbox, dontShowAgain && styles.tipsCheckboxChecked]}>
            {dontShowAgain ? (
              <Feather name="check" size={14} color="#0B0F19" />
            ) : null}
          </View>
          <Text style={styles.tipsDontShowText}>Do not show this again</Text>
        </TouchableOpacity>

        <PressScale onPress={handleClose} style={styles.tipsContinueButton}>
          <Text style={styles.tipsContinueButtonText}>Got it</Text>
        </PressScale>
      </View>
    </Animated.View>
  );
}
