import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

export default function Toast({ visible, title, message, type = 'info', onHide }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

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
      }, 2800);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
    }
  }, [visible]);

  if (!visible) return null;

  const accent = type === 'success' ? '#10B981'
    : type === 'error' ? '#F59E0B'
    : type === 'warning' ? '#F59E0B'
    : '#0F172A';

  const icon = type === 'success' ? '✓'
    : type === 'error' ? '!'
    : type === 'warning' ? '!'
    : 'i';

  return (
    <Animated.View
      pointerEvents="none"
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
      </View>
    </Animated.View>
  );
}
