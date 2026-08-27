import React from 'react';
import { Image, ScrollView, StatusBar, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import PressScale from '../components/PressScale';
import { APP_NAME, BOTTOM_INSET_MIN } from '../constants';
import styles from '../styles';

const ITEMS = [
  { id: 'gallery', label: 'My Gallery', icon: 'image' },
  { id: 'usage', label: 'Usage', icon: 'bar-chart-2' },
  { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
  { id: 'share-app', label: 'Share app', icon: 'share-2' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield' },
  { id: 'terms', label: 'Terms & Conditions', icon: 'file-text' },
  { id: 'contact', label: 'Contact us', icon: 'mail' },
];

/** Single source of truth — same file bump-version.js updates. */
const APP_VERSION = require('../version.json').version;

function formatUserIdPreview(userId) {
  if (!userId || userId.length <= 16) return userId || '';
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

export default function MenuScreen({ onBack, onSelect, userId, onUserIdCopied }) {
  const insets = useSafeAreaInsets();

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
    <View style={styles.menuRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={[styles.menuHeaderBand, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.menuHeaderRow}>
          <PressScale onPress={onBack} style={styles.uploadCircleButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.menuBrand}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${APP_NAME}, version ${APP_VERSION}`}
        >
          <Image
            source={require('../assets/logo-mark.png')}
            style={styles.menuLogo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.menuAppName} allowFontScaling={false}>
            {APP_NAME}
          </Text>
          <Text style={styles.menuVersion}>{`v${APP_VERSION}`}</Text>
        </View>

        <View style={styles.menuList}>
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
      </ScrollView>
    </View>
  );
}
