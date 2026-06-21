import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PressScale from './PressScale';
import styles from '../styles';

export function getUploadQuotaInfo(subscriptionInfo) {
  if (!subscriptionInfo || !subscriptionInfo.usage) {
    return { current: 0, limit: 3, percentage: 0, isLow: false, isExceeded: false };
  }
  const { current, limit } = subscriptionInfo.usage;
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  return {
    current,
    limit,
    percentage,
    isLow: percentage >= 80 && percentage < 100,
    isExceeded: percentage >= 100,
  };
}

function getUsagePillLabel(subscriptionInfo, quotaInfo) {
  if (!subscriptionInfo || subscriptionInfo.isTrial || !subscriptionInfo.subscription) {
    return `Trial · ${quotaInfo.current}/${quotaInfo.limit}`;
  }
  const tier = subscriptionInfo.subscription.tier;
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)} · ${quotaInfo.current}/${quotaInfo.limit}`;
}

/**
 * Upload + review header: [back] [style pill] …… [usage pill]
 */
export default function UploadFlowHeader({
  onBack,
  onStylePress,
  style,
  subscriptionInfo,
  onOpenSubscription,
}) {
  const quotaInfo = getUploadQuotaInfo(subscriptionInfo);

  return (
    <View style={styles.uploadHeaderRow}>
      <PressScale onPress={onBack} style={styles.uploadCircleButton}>
        <Feather name="chevron-left" size={22} color="#FFFFFF" />
      </PressScale>

      {style ? (
        <PressScale
          onPress={onStylePress || onBack}
          style={styles.uploadHeaderStyleChip}
        >
          <View style={styles.uploadFloatingChipDot} />
          <Text
            style={styles.uploadHeaderStyleChipText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {style.label}
          </Text>
          <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.85)" />
        </PressScale>
      ) : null}

      <View style={styles.uploadHeaderSpacer} />

      <PressScale
        onPress={onOpenSubscription}
        style={styles.uploadHeaderPill}
        disabled={!onOpenSubscription}
      >
        <View style={styles.uploadHeaderPillProgress}>
          <View
            style={[
              styles.uploadHeaderPillProgressFill,
              { width: `${Math.min(quotaInfo.percentage, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.uploadHeaderPillText}>
          {getUsagePillLabel(subscriptionInfo, quotaInfo)}
        </Text>
      </PressScale>
    </View>
  );
}
