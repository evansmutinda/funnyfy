import React, { useEffect } from 'react';
import { BackHandler, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import PressScale from './PressScale';
import { configureAndroidNavigationBar } from '../utils/androidNavigationBar';
import styles from '../styles';

const ITEMS = [
  { id: 'gallery', label: 'My Gallery', icon: 'image' },
  { id: 'usage', label: 'Usage', icon: 'bar-chart-2' },
  { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
  { id: 'share-app', label: 'Share app', icon: 'share-2' },
  { id: 'request-style', label: 'Request a style', icon: 'plus-circle' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield' },
  { id: 'terms', label: 'Terms & Conditions', icon: 'file-text' },
  { id: 'about', label: 'About', icon: 'info' },
  { id: 'contact', label: 'Contact us', icon: 'mail' },
];

function formatUserIdPreview(userId) {
  if (!userId || userId.length <= 16) return userId || '';
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

export default function MenuModal({ visible, onClose, onSelect, userId, onUserIdCopied }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android') {
      configureAndroidNavigationBar();
    }
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const handleCopyUserId = async () => {
    if (!userId) return;
    try {
      await Clipboard.setStringAsync(String(userId));
      onUserIdCopied?.();
    } catch (err) {
      console.warn('[Menu] Failed to copy user id:', err?.message || err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        if (Platform.OS === 'android') configureAndroidNavigationBar();
      }}
    >
      <View style={styles.menuBackdrop}>
        <Pressable style={styles.menuDismissArea} onPress={onClose} accessibilityLabel="Close menu" />
        <View
          style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.menuHandle} />
          {ITEMS.map((item) => (
            <PressScale
              key={item.id}
              style={styles.menuItem}
              onPress={() => onSelect(item.id)}
            >
              <Feather name={item.icon} size={20} color="#FFFFFF" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.45)" />
            </PressScale>
          ))}

          {userId ? (
            <PressScale
              style={styles.menuUserIdRow}
              onPress={handleCopyUserId}
              accessibilityLabel="Copy user ID"
              accessibilityHint="Copies your user ID for support requests"
            >
              <Feather name="hash" size={18} color="rgba(255,255,255,0.55)" style={styles.menuItemIcon} />
              <View style={styles.menuUserIdTextBlock}>
                <Text style={styles.menuUserIdLabel}>User ID</Text>
                <Text style={styles.menuUserIdValue} numberOfLines={1} ellipsizeMode="middle">
                  {formatUserIdPreview(userId)}
                </Text>
              </View>
              <Feather name="copy" size={18} color="rgba(255,255,255,0.55)" />
            </PressScale>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
