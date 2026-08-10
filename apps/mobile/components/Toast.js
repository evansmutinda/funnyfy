import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

const TYPE_META = {
  success: {
    inner: [styles.toastInnerSuccess],
    iconCircle: [styles.toastIconCircle, styles.toastIconCircleSuccess],
    icon: 'check-circle',
    iconColor: '#10B981',
  },
  error: {
    inner: [styles.toastInnerError],
    iconCircle: [styles.toastIconCircle, styles.toastIconCircleError],
    icon: 'alert-circle',
    iconColor: '#F87171',
  },
  warning: {
    inner: [styles.toastInnerWarning],
    iconCircle: [styles.toastWarningIconCircle],
    icon: 'alert-triangle',
    iconColor: '#EA580C',
  },
  info: {
    inner: [styles.toastInnerInfo],
    iconCircle: [styles.toastIconCircle, styles.toastIconCircleInfo],
    icon: 'info',
    iconColor: '#A5B4FC',
  },
};

export default function Toast({
  visible,
  title,
  message,
  type = 'info',
  actionLabel,
  onAction,
  onHide,
}) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();
  const hasAction = Boolean(actionLabel && onAction);
  const meta = TYPE_META[type] || TYPE_META.info;
  const isWarning = type === 'warning';

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 220,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, hasAction ? 5500 : type === 'error' || type === 'warning' ? 5000 : 2800);

      return () => clearTimeout(timer);
    }
    slideAnim.setValue(-100);
  }, [visible, hasAction, onHide, slideAnim, type]);

  if (!visible) return null;

  const handleAction = () => {
    if (onAction) onAction();
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onHide && onHide());
  };

  return (
    <Animated.View
      pointerEvents={hasAction ? 'box-none' : 'none'}
      style={[
        styles.toastContainer,
        { paddingTop: insets.top + 8, transform: [{ translateY: slideAnim }] },
      ]}
      accessibilityRole="alert"
    >
      <View style={[styles.toastInner, ...meta.inner]}>
        <View style={meta.iconCircle}>
          <Feather name={meta.icon} size={16} color={meta.iconColor} />
        </View>
        <View style={styles.toastTextWrap}>
          {title ? (
            <Text style={[styles.toastTitle, isWarning && styles.toastTitleWarning]}>
              {title}
            </Text>
          ) : null}
          {message ? (
            <Text style={[styles.toastMessage, isWarning && styles.toastMessageWarning]}>
              {message}
            </Text>
          ) : null}
        </View>
        {hasAction ? (
          <TouchableOpacity
            onPress={handleAction}
            style={[styles.toastAction, isWarning && styles.toastActionWarning]}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toastActionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}
