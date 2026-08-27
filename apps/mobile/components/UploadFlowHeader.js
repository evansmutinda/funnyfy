import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PressScale from './PressScale';
import { getUsageQuotaInfo } from '../utils/usageQuota';
import styles from '../styles';

export function getUploadQuotaInfo(subscriptionInfo) {
  return getUsageQuotaInfo(subscriptionInfo);
}

function getUsagePillLabel(subscriptionInfo, quotaInfo) {
  if (!subscriptionInfo?.subscription) {
    return 'No plan';
  }
  const tier = subscriptionInfo.subscription.tier;
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)} · ${quotaInfo.current}/${quotaInfo.limit}`;
}

/**
 * Upload + review + result header: [back] [style pill] …… [usage pill] [optional trailing]
 */
export default function UploadFlowHeader({
  onBack,
  onStylePress,
  style,
  styleLabel,
  loading = false,
  subscriptionInfo,
  onOpenUsage,
  trailingAction,
}) {
  const quotaInfo = getUploadQuotaInfo(subscriptionInfo);
  const chipLabel = loading ? 'Generating…' : (styleLabel ?? style?.label);

  return (
    <View style={styles.uploadHeaderRow}>
      <PressScale onPress={onBack} style={styles.uploadCircleButton}>
        <Feather name="chevron-left" size={22} color="#FFFFFF" />
      </PressScale>

      {style ? (
        <PressScale
          onPress={onStylePress || onBack}
          style={styles.uploadHeaderStyleChip}
          disabled={loading}
        >
          <View
            style={[
              styles.uploadFloatingChipDot,
              loading && styles.resultChipDotLoading,
            ]}
          />
          <Text
            style={styles.uploadHeaderStyleChipText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {chipLabel}
          </Text>
          {!loading ? (
            <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.85)" />
          ) : null}
        </PressScale>
      ) : null}

      <View style={styles.uploadHeaderSpacer} />

      <PressScale
        onPress={onOpenUsage}
        style={[
          styles.uploadHeaderPill,
          quotaInfo.isLow && styles.uploadHeaderPillLow,
        ]}
        disabled={!onOpenUsage}
      >
        <View
          style={[
            styles.uploadHeaderPillProgress,
            quotaInfo.isLow && styles.uploadHeaderPillProgressLow,
          ]}
        >
          <View
            style={[
              styles.uploadHeaderPillProgressFill,
              quotaInfo.isLow && styles.uploadHeaderPillProgressFillLow,
              { width: `${Math.min(quotaInfo.percentage, 100)}%` },
            ]}
          />
        </View>
        <Text
          style={[
            styles.uploadHeaderPillText,
            quotaInfo.isLow && styles.uploadHeaderPillTextLow,
          ]}
        >
          {getUsagePillLabel(subscriptionInfo, quotaInfo)}
        </Text>
      </PressScale>

      {trailingAction ? (
        <PressScale
          onPress={trailingAction.onPress}
          style={styles.uploadHeaderTrailingButton}
        >
          <Feather name={trailingAction.icon} size={20} color="#FFFFFF" />
        </PressScale>
      ) : null}
    </View>
  );
}
