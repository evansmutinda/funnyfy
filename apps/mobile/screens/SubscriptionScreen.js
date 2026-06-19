import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PaywallStyleMarquee from '../components/PaywallStyleMarquee';
import { BOTTOM_INSET_MIN, PAYWALL_MARQUEE_IMAGES } from '../constants';
import { getTrialRemaining, isTrialUser } from '../utils/trialWarnings';
import { formatSubscriptionDate, getDisplayRenewalDate } from '../utils/subscriptionDates';
import styles from '../styles';

const TIER_INFO = {
  starter: {
    name: 'Starter',
    price: '$5',
    quota: 50,
    tagline: 'Great for trying a few styles',
    perCaricature: '~$0.10',
  },
  popular: {
    name: 'Popular',
    price: '$10',
    quota: 100,
    tagline: 'Best for regular use',
    perCaricature: '~$0.10',
    popular: true,
  },
  pro: {
    name: 'Pro',
    price: '$25',
    quota: 250,
    tagline: 'Power users & sharing',
    perCaricature: '~$0.10',
  },
};

const TIER_NAMES = {
  starter: 'Starter',
  popular: 'Popular',
  pro: 'Pro',
};

function getQuotaInfo(subscriptionInfo) {
  if (!subscriptionInfo?.usage) {
    return { current: 0, limit: 3, percentage: 0, remaining: 3 };
  }
  const { current, limit } = subscriptionInfo.usage;
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const remaining = Math.max(0, limit - current);
  return { current, limit, percentage, remaining };
}

