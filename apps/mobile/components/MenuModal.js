import React, { useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import styles from '../styles';

export function SkeletonLoader() {
  const delays = [0, 150, 300, 450];
  return (
    <View style={styles.skeletonContainer}>
      {delays.map((delay, i) => (
        <PulsingSquare key={i} delay={delay} />
      ))}
    </View>
  );
}

export function PulsingSquare({ delay }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.2, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Reanimated.View style={[styles.skeletonSquare, animStyle]} />;
}

export default function MenuModal({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const items = [
    { id: 'gallery',      label: 'My Gallery',    icon: 'image' },
    { id: 'subscription', label: 'Subscriptions',      icon: 'star' },
    { id: 'privacy',      label: 'Privacy Policy',     icon: 'shield' },
    { id: 'terms',        label: 'Terms & Conditions', icon: 'file-text' },
    { id: 'about',        label: 'About',              icon: 'info' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.menuBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.menuHandle} />
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={20} color="#0F172A" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
