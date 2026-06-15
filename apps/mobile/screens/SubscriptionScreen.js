import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_INSET_MIN } from '../constants';
import styles from '../styles';

export default function SubscriptionScreen({
  subscriptionInfo,
  subscriptionLoading,
  onRefreshSubscription,
  onSubscribe,
  subscribeLoading,
  onCancelSubscription,
  onRestorePurchases,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const [selectedTier, setSelectedTier] = useState(null);

  const getQuotaInfo = () => {
    if (!subscriptionInfo || !subscriptionInfo.usage) {
      return { current: 0, limit: 3, percentage: 0, remaining: 3 };
    }
    const { current, limit } = subscriptionInfo.usage;
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const remaining = Math.max(0, limit - current);
    return { current, limit, percentage, remaining };
  };

  const quotaInfo = getQuotaInfo();
  const isTrial = subscriptionInfo?.isTrial || !subscriptionInfo?.subscription;
  const subscription = subscriptionInfo?.subscription;

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const TIER_INFO = {
    starter: { name: 'Starter', price: '$5', quota: 50 },
    popular: { name: 'Popular', price: '$10', quota: 100 },
    pro: { name: 'Pro', price: '$25', quota: 250 },
  };

  const subscribeLabel = subscribeLoading
    ? 'Processing…'
    : selectedTier
      ? `Subscribe to ${TIER_INFO[selectedTier]?.name} · ${TIER_INFO[selectedTier]?.price}/mo`
      : subscription
        ? 'Select a plan to change'
        : 'Select a plan above';

  const canSubscribe = !!selectedTier && !subscribeLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.paywallContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>Subscription</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View style={styles.paywallHeroIconWrapper}>
            <View style={styles.paywallHeroIcon}>
              <Text style={styles.paywallHeroIconText}>✦</Text>
            </View>
          </View>

          {subscriptionLoading ? (
            <View style={styles.paywallPlanCard}>
              <ActivityIndicator size="small" color="#0F172A" />
              <Text style={styles.paywallPlanQuotaText}>Loading subscription…</Text>
            </View>
          ) : (
            <View style={styles.paywallPlanCard}>
              <View style={styles.paywallPlanHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paywallPlanTitle}>
                    {isTrial ? 'Free Trial' : `${TIER_INFO[subscription?.tier]?.name || 'Plan'}`}
                  </Text>
                  <Text style={styles.paywallPlanQuotaText}>
                    {isTrial
                      ? `${quotaInfo.current} of ${quotaInfo.limit} caricatures used`
                      : `${quotaInfo.remaining} of ${quotaInfo.limit} left this month`}
                  </Text>
                </View>
                {subscription?.cancelAtPeriodEnd ? (
                  <View style={styles.paywallCancelPill}>
                    <Text style={styles.paywallCancelPillText}>
                      Canceling {formatDate(subscription.periodEnd)}
                    </Text>
                  </View>
                ) : isTrial ? (
                  <View style={styles.paywallUpgradePill}>
                    <Text style={styles.paywallUpgradePillText}>UPGRADE</Text>
                  </View>
                ) : (
                  <View style={styles.paywallActivePill}>
                    <Text style={styles.paywallActivePillText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.paywallProgress}>
                <View style={[styles.paywallProgressFill, { width: `${Math.min(quotaInfo.percentage, 100)}%` }]} />
              </View>
              {!isTrial && subscription && (
                <Text style={styles.paywallPlanRenewalText}>
                  {subscription.cancelAtPeriodEnd
                    ? `Access until ${formatDate(subscription.periodEnd)}`
                    : `Renews ${formatDate(subscription.periodEnd)}`}
                </Text>
              )}
              {subscription?.pendingTier && (
                <Text style={styles.paywallPendingText}>
                  Changing to {subscription.pendingTier.charAt(0).toUpperCase() + subscription.pendingTier.slice(1)} at next renewal
                </Text>
              )}
            </View>
          )}

          <Text style={styles.paywallSectionTitle}>Choose your plan</Text>
          {Object.entries(TIER_INFO).map(([tier, info]) => {
            const isCurrent = subscription?.tier === tier;
            const isSelected = selectedTier === tier;

            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.paywallTierCard,
                  isCurrent && styles.paywallTierCardCurrent,
                  isSelected && !isCurrent && styles.paywallTierCardSelected,
                ]}
                onPress={() => {
                  if (!isCurrent) setSelectedTier(tier);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.paywallTierRow}>
                  <View style={styles.paywallTierLeft}>
                    <Text style={styles.paywallTierName}>{info.name}</Text>
                    {isCurrent ? (
                      <View style={styles.paywallTierBadgeCurrent}>
                        <Text style={styles.paywallTierBadgeCurrentText}>CURRENT</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.paywallTierPrice}>
                    {info.price}<Text style={styles.paywallTierPriceUnit}>/mo</Text>
                  </Text>
                </View>
                <Text style={styles.paywallTierDesc}>
                  {info.quota} caricatures
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.paywallActions}>
          <TouchableOpacity
            style={[styles.primaryButton, !canSubscribe && styles.buttonDisabled]}
            onPress={() => onSubscribe(selectedTier)}
            disabled={!canSubscribe}
          >
            <Text style={styles.primaryButtonText}>{subscribeLabel}</Text>
          </TouchableOpacity>
          <View style={styles.uploadSourceRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, subscriptionLoading && styles.buttonDisabled]}
              onPress={onRefreshSubscription}
              disabled={subscriptionLoading}
            >
              <Text style={styles.primaryButtonText}>
                {subscriptionLoading ? 'Refreshing…' : 'Refresh'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, subscribeLoading && styles.buttonDisabled]}
              onPress={onRestorePurchases}
              disabled={subscribeLoading}
            >
              <Text style={styles.primaryButtonText}>Restore</Text>
            </TouchableOpacity>
          </View>
          {subscription && !subscription.cancelAtPeriodEnd && (
            <TouchableOpacity
              onPress={onCancelSubscription}
              disabled={subscribeLoading}
              style={[{ alignSelf: 'center', marginTop: 4 }, subscribeLoading && styles.buttonDisabled]}
            >
              <Text style={styles.paywallCancelLink}>Cancel subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
