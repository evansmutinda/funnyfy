import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressScale from '../components/PressScale';
import PaywallStyleMarquee from '../components/PaywallStyleMarquee';
import { BOTTOM_INSET_MIN, PAYWALL_MARQUEE_IMAGES } from '../constants';
import { getTrialRemaining, isTrialUser } from '../utils/trialWarnings';
import { formatSubscriptionDate, getDisplayRenewalDate } from '../utils/subscriptionDates';
import styles from '../styles';

const DARK_BG = '#0B0F19';

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

  const isCanceling = !!subscription?.cancelAtPeriodEnd;

  const statusPill = (() => {
    if (isCanceling) {
      return { label: 'CANCELING', pill: styles.pwdStatusPillCancel, text: styles.pwdStatusPillTextCancel };
    }
    if (isTrial) {
      return { label: 'TRIAL', pill: styles.pwdStatusPillTrial, text: styles.pwdStatusPillTextTrial };
    }
    if (subscription) {
      return { label: 'ACTIVE', pill: styles.pwdStatusPillActive, text: styles.pwdStatusPillTextActive };
    }
    return null;
  })();

  // Reserve space at the bottom of the scroll for the pinned action bar.
  // Compact action bar: primary (~42) + ghost row (~34) + manage link (~22)
  // + gap (8*2) + paddingTop (10) + safe-area inset.
  const bottomBarReserve = (subscription ? 22 : 0) + 42 + 34 + 16 + 10 + Math.max(insets.bottom, BOTTOM_INSET_MIN);

  return (
    <View style={styles.pwdRoot}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      <View style={[styles.pwdFloatingCloseWrap, { top: insets.top + 4, right: 8 }]}>
        <PressScale onPress={onClose} style={styles.pwdCloseCircle} hitSlop={8}>
          <Feather name="x" size={20} color="#FFFFFF" />
        </PressScale>
      </View>

      <ScrollView
        style={styles.pwdScroll}
        contentContainerStyle={[
          styles.pwdScrollContent,
          { paddingTop: insets.top + 8, paddingBottom: bottomBarReserve + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pwdHeroWrap}>
          <PaywallStyleMarquee
            images={PAYWALL_MARQUEE_IMAGES}
            tileWidth={120}
            tileHeight={155}
            wrapHeight={170}
            gap={12}
          />
          <LinearGradient
            colors={['rgba(11,15,25,0)', DARK_BG]}
            style={styles.pwdHeroBottomScrim}
            pointerEvents="none"
          />
        </View>

        <Animated.View entering={FadeInDown.delay(0).duration(320)} style={styles.pwdHeadlineBlock}>
          <Text style={styles.pwdHeadline}>Unlock every style</Text>
          <Text style={styles.pwdSubhead}>
            More caricatures, every month. Cancel anytime.
          </Text>
        </Animated.View>

        {subscriptionLoading ? (
          <View style={[styles.pwdUsageCard, { alignItems: 'center', flexDirection: 'row', gap: 12 }]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.pwdUsageLine}>Loading…</Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.pwdUsageCard}>
            <View style={styles.pwdUsageTopRow}>
              <View style={styles.pwdUsageTitleBlock}>
                <Text style={styles.pwdUsagePlanName}>
                  {planName ? `${planName} plan` : 'Free trial'}
                </Text>
                <Text style={styles.pwdUsageLine}>
                  {isTrial
                    ? `${quotaInfo.remaining} of ${quotaInfo.limit} free caricatures left`
                    : `${quotaInfo.remaining} of ${quotaInfo.limit} left this month`}
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
              <View style={styles.pwdProgressTrack}>
                <View
                  style={[
                    styles.pwdProgressFill,
                    { width: `${Math.min(quotaInfo.percentage, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.pwdProgressNumbers}>
                {quotaInfo.current}/{quotaInfo.limit}
              </Text>
            </View>

            {isTrial && trialRemaining === 1 ? (
              <View style={styles.pwdFootnoteRow}>
                <Feather name="alert-circle" size={13} color="rgba(255,255,255,0.55)" />
                <Text style={styles.pwdFootnoteText}>1 caricature left on your trial</Text>
              </View>
            ) : null}

            {!isTrial && renewalLabel ? (
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

        <Animated.Text
          entering={FadeInDown.delay(120).duration(320)}
          style={styles.pwdSectionTitle}
        >
          Choose your plan
        </Animated.Text>

        {Object.entries(TIER_INFO).map(([tier, info], index) => {
          const isCurrent = subscription?.tier === tier;
          const isSelected = selectedTier === tier;
          const solidWhite = isSelected && !isCurrent;

          return (
            <Animated.View
              key={tier}
              entering={FadeInDown.delay(160 + index * 50).duration(280)}
            >
              <PressScale
                onPress={() => {
                  if (!isCurrent) setSelectedTier(tier);
                }}
                disabled={isCurrent}
                style={[
                  styles.pwdTierCard,
                  isCurrent && styles.pwdTierCardCurrent,
                  solidWhite && styles.pwdTierCardSelected,
                ]}
              >
                <View style={styles.pwdTierRow}>
                  <View style={styles.pwdTierLeft}>
                    <Text
                      style={[
                        styles.pwdTierName,
                        solidWhite && styles.pwdTierNameDark,
                      ]}
                    >
                      {info.name}
                    </Text>
                    {isCurrent ? (
                      <View style={styles.pwdTierBadgeCurrent}>
                        <Text style={styles.pwdTierBadgeCurrentText}>CURRENT</Text>
                      </View>
                    ) : info.popular ? (
                      <View
                        style={[
                          styles.pwdTierBadgePopular,
                          solidWhite && styles.pwdTierBadgePopularSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pwdTierBadgePopularText,
                            solidWhite && styles.pwdTierBadgePopularTextSelected,
                          ]}
                        >
                          BEST VALUE
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.pwdTierPriceBlock}>
                    <Text
                      style={[
                        styles.pwdTierPrice,
                        solidWhite && styles.pwdTierPriceDark,
                      ]}
                    >
                      {info.price}
                      <Text
                        style={[
                          styles.pwdTierPriceUnit,
                          solidWhite && styles.pwdTierPriceUnitDark,
                        ]}
                      >
                        /mo
                      </Text>
                    </Text>
                    {isCurrent ? (
                      <View style={[styles.pwdTierRadio, styles.pwdTierRadioCurrent]}>
                        <Feather name="check" size={11} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.pwdTierRadio,
                          isSelected && styles.pwdTierRadioSelected,
                        ]}
                      >
                        {isSelected ? <View style={styles.pwdTierRadioDot} /> : null}
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.pwdTierMeta,
                    solidWhite && styles.pwdTierMetaDark,
                  ]}
                >
                  {info.quota} caricatures · {info.perCaricature} each
                </Text>
              </PressScale>
            </Animated.View>
          );
        })}

        <Text style={styles.pwdLegalText}>
          Subscriptions renew monthly through {storeSubscriptionLabel}. Cancel auto-renew there anytime.
        </Text>
      </ScrollView>

      <View
        style={[
          styles.pwdBottomBar,
          { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
        ]}
      >
        <LinearGradient
          colors={['rgba(11,15,25,0)', DARK_BG]}
          style={styles.pwdBottomScrim}
          pointerEvents="none"
        />
        <PressScale
          onPress={() => onSubscribe(selectedTier)}
          disabled={!canSubscribe}
          style={[
            styles.pwdPrimaryButton,
            !canSubscribe && styles.pwdPrimaryButtonDisabled,
          ]}
        >
          <Text style={styles.pwdPrimaryButtonText}>{subscribeLabel}</Text>
        </PressScale>

        <View style={styles.pwdGhostRow}>
          <PressScale
            onPress={onRefreshSubscription}
            disabled={subscriptionLoading}
            style={styles.pwdGhostButton}
          >
            <Text style={styles.pwdGhostButtonText}>
              {subscriptionLoading ? 'Refreshing…' : 'Refresh'}
            </Text>
          </PressScale>
          <PressScale
            onPress={onRestorePurchases}
            disabled={subscribeLoading}
            style={styles.pwdGhostButton}
          >
            <Text style={styles.pwdGhostButtonText}>Restore</Text>
          </PressScale>
        </View>

        {subscription ? (
          <PressScale
            onPress={onManageSubscription}
            disabled={subscribeLoading}
            style={styles.pwdManageLink}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text
              style={[
                styles.pwdManageLinkText,
                isCanceling && styles.pwdManageLinkTextCancel,
              ]}
            >
              {isCanceling
                ? `Subscription canceling · manage in ${storeSubscriptionLabel}`
                : `Manage or cancel in ${storeSubscriptionLabel}`}
            </Text>
          </PressScale>
        ) : null}
      </View>
    </View>
  );
}
