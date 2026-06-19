import React from 'react';
import { Text, View } from 'react-native';
import { useNetwork } from './NetworkProvider';
import styles from '../styles';

/**
 * Non-blocking top banner when the device is offline.
 * Gallery, About, and style browsing still work; generation and purchases need internet.
 */
export default function OfflineBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <View style={styles.offlineBanner} accessibilityRole="alert">
      <Text style={styles.offlineBannerText}>
        No connection — generation and purchases need internet
      </Text>
    </View>
  );
}
