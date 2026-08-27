import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressScale from '../components/PressScale';
import { BOTTOM_INSET_MIN } from '../constants';
import { formatSubscriptionDate, getDisplayRenewalDate } from '../utils/subscriptionDates';
import { getUsageQuotaInfo } from '../utils/usageQuota';
import styles from '../styles';

const TIER_NAMES = {
  starter: 'Starter',
  popular: 'Popular',
  pro: 'Pro',
};

export default function UsageScreen({
  subscriptionInfo,
  subscriptionLoading,
  onRefreshSubscription,
  onOpenSubscription,
  onBack,
}) {
  const insets = useSafeAreaInsets();

  const subscription = subscriptionInfo?.subscription;
  const quotaInfo = getUsageQuotaInfo(subscriptionInfo);

  const renewalDate = subscription
    ? getDisplayRenewalDate(subscription, subscriptionInfo?.revenueCatExpiration)
    : null;
  const renewalLabel = renewalDate ? formatSubscriptionDate(renewalDate) : '';

  const planName = subscription?.tier
    ? TIER_NAMES[subscription.tier] || subscription.tier
    : null;

  const isCanceling = !!subscription?.cancelAtPeriodEnd;

  const statusPill = (() => {
    if (isCanceling) {
      return { label: 'CANCELING', pill: styles.pwdStatusPillCancel, text: styles.pwdStatusPillTextCancel };
    }
    if (subscription) {
      return { label: 'ACTIVE', pill: styles.pwdStatusPillActive, text: styles.pwdStatusPillTextActive };
    }
    return { label: 'NO PLAN', pill: styles.pwdStatusPillTrial, text: styles.pwdStatusPillTextTrial };
  })();

  return (
    <View style={styles.galleryRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={[styles.galleryHeaderBand, { paddingTop: insets.top + 8 }]}>
        <View style={styles.galleryHeaderRow}>
          <PressScale onPress={onBack} style={styles.uploadCircleButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>
          <Text style={styles.galleryHeaderTitle}>Usage</Text>
          <View style={styles.galleryHeaderSpacer} />
        </View>
        <Text style={styles.galleryHeaderSubtitle}>
          Your plan and image allowance
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {subscriptionLoading ? (
          <View style={[styles.pwdUsageCard, { alignItems: 'center', flexDirection: 'row', gap: 12 }]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.pwdUsageLine}>Loading…</Text>
          </View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(0).duration(320)}
            style={[
              styles.pwdUsageCard,
              quotaInfo.isLow && styles.pwdUsageCardLow,
            ]}
          >
            <View style={styles.pwdUsageTopRow}>
              <View style={styles.pwdUsageTitleBlock}>
                <Text
                  style={[
                    styles.pwdUsagePlanName,
                    quotaInfo.isLow && styles.pwdUsagePlanNameLow,
                  ]}
                >
                  {planName ? `${planName} plan` : 'No active plan'}
                </Text>
                <Text
                  style={[
                    styles.pwdUsageLine,
                    quotaInfo.isLow && styles.pwdUsageLineLow,
                  ]}
                >
                  {subscription
                    ? `${quotaInfo.remaining} of ${quotaInfo.limit} images left`
                    : 'Subscribe to start generating'}
                </Text>
              </View>
              {statusPill ? (
                <View style={[styles.pwdStatusPill, statusPill.pill]}>
                  <Text style={[styles.pwdStatusPillText, statusPill.text]}>
                    {statusPill.label}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.pwdProgressRow}>
              <View
                style={[
                  styles.pwdProgressTrack,
                  quotaInfo.isLow && styles.pwdProgressTrackLow,
                ]}
              >
                <View
                  style={[
                    styles.pwdProgressFill,
                    quotaInfo.isLow && styles.pwdProgressFillLow,
                    { width: `${Math.min(quotaInfo.percentage, 100)}%` },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.pwdProgressNumbers,
                  quotaInfo.isLow && styles.pwdProgressNumbersLow,
                ]}
              >
                {quotaInfo.current}/{quotaInfo.limit}
              </Text>
            </View>

            {renewalLabel ? (
              <View style={styles.pwdFootnoteRow}>
                <Feather
                  name="calendar"
                  size={13}
                  color={isCanceling ? '#EF4444' : 'rgba(255,255,255,0.55)'}
                />
                <Text
                  style={[
                    styles.pwdFootnoteText,
                    isCanceling && styles.pwdFootnoteTextCancel,
                  ]}
                >
                  {isCanceling
                    ? `Cancels · access until ${renewalLabel}`
                    : `Next renewal · ${renewalLabel}`}
                </Text>
              </View>
            ) : null}

            {subscription?.pendingTier ? (
              <Text style={styles.pwdPendingText}>
                Changing to {TIER_NAMES[subscription.pendingTier] || subscription.pendingTier} at next renewal
              </Text>
            ) : null}
          </Animated.View>
        )}

        <View style={styles.usageActionsRow}>
          <PressScale
            onPress={onRefreshSubscription}
            disabled={subscriptionLoading}
            style={styles.pwdGhostButton}
          >
            <Feather name="refresh-cw" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.pwdGhostButtonText}>
              {subscriptionLoading ? 'Refreshing…' : 'Refresh usage'}
            </Text>
          </PressScale>
        </View>

        {onOpenSubscription ? (
          <PressScale onPress={onOpenSubscription} style={styles.usageManageLink}>
            <Text style={styles.usageManageLinkText}>
              {subscription ? 'Manage subscription' : 'View subscription plans'}
            </Text>
            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.55)" />
          </PressScale>
        ) : null}
      </ScrollView>
    </View>
  );
}
