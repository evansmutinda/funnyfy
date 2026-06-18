import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

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
      }, hasAction ? 5000 : 2800);

      return () => clearTimeout(timer);
    }
    slideAnim.setValue(-100);
  }, [visible, hasAction]);

  if (!visible) return null;

  const accent = type === 'success' ? '#10B981'
    : type === 'error' ? '#DC2626'
    : type === 'warning' ? '#64748B'
    : '#0F172A';

  const icon = type === 'success' ? '✓'
    : type === 'error' ? '!'
    : type === 'warning' ? '!'
    : 'i';

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
    >
      <View style={styles.toastInner}>
        <View style={[styles.toastIconCircle, { backgroundColor: accent }]}>
          <Text style={styles.toastIconText}>{icon}</Text>
        </View>
        <View style={styles.toastTextWrap}>
          {title ? <Text style={styles.toastTitle}>{title}</Text> : null}
          {message ? <Text style={styles.toastMessage}>{message}</Text> : null}
        </View>
        {hasAction ? (
          <TouchableOpacity
            onPress={handleAction}
            style={styles.toastAction}
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
