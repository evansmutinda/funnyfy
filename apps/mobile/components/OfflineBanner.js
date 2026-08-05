import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from './NetworkProvider';
import styles from '../styles';

/**
 * Non-blocking top overlay when offline — matches toast styling and does not
 * affect screen layout. Upload/review screens use their own inline chip instead.
 */
export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.offlineBannerContainer, { paddingTop: insets.top + 8 }]}
      accessibilityRole="alert"
    >
      <View style={[styles.toastInner, styles.toastInnerWarning]}>
        <View style={styles.toastWarningIconCircle}>
          <Feather name="wifi-off" size={15} color="#EA580C" />
        </View>
        <View style={styles.toastTextWrap}>
          <Text style={styles.toastTitleWarning}>No connection</Text>
          <Text style={styles.toastMessageWarning}>
            Generation and purchases need internet
          </Text>
        </View>
      </View>
    </View>
  );
}