export default function SubscriptionScreen({
  subscriptionInfo,
  subscriptionLoading,
  onRefreshSubscription,
  onSubscribe,
  subscribeLoading,
  onManageSubscription,
  storeSubscriptionLabel = 'Google Play',
  onRestorePurchases,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const [selectedTier, setSelectedTier] = useState(null);

  const isTrial = isTrialUser(subscriptionInfo);
  const subscription = subscriptionInfo?.subscription;
  const quotaInfo = getQuotaInfo(subscriptionInfo);
  const trialRemaining = isTrial ? getTrialRemaining(subscriptionInfo) : null;

  const renewalDate = !isTrial && subscription
    ? getDisplayRenewalDate(subscription, subscriptionInfo?.revenueCatExpiration)
    : null;
  const renewalLabel = renewalDate ? formatSubscriptionDate(renewalDate) : '';

  const planName = subscription?.tier
    ? TIER_NAMES[subscription.tier] || subscription.tier
    : null;

  useEffect(() => {
    if (subscriptionLoading || selectedTier) return;
    if (isTrial) {
      setSelectedTier('popular');
    }
  }, [isTrial, subscriptionLoading, selectedTier]);

  const subscribeLabel = subscribeLoading
    ? 'Processing…'
    : selectedTier
      ? `Continue with ${TIER_INFO[selectedTier]?.name}`
      : subscription
        ? 'Select a plan to change'
        : 'Select a plan';

  const canSubscribe = !!selectedTier && !subscribeLoading;

  return (
    <SafeAreaView style={styles.paywallScreenSafe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={{ height: insets.top, backgroundColor: '#0F172A' }} />

      <View style={[styles.paywallContainer, { paddingBottom: 0 }]}>
        <View style={styles.paywallHero}>
          <View style={styles.paywallHeroTopRow}>
            <TouchableOpacity onPress={onClose} style={styles.paywallCloseButton}>
              <Text style={styles.paywallCloseButtonIcon}>‹</Text>
            </TouchableOpacity>
          </View>

          <PaywallStyleMarquee images={PAYWALL_MARQUEE_IMAGES} />

          <Text style={styles.paywallHeroSubtext}>
            Unlock every style — more caricatures, every month.
          </Text>
        </View>

        <View style={styles.paywallSheet}>
          <ScrollView
            contentContainerStyle={[
              styles.paywallScrollContent,
              { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.paywallScroll}
          >
            {subscriptionLoading ? (
              <View style={styles.paywallUsageCard}>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={styles.paywallUsageMuted}>Loading…</Text>
              </View>
            ) : (
              <View style={styles.paywallUsageCard}>
                <View style={styles.paywallUsageTopRow}>
                  <View style={styles.paywallUsageTitleBlock}>
                    {planName ? (
                      <Text style={styles.paywallUsagePlanName}>{planName} plan</Text>
                    ) : (
                      <Text style={styles.paywallUsagePlanName}>Free trial</Text>
                    )}
                    <Text style={styles.paywallUsageLine}>
                      {isTrial
                        ? `${quotaInfo.remaining} of ${quotaInfo.limit} free caricatures left`
                        : `${quotaInfo.remaining} of ${quotaInfo.limit} left this month`}
                    </Text>
                  </View>
                  {subscription?.cancelAtPeriodEnd ? (
                    <View style={styles.paywallCancelPill}>
                      <Text style={styles.paywallCancelPillText}>CANCELING</Text>
                    </View>
                  ) : isTrial ? (
                    <View style={styles.paywallUpgradePill}>
                      <Text style={styles.paywallUpgradePillText}>TRIAL</Text>
                    </View>
                  ) : subscription ? (
                    <View style={styles.paywallActivePill}>
                      <Text style={styles.paywallActivePillText}>ACTIVE</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.usageProgressRow}>
                  <View style={styles.usageProgressTrack}>
                    <View
                      style={[
                        styles.usageProgressFill,
                        { width: `${Math.min(quotaInfo.percentage, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.usageProgressNumbers}>
                    {quotaInfo.current}/{quotaInfo.limit}
                  </Text>
                </View>

                {isTrial && trialRemaining === 1 ? (
                  <Text style={styles.paywallUsageFootnote}>1 caricature left on your trial</Text>
                ) : null}

                {!isTrial && renewalLabel ? (
                  <View style={styles.paywallRenewalRow}>
                    <Feather name="calendar" size={13} color="#0F172A" />
                    <Text style={styles.paywallUsageFootnote}>
                      {subscription?.cancelAtPeriodEnd
                        ? `Access until ${renewalLabel}`
                        : `Next renewal · ${renewalLabel}`}
                    </Text>
                  </View>
                ) : null}

                {subscription?.pendingTier ? (
                  <Text style={styles.paywallPendingText}>
                    Changing to {TIER_NAMES[subscription.pendingTier] || subscription.pendingTier} at next renewal
                  </Text>
                ) : null}
              </View>
            )}

            <Text style={styles.paywallSectionTitle}>Select your plan</Text>
            {Object.entries(TIER_INFO).map(([tier, info]) => {
              const isCurrent = subscription?.tier === tier;
              const isSelected = selectedTier === tier;

              return (
                <TouchableOpacity
                  key={tier}
                  style={[
                    styles.paywallTierCard,
                    info.popular && !isCurrent && styles.paywallTierCardPopular,
                    isCurrent && styles.paywallTierCardCurrent,
                    isSelected && !isCurrent && styles.paywallTierCardSelected,
                  ]}
                  onPress={() => {
                    if (!isCurrent) setSelectedTier(tier);
                  }}
                  activeOpacity={0.85}
                  disabled={isCurrent}
                >
                  {info.popular && !isCurrent ? (
                    <View style={styles.paywallTierAccent} />
                  ) : null}
                  <View style={styles.paywallTierRow}>
                    <View style={styles.paywallTierLeft}>
                      <Text style={styles.paywallTierName}>{info.name}</Text>
                      {isCurrent ? (
                        <View style={styles.paywallTierBadgeCurrent}>
                          <Text style={styles.paywallTierBadgeCurrentText}>CURRENT</Text>
                        </View>
                      ) : info.popular ? (
                        <View style={styles.paywallTierBadgePopular}>
                          <Text style={styles.paywallTierBadgePopularText}>BEST VALUE</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.paywallTierPriceBlock}>
                      <Text style={styles.paywallTierPrice}>
                        {info.price}<Text style={styles.paywallTierPriceUnit}>/mo</Text>
                      </Text>
                      {!isCurrent ? (
                        <View style={[styles.paywallTierRadio, isSelected && styles.paywallTierRadioSelected]}>
                          {isSelected ? <View style={styles.paywallTierRadioDot} /> : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.paywallTierDesc}>
                    {info.quota} caricatures · {info.perCaricature} each
                  </Text>
                  <Text style={styles.paywallTierTagline}>{info.tagline}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.paywallLegalText}>
              Subscriptions renew monthly through {storeSubscriptionLabel}. Cancel auto-renew there anytime.
            </Text>

            <View style={styles.paywallActions}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.paywallPrimaryButton, !canSubscribe && styles.buttonDisabled]}
                onPress={() => onSubscribe(selectedTier)}
                disabled={!canSubscribe}
              >
                <Text style={styles.primaryButtonText}>{subscribeLabel}</Text>
              </TouchableOpacity>
              <View style={styles.uploadSourceRow}>
                <TouchableOpacity
                  style={[styles.paywallSecondaryOutlineButton, { flex: 1 }, subscriptionLoading && styles.buttonDisabled]}
                  onPress={onRefreshSubscription}
                  disabled={subscriptionLoading}
                >
                  <Text style={styles.secondaryOutlineButtonText}>
                    {subscriptionLoading ? 'Refreshing…' : 'Refresh'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paywallSecondaryOutlineButton, { flex: 1 }, subscribeLoading && styles.buttonDisabled]}
                  onPress={onRestorePurchases}
                  disabled={subscribeLoading}
                >
                  <Text style={styles.secondaryOutlineButtonText}>Restore</Text>
                </TouchableOpacity>
              </View>
              {subscription ? (
                <TouchableOpacity
                  onPress={onManageSubscription}
                  disabled={subscribeLoading}
                  style={[{ alignSelf: 'center', marginTop: 4 }, subscribeLoading && styles.buttonDisabled]}
                >
                  <Text style={styles.paywallCancelLink}>
                    {subscription.cancelAtPeriodEnd
                      ? `Manage in ${storeSubscriptionLabel}`
                      : `Manage or cancel in ${storeSubscriptionLabel}`}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
