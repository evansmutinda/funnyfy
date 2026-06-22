import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import PaywallStyleFade from '../components/PaywallStyleFade';
import { BOTTOM_INSET_MIN, PAYWALL_MARQUEE_IMAGES } from '../constants';
import { isTrialUser } from '../utils/trialWarnings';
import styles from '../styles';

const DARK_BG = '#0B0F19';

const TIER_INFO = {
  starter: {
    name: 'Starter',
    price: '$5',
    quota: 50,
    perCaricature: '~$0.10',
  },
  popular: {
    name: 'Popular',
    price: '$10',
    quota: 100,
    perCaricature: '~$0.10',
    popular: true,
  },
  pro: {
    name: 'Pro',
    price: '$25',
    quota: 250,
    perCaricature: '~$0.10',
  },
};

export default function SubscriptionScreen({
  subscriptionInfo,
  subscriptionLoading,
  onSubscribe,
  subscribeLoading,
  onManageSubscription,
  storeSubscriptionLabel = 'Google Play',
  onRestorePurchases,
  onOpenPrivacy,
  onOpenTerms,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const [selectedTier, setSelectedTier] = useState(null);

  const isTrial = isTrialUser(subscriptionInfo);
  const subscription = subscriptionInfo?.subscription;

  useEffect(() => {
    if (subscriptionLoading || selectedTier) return;
    if (isTrial) {
      setSelectedTier('popular');
    }
  }, [isTrial, subscriptionLoading, selectedTier]);

  const canSubscribe = !!selectedTier && !subscribeLoading;
  const isCanceling = !!subscription?.cancelAtPeriodEnd;
  const showManageLink = !isTrial && Boolean(subscription);

  const subscribeLabel = subscribeLoading
    ? 'Processing…'
    : selectedTier
      ? `Continue with ${TIER_INFO[selectedTier]?.name}`
      : subscription
        ? 'Select a plan to change'
        : 'Select a plan';

  return (
    <View style={styles.pwdRoot}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      <View style={[styles.pwdFloatingCloseWrap, styles.pwdFloatingCloseLeft, { top: insets.top + 4 }]}>
        <PressScale onPress={onClose} style={styles.pwdCloseCircle} hitSlop={8}>
          <Feather name="x" size={20} color="#FFFFFF" />
        </PressScale>
      </View>

      <View style={[styles.pwdBody, { paddingTop: insets.top + 4 }]}>
        <View style={styles.pwdHeroFadeZone}>
          <PaywallStyleFade
            images={PAYWALL_MARQUEE_IMAGES}
            style={StyleSheet.absoluteFill}
            imageStyle={styles.uploadBackgroundImage}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient
              colors={['rgba(11,15,25,0.78)', 'rgba(11,15,25,0)']}
              style={styles.pwdHeroTopScrim}
            />
            <LinearGradient
              colors={['rgba(11,15,25,0)', 'rgba(11,15,25,0.95)']}
              style={styles.pwdHeroBottomScrim}
            />
          </View>
          <View style={styles.pwdHeroFadeContent}>
            <Text style={styles.pwdBrandMarkCompact}>FunnyFy</Text>
            <Text style={styles.pwdBrandTierCompact}>Premium</Text>
            <Text style={styles.pwdBenefitsInline}>
              Unlock all styles · More caricatures · Save & share
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.pwdBottomBar,
          styles.pwdBottomBarCompact,
          { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 6 },
        ]}
      >
        <View style={styles.pwdPlansBottom}>
          {Object.entries(TIER_INFO).map(([tier, info]) => {
            const isCurrent = subscription?.tier === tier;
            const isSelected = selectedTier === tier;
            const solidWhite = isSelected && !isCurrent;

            return (
              <PressScale
                key={tier}
                onPress={() => {
                  if (!isCurrent) setSelectedTier(tier);
                }}
                disabled={isCurrent}
                style={[
                  styles.pwdTierCard,
                  styles.pwdTierCardCompact,
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
                          solidWhite && styles.pwdTierRadioSelectedOnWhite,
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
                    styles.pwdTierMetaCompact,
                    solidWhite && styles.pwdTierMetaDark,
                  ]}
                >
                  {info.quota} caricatures · {info.perCaricature} each
                </Text>
              </PressScale>
            );
          })}
        </View>

        {!showManageLink ? (
          <Text style={styles.pwdFooterHint}>Cancel anytime.</Text>
        ) : (
          <PressScale
            onPress={onManageSubscription}
            disabled={subscribeLoading}
            style={styles.pwdManageLink}
            hitSlop={{ top: 6, bottom: 6, left: 16, right: 16 }}
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
        )}
        <PressScale
          onPress={() => onSubscribe(selectedTier)}
          disabled={!canSubscribe}
          style={[
            styles.pwdPrimaryButton,
            styles.pwdPrimaryButtonCompact,
            !canSubscribe && styles.pwdPrimaryButtonDisabled,
          ]}
        >
          <Text style={styles.pwdPrimaryButtonText}>{subscribeLabel}</Text>
        </PressScale>

        <View style={styles.pwdFooterLinksRow}>
          <View style={styles.pwdFooterLinksSlot}>
            {onOpenPrivacy ? (
              <PressScale onPress={onOpenPrivacy} hitSlop={8} style={styles.pwdFooterLinkPress}>
                <Text style={styles.pwdFooterLink}>Privacy</Text>
              </PressScale>
            ) : null}
          </View>
          <View style={styles.pwdFooterLinksSlot}>
            {onOpenTerms ? (
              <PressScale onPress={onOpenTerms} hitSlop={8} style={styles.pwdFooterLinkPress}>
                <Text style={styles.pwdFooterLink}>Terms</Text>
              </PressScale>
            ) : null}
          </View>
          <View style={styles.pwdFooterLinksSlot}>
            <PressScale
              onPress={onRestorePurchases}
              disabled={subscribeLoading}
              hitSlop={8}
              style={styles.pwdFooterLinkPress}
            >
              <Text style={[styles.pwdFooterLink, styles.pwdFooterLinkRestore]} numberOfLines={2}>
                Restore purchases
              </Text>
            </PressScale>
          </View>
        </View>
      </View>
    </View>
  );
}
