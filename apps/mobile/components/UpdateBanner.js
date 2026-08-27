import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

/**
 * Soft Play Store update nudge — absolute overlay (same pattern as OfflineBanner).
 * Does not block the app; dismissible per latest version.
 */
export default function UpdateBanner({
  visible,
  storeUrl,
  onDismiss,
  message = 'Update FunnyFy for the latest styles and fixes',
}) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const openStore = () => {
    const url = (storeUrl || '').trim();
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View
      style={[styles.updateBannerContainer, { paddingTop: insets.top + 8 }]}
      accessibilityRole="summary"
    >
      <View style={[styles.toastInner, styles.toastInnerInfo, styles.updateBannerInner]}>
        <View style={[styles.toastIconCircle, styles.toastIconCircleInfo]}>
          <Feather name="download" size={15} color="#A5B4FC" />
        </View>
        <View style={styles.toastTextWrap}>
          <Text style={styles.toastTitle}>Update available</Text>
          <Text style={styles.toastMessage}>{message}</Text>
          <View style={styles.updateBannerActions}>
            {Boolean(storeUrl?.trim()) && (
              <TouchableOpacity
                onPress={openStore}
                style={styles.updateBannerPrimaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Open Play Store to update"
                activeOpacity={0.75}
              >
                <Text style={styles.updateBannerPrimaryText}>Update</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.updateBannerDismissBtn}
              accessibilityRole="button"
              accessibilityLabel="Dismiss update notice"
              activeOpacity={0.75}
            >
              <Text style={styles.updateBannerDismissText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
