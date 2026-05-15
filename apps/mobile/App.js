import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  BackHandler,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { initRevenueCat, getOfferings, purchasePackage, restorePurchases, getCustomerInfo, getAppUserId, hasRevenueCatKey } from './services/revenuecat';
import { initAuth, resetAuthIfLocal } from './services/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://funnyfyapp.vercel.app';

// Placeholder content for info screens — replace with your actual legal text
const PRIVACY_POLICY_TEXT = `Last updated: ${new Date().toLocaleDateString()}

This is a placeholder Privacy Policy for FunnyFy. Replace this text with your actual privacy policy before publishing to the Play Store.

What we collect
When you use FunnyFy, we collect the photos you upload for caricature generation, your subscription status, and anonymous usage information.

How we use it
Uploaded photos are processed by our AI partner to generate your caricature. We do not sell your data to third parties.

Your rights
You can request deletion of your data at any time by contacting support.

Contact
For any privacy concerns, please contact us at support@funnyfy.app.`;

const TERMS_TEXT = `Last updated: ${new Date().toLocaleDateString()}

This is a placeholder Terms & Conditions document for FunnyFy. Replace this with your actual terms before publishing to the Play Store.

Acceptance
By using FunnyFy, you agree to these terms.

Usage
FunnyFy is provided as-is for personal, non-commercial use. You retain ownership of photos you upload and the caricatures generated from them.

Subscriptions
Subscriptions auto-renew monthly unless canceled. You can cancel anytime through your Google Play account.

Limitations
We are not liable for any indirect or consequential damages arising from your use of the app.

Contact
For any questions about these terms, please contact us at support@funnyfy.app.`;

const ABOUT_TEXT = `FunnyFy

Transform your photos into amazing caricatures with the power of AI. Pick a style, upload a photo, and watch the magic happen.

Version 1.0.1

Made with care.`;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_INSET_MIN = Platform.OS === 'android' ? 48 : 34;

function getSavedImageFileName() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `Funnyfy-${y}-${m}-${day}_${h}${min}${s}.jpg`;
}

// Style preview images used for pictorial style cards
const STYLE_CARD_IMAGE_DEFAULT = require('./assets/toon.jpg');
const STYLE_CARD_IMAGE_CHIBI = require('./assets/chibi.jpg');
const STYLE_CARD_IMAGE_NEON = require('./assets/neon.png');
const STYLE_CARD_IMAGE_ANIME = require('./assets/anime.jpg');
const STYLE_CARD_IMAGE_CUSTOM1 = require('./assets/custom1.jpg');
const STYLE_CARD_IMAGE_CUSTOM2 = require('./assets/custom2.jpg');
const STYLE_CARD_IMAGE_NEANDC = require('./assets/neandc.jpeg');
const STYLE_CARD_IMAGE_NEAND3D = require('./assets/neand3d.jpeg');
const STYLE_CARD_IMAGE_HANDD = require('./assets/handd.jpeg');
const STYLE_CARD_IMAGE_SUPERHERO = require('./assets/superhero.jpeg');
const STYLE_CARD_IMAGE_VILLIAN = require('./assets/villian.jpeg');
const STYLE_CARD_IMAGE_CYBORG = require('./assets/cyborg.jpeg');
const STYLE_CARD_IMAGE_3DCLAY = require('./assets/3dclay.jpg');
const STYLE_CARD_IMAGE_OILPAINT = require('./assets/oilpaint.jpg');
const STYLE_CARD_IMAGE_LOWPOLY = require('./assets/lowpoly.jpg');
const STYLE_CARD_IMAGE_WC = require('./assets/wc.jpg');
const STYLE_CARD_IMAGE_PXL = require('./assets/pxl.jpg');
const STYLE_CARD_IMAGE_FUNKO = require('./assets/funko.jpg');

function getStyleImage(style) {
  if (!style) return STYLE_CARD_IMAGE_DEFAULT;
  const label = (style.label || '').toLowerCase();
  const id = (style.id || '').toLowerCase();

  if (id === 'chibi' || label.includes('chibi')) return STYLE_CARD_IMAGE_CHIBI;
  if (id === 'neon' || label.includes('neon')) return STYLE_CARD_IMAGE_NEON;
  if (id === 'anime' || label.includes('anime')) return STYLE_CARD_IMAGE_ANIME;
  if (id === 'custom1' || label.includes('custom1')) return STYLE_CARD_IMAGE_CUSTOM1;
  if (id === 'custom2' || label.includes('custom2')) return STYLE_CARD_IMAGE_CUSTOM2;
  if (id === 'neandc' || (label.includes('neanderthal') && !label.includes('3d'))) return STYLE_CARD_IMAGE_NEANDC;
  if (id === 'neand3d' || label.includes('neanderthal 3d') || label.includes('neand3d')) return STYLE_CARD_IMAGE_NEAND3D;
  if (id === 'handd' || label.includes('hand-drawn') || label.includes('handd')) return STYLE_CARD_IMAGE_HANDD;
  if (id === 'superhero' || label.includes('superhero')) return STYLE_CARD_IMAGE_SUPERHERO;
  if (id === 'villian' || label.includes('villain') || label.includes('villian')) return STYLE_CARD_IMAGE_VILLIAN;
  if (id === 'cyborg' || label.includes('cyborg')) return STYLE_CARD_IMAGE_CYBORG;
  if (id === '3dclay' || label.includes('3dclay') || label.includes('3d clay')) return STYLE_CARD_IMAGE_3DCLAY;
  if (id === 'oil-paint' || label.includes('oil paint') || label.includes('oilpaint')) return STYLE_CARD_IMAGE_OILPAINT;
  if (id === 'low-poly' || label.includes('low-poly') || label.includes('lowpoly')) return STYLE_CARD_IMAGE_LOWPOLY;
  if (id === 'water-color' || label.includes('water color') || label.includes('watercolor')) return STYLE_CARD_IMAGE_WC;
  if (id === 'pixar-like' || label.includes('pixar-like') || label.includes('pixar')) return STYLE_CARD_IMAGE_PXL;
  if (id === 'funko-pop' || label.includes('funko pop') || label.includes('funko')) return STYLE_CARD_IMAGE_FUNKO;

  return STYLE_CARD_IMAGE_DEFAULT;
}

// Default style (fallback if server is unavailable)
const STYLE_90S_CARTOON = {
  id: '90s-cartoon',
  label: '90s Cartoon',
  description: 'Classic 90s animated cartoon style'
};

function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SafeAreaView style={[styles.safe, styles.splashSafe]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/icon.jpg')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}

// Bottom-sheet menu shown when burger is tapped
function MenuModal({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const items = [
    { id: 'subscription', label: 'Subscriptions' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'about', label: 'About' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.menuBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.menuHandle} />
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Reusable screen for Privacy, Terms, About
function InfoScreen({ title, content, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={styles.infoContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.infoContent, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.infoText}>{content}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StyleScreen({
  selectedStyle,
  availableStyles,
  onNext,
  onOpenMenu,
}) {
  const insets = useSafeAreaInsets();
  const styleList = Array.isArray(availableStyles) && availableStyles.length > 0
    ? availableStyles
    : [STYLE_90S_CARTOON];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <ScrollView 
        contentContainerStyle={styles.styleContainer}
        style={{ flex: 1 }}
      >
        <View style={styles.headerBar}>
          <Text style={styles.wordmark}>FunnyFy</Text>
          <TouchableOpacity onPress={onOpenMenu} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.styleGrid, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
          {styleList.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.card,
                styles.styleCard,
                selectedStyle?.id === s.id && styles.styleCardSelected
              ]}
              activeOpacity={0.9}
              onPress={() => onNext(s)}
            >
              <View style={styles.styleImageWrapper}>
                <Image source={getStyleImage(s)} style={styles.styleImage} />
              </View>
              <View style={styles.styleCardLabel}>
                <Text style={styles.styleCardName} numberOfLines={1}>{s.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: Math.max(insets.bottom, BOTTOM_INSET_MIN) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function UploadScreen({ style, onStart, onBackToStyle, canGenerateMore, subscriptionInfo, onSubscribe }) {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [picking, setPicking] = useState(false);
  const [pickingSource, setPickingSource] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: () => setError('') }]);
    }
  }, [error]);

  // Calculate quota percentage for progress bar
  const getQuotaInfo = () => {
    if (!subscriptionInfo || !subscriptionInfo.usage) {
      return { current: 0, limit: 3, percentage: 0, isLow: false, isExceeded: false };
    }
    const { current, limit } = subscriptionInfo.usage;
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const isLow = percentage >= 80 && percentage < 100;
    const isExceeded = percentage >= 100;
    return { current, limit, percentage, isLow, isExceeded };
  };

  const quotaInfo = getQuotaInfo();

  const pickImage = async (useCamera = false, withCrop = false) => {
    if (picking) return;

    setPicking(true);
    setPickingSource(useCamera ? 'camera' : 'gallery');
    setError('');

    try {
      let result;

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: withCrop,
          quality: 0.9,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Photo library permission is required to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: withCrop,
          quality: 0.9,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);

        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          setImageDataUrl(dataUrl);
        } catch (fsErr) {
          console.error('Failed to read image file:', fsErr);
          setError('Failed to read image file.');
        }
      }
    } catch (err) {
      console.error('Image pick error:', err);
      setError('Failed to pick image.');
    } finally {
      setPicking(false);
      setPickingSource(null);
    }
  };

  const quotaOk = canGenerateMore !== false;
  const canGenerate = !!imageUri && !picking && quotaOk;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.uploadContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBackToStyle} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          {subscriptionInfo && (
            <View style={styles.headerPill}>
              <View style={styles.headerPillProgress}>
                <View style={[styles.headerPillProgressFill, { width: `${Math.min(quotaInfo.percentage, 100)}%` }]} />
              </View>
              <Text style={styles.headerPillText}>
                {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                  ? `Trial · ${quotaInfo.current}/${quotaInfo.limit}`
                  : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} · ${quotaInfo.current}/${quotaInfo.limit}`}
              </Text>
            </View>
          )}
          <View style={{ width: 36 }} />
        </View>

        {quotaInfo.isExceeded && (
          <TouchableOpacity onPress={onSubscribe} style={styles.quotaExceededBanner}>
            <Text style={styles.quotaExceededBannerText}>Quota reached — tap to upgrade</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.uploadImageContainer}
          onPress={() => !imageUri && !picking && pickImage(false)}
          activeOpacity={imageUri ? 1 : 0.8}
          disabled={picking}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.cropChip}
                onPress={() => pickImage(false, true)}
                disabled={picking}
              >
                <Text style={styles.cropChipText}>Crop</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoPlaceholderIcon}>
                <Text style={styles.photoPlaceholderIconText}>+</Text>
              </View>
              <Text style={styles.photoPlaceholderTitle}>Add a photo</Text>
              <Text style={styles.photoPlaceholderHint}>Tap to choose</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.uploadButtonsContainer}>
          <View style={styles.uploadSourceRow}>
            <TouchableOpacity
              style={[styles.slimButton, picking && styles.buttonDisabled]}
              onPress={() => pickImage(true)}
              disabled={picking}
            >
              <Text style={styles.slimButtonText}>
                {picking && pickingSource === 'camera' ? 'Opening…' : 'Camera'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.slimButton, picking && styles.buttonDisabled]}
              onPress={() => pickImage(false)}
              disabled={picking}
            >
              <Text style={styles.slimButtonText}>
                {picking && pickingSource === 'gallery' ? 'Opening…' : 'Gallery'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!canGenerate || picking) && styles.buttonDisabled]}
            onPress={() => {
              if (!quotaOk && onSubscribe) {
                Alert.alert(
                  'Quota Exceeded',
                  `You've used all ${quotaInfo.limit} caricatures this month. Upgrade your plan to continue generating amazing caricatures!`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: onSubscribe }
                  ]
                );
              } else {
                onStart({ imageUri, imageDataUrl });
              }
            }}
            disabled={!canGenerate || picking}
          >
            <Text style={styles.primaryButtonText}>
              {quotaOk ? 'Generate caricature' : 'Upgrade to continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SubscriptionScreen({
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
    starter: { name: 'Starter', price: '$5', quota: 50, perks: 'Standard speed' },
    popular: { name: 'Popular', price: '$10', quota: 100, perks: 'Priority speed' },
    pro: { name: 'Pro', price: '$25', quota: 250, perks: 'Fastest · HD downloads' },
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
          {/* Current plan card — compact */}
          {subscriptionLoading ? (
            <View style={styles.paywallPlanCard}>
              <ActivityIndicator size="small" color="#4F46E5" />
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

          {/* Tier selection */}
          <Text style={styles.paywallSectionTitle}>Choose your plan</Text>
          {Object.entries(TIER_INFO).map(([tier, info]) => {
            const isCurrent = subscription?.tier === tier;
            const isSelected = selectedTier === tier;
            const isPopular = tier === 'popular';
            const isPro = tier === 'pro';

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
                    ) : isPopular ? (
                      <View style={styles.paywallTierBadgePopular}>
                        <Text style={styles.paywallTierBadgePopularText}>MOST POPULAR</Text>
                      </View>
                    ) : isPro ? (
                      <View style={styles.paywallTierBadgeNeutral}>
                        <Text style={styles.paywallTierBadgeNeutralText}>BEST VALUE</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.paywallTierPrice}>
                    {info.price}<Text style={styles.paywallTierPriceUnit}>/mo</Text>
                  </Text>
                </View>
                <Text style={styles.paywallTierDesc}>
                  {info.quota} caricatures · {info.perks}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom actions */}
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
              style={[styles.slimButton, subscriptionLoading && styles.buttonDisabled]}
              onPress={onRefreshSubscription}
              disabled={subscriptionLoading}
            >
              <Text style={styles.slimButtonText}>
                {subscriptionLoading ? 'Refreshing…' : 'Refresh'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.slimButton, subscribeLoading && styles.buttonDisabled]}
              onPress={onRestorePurchases}
              disabled={subscribeLoading}
            >
              <Text style={styles.slimButtonText}>Restore</Text>
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

function ResultScreen({ original, result, loading, error, failedAttempts = 0, onRetry, onBack, onHome, subscriptionInfo, backHandlerRef }) {
  const insets = useSafeAreaInsets();
  const imageUrl = result ? getImageUrlFromOutput(result.output) : null;
  const [mix, setMix] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const hasResult = !!result && !!imageUrl;
  const maxRetriesReached = error && failedAttempts >= 3;
  const processingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) {
      processingOpacity.setValue(1);
      return;
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(processingOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(processingOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [loading, processingOpacity]);

  const resultQuotaCurrent = subscriptionInfo?.usage?.current ?? 0;
  const resultQuotaLimit = subscriptionInfo?.usage?.limit ?? 3;
  const resultQuotaPct = resultQuotaLimit > 0 ? Math.min(100, (resultQuotaCurrent / resultQuotaLimit) * 100) : 0;

  useEffect(() => {
    if (hasResult) {
      setMix(0);
      setHasBeenSaved(false);
    }
  }, [hasResult]);

  const handleShare = async () => {
    if (!imageUrl || loading) return;
    try {
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.documentDirectory + fileName;

      const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);

      if (Platform.OS === 'android') {
        const downloadsPath = 'file:///storage/emulated/0/Download/' + fileName;
        try {
          await FileSystem.copyAsync({ from: resultDl.uri, to: downloadsPath });
        } catch {
          try {
            await MediaLibrary.saveToLibraryAsync(resultDl.uri);
          } catch {
            // Continue to share even if save fails
          }
        }
      } else {
        try {
          await MediaLibrary.saveToLibraryAsync(resultDl.uri);
        } catch {
          // Continue to share even if save fails
        }
      }

      await Sharing.shareAsync(resultDl.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Check out my caricature!',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDownload = async (opts = {}) => {
    const { silent = false } = opts;
    if (!imageUrl || loading) return false;
    try {
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.documentDirectory + fileName;

      const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);

      let saved = false;
      let savedPath = '';

      if (Platform.OS === 'android') {
        const downloadsPath = 'file:///storage/emulated/0/Download/' + fileName;
        try {
          await FileSystem.copyAsync({ from: resultDl.uri, to: downloadsPath });
          saved = true;
          savedPath = '/storage/emulated/0/Download/' + fileName;
        } catch {
          try {
            await MediaLibrary.saveToLibraryAsync(resultDl.uri);
            saved = true;
            savedPath = 'Gallery';
          } catch {
            await Sharing.shareAsync(resultDl.uri, {
              mimeType: 'image/jpeg',
              dialogTitle: 'Save image',
            });
          }
        }
      } else {
        try {
          await MediaLibrary.saveToLibraryAsync(resultDl.uri);
          saved = true;
          savedPath = 'Photos';
        } catch (mlErr) {
          await Sharing.shareAsync(resultDl.uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Save image',
          });
        }
      }

      if (saved) {
        setHasBeenSaved(true);
        if (!silent) {
          Alert.alert('Image Saved', `Saved successfully!\n\nLocation: ${savedPath}`);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Download/save error:', err);
      return false;
    }
  };

  const confirmNavigate = useCallback((navigate) => {
    if (hasResult && !hasBeenSaved) {
      Alert.alert(
        'Save before leaving?',
        'Do you want to save this caricature before going back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: navigate },
          {
            text: 'Save',
            onPress: async () => {
              const didSave = await handleDownload({ silent: true });
              if (didSave) navigate();
            },
          },
        ]
      );
    } else {
      navigate();
    }
  }, [hasResult, hasBeenSaved]);

  useEffect(() => {
    if (!backHandlerRef) return;
    backHandlerRef.current = () => confirmNavigate(onBack);
    return () => { backHandlerRef.current = null; };
  }, [backHandlerRef, confirmNavigate, onBack]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderMove: (evt) => {
          if (canvasWidth > 0) {
            const newMix = Math.max(0, Math.min(1, evt.nativeEvent.locationX / canvasWidth));
            setMix(newMix);
          }
        },
      }),
    [canvasWidth]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.resultContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => confirmNavigate(onBack)} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          {subscriptionInfo && (
            <View style={styles.headerPill}>
              <View style={styles.headerPillProgress}>
                <View style={[styles.headerPillProgressFill, { width: `${resultQuotaPct}%` }]} />
              </View>
              <Text style={styles.headerPillText}>
                {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                  ? `Trial · ${resultQuotaCurrent}/${resultQuotaLimit}`
                  : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} · ${resultQuotaCurrent}/${resultQuotaLimit}`}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => confirmNavigate(onHome)} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>⌂</Text>
          </TouchableOpacity>
        </View>

        {original?.imageUri ? (
          <View style={styles.previewContainer}>
            <View
              style={styles.previewCanvas}
              onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
              ) : null}
              {original?.imageUri ? (
                <View style={[styles.afterMask, { width: `${mix * 100}%` }]}>
                  <Image source={{ uri: original.imageUri }} style={styles.previewImage} resizeMode="cover" />
                </View>
              ) : null}
              {/* Visible slider handle (like the example) */}
              {canvasWidth > 0 && (
                <View pointerEvents="none" style={styles.sliderHandleContainer}>
                  <View
                    style={[
                      styles.sliderLine,
                      { left: canvasWidth * mix - 1 }, // center vertical divider
                    ]}
                  />
                  <View
                    style={[
                      styles.sliderKnob,
                      { left: canvasWidth * mix - 16 }, // knob centered on line
                    ]}
                  >
                    <Text style={styles.sliderKnobText}>{'↔'}</Text>
                  </View>
                </View>
              )}
              <View style={styles.previewOverlay} {...panResponder.panHandlers} />
            </View>
            {hasResult ? (
              <>
                <Text style={styles.sectionLabel}>Drag to compare before & after</Text>
              </>
            ) : null}
            
            <View style={styles.bottomActionsContainer}>
              {loading ? (
                <View style={styles.progressContainer}>
                  <Animated.Text style={[styles.progressLabel, { opacity: processingOpacity }]}>Processing…</Animated.Text>
                </View>
              ) : maxRetriesReached ? (
                <View style={styles.errorRetryContainer}>
                  <Text style={styles.errorRetryTitle}>Please try again later</Text>
                  <Text style={styles.errorRetrySubtext}>
                    Failed generations are not billed. Your usage counter is unchanged.
                  </Text>
                  <TouchableOpacity onPress={onBack} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Choose another photo</Text>
                  </TouchableOpacity>
                </View>
              ) : error ? (
                <View style={styles.errorRetryContainer}>
                  <Text style={styles.errorRetryMessage}>{error}</Text>
                  <Text style={styles.errorRetryHint}>
                    Attempt {failedAttempts + 1} of 3
                  </Text>
                  <TouchableOpacity
                    onPress={onRetry}
                    style={styles.retryButton}
                    disabled={loading}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.slimButton, { flex: 1 }, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleDownload}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.slimButtonText} numberOfLines={1}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleShare}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.primaryButtonText} numberOfLines={1}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function getImageUrlFromOutput(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) {
    return typeof output[0] === 'string' ? output[0] : output[0]?.url || null;
  }
  return output.url || null;
}

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [style, setStyle] = useState(null);
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState(null);
  const [job, setJob] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [hasRcKey, setHasRcKey] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const userIdRef = useRef(null);
  const authTokenRef = useRef(null);
  const resultBackHandlerRef = useRef(null);

  // Keep refs in sync so async functions always use the latest values
  useEffect(() => {
    userIdRef.current = userId;
    authTokenRef.current = authToken;
  }, [userId, authToken]);

  // Build API headers — always call this inside fetch calls
  const getApiHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': userIdRef.current || '',
    ...(authTokenRef.current ? { Authorization: `Bearer ${authTokenRef.current}` } : {}),
  });

  useEffect(() => {
    const initialize = async () => {
      // Initialize RevenueCat
      const hasKey = hasRevenueCatKey();
      setHasRcKey(hasKey);

      let rcUserId = null;
      if (hasKey) {
        try {
          await initRevenueCat(null); // RC generates its own anonymous ID
          rcUserId = await getAppUserId();
          console.log('[RevenueCat] Initialized, appUserId:', rcUserId);
        } catch (err) {
          console.error('[RevenueCat] init error:', err);
        }
      } else {
        console.warn('[RevenueCat] Missing SDK key, skipping init');
      }

      // Initialize auth — gets or creates a real user in the database
      // First clear any local fallback ID from previous failed attempts
      await resetAuthIfLocal();
      try {
        const auth = await initAuth(API_BASE, rcUserId);
        setUserId(auth.userId);
        setAuthToken(auth.token);
        userIdRef.current = auth.userId;
        authTokenRef.current = auth.token;
        if (auth.isLocal) {
          console.warn('[Auth] Running with local ID — backend unavailable. Check DATABASE_URL in Vercel.');
        }
      } catch (err) {
        console.error('[Auth] init error:', err);
      }

      setAuthReady(true);
    };

    initialize();
  }, []);

  const refreshSubscription = async (retryCount = 0) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return; // Not authenticated yet
    setSubscriptionLoading(true);
    const maxRetries = 2;
    
    try {
      if (hasRevenueCatKey()) {
        try {
          const customerInfo = await getCustomerInfo();
          const activeEntitlements = customerInfo?.entitlements?.active || {};
          const activeEnt = Object.values(activeEntitlements)[0];
          if (activeEnt?.productIdentifier && activeEnt?.expirationDate) {
            await fetch(`${API_BASE}/api/sync-subscription`, {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({
                userId: currentUserId,
                productId: activeEnt.productIdentifier,
                tier: activeEnt.productIdentifier.includes('starter') ? 'starter' :
                      activeEnt.productIdentifier.includes('popular') ? 'popular' :
                      activeEnt.productIdentifier.includes('pro') ? 'pro' : 'starter',
                expirationDate: activeEnt.expirationDate,
                platform: Platform.OS,
              }),
            });
          }
        } catch (syncErr) {
          console.warn('[subscription] Pre-refresh sync failed (non-fatal):', syncErr);
        }
      }

      const res = await fetch(`${API_BASE}/api/user/subscription?userId=${encodeURIComponent(currentUserId)}`, {
        method: 'GET',
        headers: getApiHeaders(),
      });
      const text = await res.text();
      console.log('[subscription] response:', text);
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.error('[subscription] invalid JSON');
        // Retry on parse error
        if (retryCount < maxRetries) {
          setTimeout(() => refreshSubscription(retryCount + 1), 1000);
          return;
        }
        return;
      }
      if (!res.ok || !json.ok) {
        console.warn('[subscription] non-ok response:', json);
        // Retry on error response
        if (retryCount < maxRetries && res.status >= 500) {
          setTimeout(() => refreshSubscription(retryCount + 1), 1000);
          return;
        }
        // Don't clear subscription info on client errors (keep last known state)
        if (res.status >= 500) {
          setSubscriptionInfo(null);
        }
        return;
      }
      setSubscriptionInfo(json);
    } catch (err) {
      console.error('[subscription] error:', err);
      // Retry on network errors
      if (retryCount < maxRetries) {
        setTimeout(() => refreshSubscription(retryCount + 1), 1000);
        return;
      }
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/styles`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.styles) && data.styles.length > 0) {
          const serverStyles = data.styles.map((s) => ({
            id: s.id,
            label: s.label,
            description: s.description,
          }));
          setAvailableStyles(serverStyles);
        } else {
          throw new Error('No styles returned');
        }
      } catch (err) {
        console.error('Failed to fetch styles from server, using default:', err);
        setAvailableStyles([STYLE_90S_CARTOON]);
      }
    };

    fetchStyles();
  }, []);

  // Refresh subscription once auth is ready
  useEffect(() => {
    if (authReady) {
      refreshSubscription();
    }
  }, [authReady]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && authReady) {
        console.log('[App] App came to foreground, refreshing subscription...');
        refreshSubscription();
      }
    });
    return () => { subscription.remove(); };
  }, [authReady]);

  useEffect(() => {
    // Polling has been moved server-side; frontend just waits for final result
  }, []);

  const callApi = useMemo(
    () =>
      async ({ imageDataUrl }) => {
        setLoading(true);
        setError('');
        setJob(null);
        setResult(null);

        const payload = {
          userId: userIdRef.current,
          payload: {
            styleId: style.id,
            imageUrl: imageDataUrl || null,
          },
        };

        try {
          const res = await fetch(`${API_BASE}/api/test`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(payload),
          });

          const text = await res.text();
          console.log('Result call - response text:', text);

          let json = null;
          try {
            json = JSON.parse(text);
          } catch (parseErr) {
            console.error('Result call - JSON parse error:', parseErr);
            setError('Server returned invalid response. Please try again.');
            setFailedAttempts((prev) => prev + 1);
            return;
          }

          if (!res.ok || !json.ok) {
            const msg =
              json?.message ||
              json?.error?.error ||
              json?.error ||
              json?.detail ||
              `Request failed with status ${res.status}`;
            throw new Error(String(msg));
          }

          // Backend now returns a fully-polled prediction; use it directly
          setResult(json.data);
          setFailedAttempts(0);
          
          // Auto-refresh subscription after successful generation
          setTimeout(async () => {
            console.log('[App] Auto-refreshing subscription after generation...');
            await refreshSubscription();
          }, 500);
        } catch (err) {
          console.error('API error:', err);
          const errorMessage = err.message || String(err);
          let userMessage = 'Network or server error';

          if (
            errorMessage.includes('Network request failed') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('network') ||
            (err.name === 'TypeError' && errorMessage.includes('fetch'))
          ) {
            userMessage =
              'Network connection failed. Please check your internet connection and try again.';
          } else if (errorMessage.toLowerCase().includes('timeout')) {
            userMessage = 'Request timed out. Please try again.';
          } else if (
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.toLowerCase().includes('connection refused')
          ) {
            userMessage = 'Cannot connect to server. Please try again later.';
          } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
            userMessage = 'Service not found. Please try again later.';
          } else if (
            errorMessage.includes('500') ||
            errorMessage.toLowerCase().includes('internal server error')
          ) {
            userMessage = 'Server error. Please try again later.';
          } else if (errorMessage && !errorMessage.includes('Network')) {
            userMessage = errorMessage;
          }

          setError(userMessage);
          setFailedAttempts((prev) => prev + 1);
        } finally {
          setLoading(false);
        }
      },
    [style]
  );

  const handleSubscribe = async (selectedTier = null) => {
    setSubscribeLoading(true);
    setError('');
    try {
      if (!hasRcKey) {
        Alert.alert('Subscriptions', 'RevenueCat SDK key is missing. Please set EXPO_PUBLIC_REVENUECAT_* env vars.');
        setSubscribeLoading(false);
        return;
      }

      console.log('[RevenueCat] Fetching offerings...');
      const pkgs = await getOfferings();
      
      if (!pkgs || pkgs.length === 0) {
        Alert.alert('Subscriptions', 'No subscription packages available yet. Please check your RevenueCat configuration.');
        setSubscribeLoading(false);
        return;
      }

      console.log(`[RevenueCat] Found ${pkgs.length} package(s):`, pkgs.map(p => ({
        identifier: p.identifier,
        product: p.product?.identifier,
        price: p.product?.priceString
      })));

      // Match the package to the tier the user tapped
      const selected = selectedTier
        ? (pkgs.find(p =>
            p.product?.identifier?.toLowerCase().includes(selectedTier.toLowerCase()) ||
            p.identifier?.toLowerCase().includes(selectedTier.toLowerCase())
          ) || pkgs[0])
        : pkgs[0];
      const packageInfo = selected.product;
      const priceString = packageInfo?.priceString || 'N/A';
      const packageId = packageInfo?.identifier || selected.identifier;

      console.log(`[RevenueCat] Purchasing package: ${packageId} (${priceString})`);

      // Attempt purchase
      const purchaseResult = await purchasePackage(selected);
      
      console.log('[RevenueCat] Purchase result:', {
        customerInfo: purchaseResult?.customerInfo,
        productIdentifier: purchaseResult?.productIdentifier
      });

      // Check if purchase was successful
      if (purchaseResult?.customerInfo) {
        const customerInfo = purchaseResult.customerInfo;
        const activeEntitlements = customerInfo.entitlements?.active || {};
        const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;
        const productIdentifier = purchaseResult.productIdentifier || customerInfo.allPurchasedProductIdentifiers?.[0];

        if (hasActiveSubscription && productIdentifier) {
          console.log('[RevenueCat] Purchase successful, active entitlements:', Object.keys(activeEntitlements));
          
          // Get expiration date (period end = next renewal) from active entitlement - NOT latestExpirationDate which can be wrong
          const activeEnt = Object.values(activeEntitlements).find(e => e.productIdentifier === productIdentifier)
            || Object.values(activeEntitlements)[0];
          const expirationDate = activeEnt?.expirationDate
            || customerInfo.allExpirationDates?.[productIdentifier];

          // Manually sync subscription to backend (in case webhook is delayed or not configured)
          try {
            console.log('[RevenueCat] Syncing subscription to backend...');
            const syncResponse = await fetch(`${API_BASE}/api/sync-subscription`, {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({
                userId: userIdRef.current,
                productId: productIdentifier,
                tier: productIdentifier.includes('starter') ? 'starter' : 
                      productIdentifier.includes('popular') ? 'popular' : 
                      productIdentifier.includes('pro') ? 'pro' : 'starter',
                expirationDate: expirationDate,
                platform: Platform.OS,
              }),
            });

            const syncResult = await syncResponse.json();
            if (syncResult.ok) {
              console.log('[RevenueCat] Subscription synced successfully:', syncResult.subscription);
            } else {
              console.warn('[RevenueCat] Sync failed:', syncResult.error);
            }
          } catch (syncErr) {
            console.error('[RevenueCat] Sync error (non-fatal):', syncErr);
            // Don't block the user - webhook might still work
          }

          Alert.alert(
            'Purchase Successful! 🎉',
            `Your subscription is now active. Your plan will update in a moment.`,
            [{ text: 'OK' }]
          );

          // Refresh subscription immediately (sync should have updated it)
          setTimeout(async () => {
            console.log('[RevenueCat] Refreshing subscription after purchase...');
            await refreshSubscription();
          }, 1000);
        } else {
          console.warn('[RevenueCat] Purchase completed but no active entitlements found');
          Alert.alert(
            'Purchase Completed',
            'Your purchase was processed, but no active subscription was found. Please wait a moment and refresh, or contact support if this persists.',
            [{ text: 'OK' }]
          );
          // Still try to refresh
          setTimeout(async () => {
            await refreshSubscription();
          }, 3000);
        }
      } else {
        console.warn('[RevenueCat] Purchase result missing customerInfo');
        Alert.alert(
          'Purchase Processing',
          'Your purchase is being processed. Please wait a moment and refresh your subscription status.',
          [{ text: 'OK' }]
        );
        setTimeout(async () => {
          await refreshSubscription();
        }, 3000);
      }
    } catch (err) {
      console.error('[RevenueCat] Purchase error:', err);
      
      // Better error messages based on error type
      let errorMessage = 'Purchase failed or was cancelled.';
      if (err?.userCancelled) {
        errorMessage = 'Purchase was cancelled.';
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.code) {
        errorMessage = `Purchase error: ${err.code}`;
      }

      Alert.alert('Purchase Failed', errorMessage);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!hasRcKey) {
      Alert.alert('Restore Purchases', 'RevenueCat is not configured.');
      return;
    }
    setSubscribeLoading(true);
    try {
      const customerInfo = await restorePurchases();
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      if (Object.keys(activeEntitlements).length > 0) {
        Alert.alert('Restored!', 'Your previous purchase has been restored.', [{ text: 'OK' }]);
        setTimeout(() => refreshSubscription(), 1000);
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (err) {
      console.error('[RevenueCat] Restore error:', err);
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? Your subscription will remain active until the end of the current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setSubscribeLoading(true);
            try {
              // Call backend to mark subscription for cancellation
              const res = await fetch(`${API_BASE}/api/cancel-subscription`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({ userId: userIdRef.current }),
              });

              const json = await res.json();
              if (json.ok) {
                Alert.alert(
                  'Subscription Cancelled',
                  'Your subscription will remain active until the end of the current billing period. You can resubscribe anytime before then.',
                  [{ text: 'OK' }]
                );
                // Refresh subscription status
                setTimeout(async () => {
                  await refreshSubscription();
                }, 1000);
              } else {
                Alert.alert('Error', json.error || 'Failed to cancel subscription. Please try again.');
              }
            } catch (err) {
              console.error('[Cancel Subscription] error:', err);
              Alert.alert('Error', 'Failed to cancel subscription. Please try again later.');
            } finally {
              setSubscribeLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUploadStart = async ({ imageUri, imageDataUrl }) => {
    setOriginal({ imageUri, prompt: style?.prompt });
    setPendingImageDataUrl(imageDataUrl);
    setFailedAttempts(0);
    setError('');
    setScreen('result');
    await callApi({ imageDataUrl });
  };

  const handleRetry = async () => {
    if (!pendingImageDataUrl || failedAttempts >= 3) return;
    setError('');
    setLoading(true);
    await callApi({ imageDataUrl: pendingImageDataUrl });
  };

  useEffect(() => {
    const onBackPress = () => {
      if (screen === 'result') {
        resultBackHandlerRef.current?.();
        return true;
      }
      if (screen === 'upload') {
        setScreen('style');
        return true;
      }
      if (screen === 'subscription' || screen === 'privacy' || screen === 'terms' || screen === 'about') {
        setScreen('style');
        return true;
      }
      if (screen === 'style') return false;
      if (screen === 'splash') return true;
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [screen]);

  if (screen === 'splash') {
    return (
      <SafeAreaProvider>
        <SplashScreen onComplete={() => setScreen('style')} />
      </SafeAreaProvider>
    );
  }

  if (screen === 'style') {
    return (
      <SafeAreaProvider>
        <StyleScreen
          selectedStyle={style}
          availableStyles={availableStyles}
          onOpenMenu={() => setMenuOpen(true)}
          onNext={(s) => {
            setStyle(s);
            setScreen('upload');
          }}
        />
        <MenuModal
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onSelect={(id) => {
            setMenuOpen(false);
            setScreen(id);
          }}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'privacy') {
    return (
      <SafeAreaProvider>
        <InfoScreen
          title="Privacy Policy"
          content={PRIVACY_POLICY_TEXT}
          onBack={() => setScreen('style')}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'terms') {
    return (
      <SafeAreaProvider>
        <InfoScreen
          title="Terms & Conditions"
          content={TERMS_TEXT}
          onBack={() => setScreen('style')}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'about') {
    return (
      <SafeAreaProvider>
        <InfoScreen
          title="About"
          content={ABOUT_TEXT}
          onBack={() => setScreen('style')}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'subscription') {
    return (
      <SafeAreaProvider>
        <SubscriptionScreen
          subscriptionInfo={subscriptionInfo}
          subscriptionLoading={subscriptionLoading}
          onRefreshSubscription={refreshSubscription}
          onSubscribe={handleSubscribe}
          subscribeLoading={subscribeLoading}
          onCancelSubscription={handleCancelSubscription}
          onRestorePurchases={handleRestorePurchases}
          onClose={() => setScreen('style')}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'upload') {
    return (
      <SafeAreaProvider>
        <UploadScreen
          style={style}
          onStart={handleUploadStart}
          canGenerateMore={
            subscriptionInfo
              ? // If not trial and we have usage + limit, enforce quota
                !(
                  !subscriptionInfo.isTrial &&
                  subscriptionInfo.usage &&
                  subscriptionInfo.usage.limit > 0 &&
                  subscriptionInfo.usage.current >= subscriptionInfo.usage.limit
                )
              : true
          }
          subscriptionInfo={subscriptionInfo}
          onSubscribe={handleSubscribe}
          onBackToStyle={() => setScreen('style')}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'result') {
    return (
      <SafeAreaProvider>
        <ResultScreen
          original={original}
          result={result}
          loading={loading}
          error={error}
          failedAttempts={failedAttempts}
          onRetry={handleRetry}
          subscriptionInfo={subscriptionInfo}
          backHandlerRef={resultBackHandlerRef}
          onBack={() => { setScreen('upload'); setError(''); setFailedAttempts(0); }}
          onHome={() => setScreen('style')}
        />
      </SafeAreaProvider>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashSafe: {
    backgroundColor: '#ffffff',
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: 220,
    height: 220,
    borderRadius: 28,
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
    flexGrow: 1,
    alignItems: 'center',
  },
  resultContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    gap: 0,
  },
  styleContainer: {
    padding: 24,
    paddingTop: 8,
    gap: 16,
    flexGrow: 1,
  },
  uploadContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 8,
    gap: 16,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 4,
  },
  resultHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadImageContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
  },
  uploadButtonsContainer: {
    gap: 12,
    paddingBottom: Platform.OS === 'android' ? 8 : 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 22,
  },
  subscriptionSummaryContainer: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subscriptionPlanPill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  subscriptionPlanPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  subscriptionRefreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  subscriptionRefreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  subscribeButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 0,
    textAlign: 'center',
  },
  sectionLabelSelected: {
    color: '#f97316',
    fontWeight: '800',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    rowGap: 16,
    columnGap: 12,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    width: '48%',
  },
  styleCard: {
    marginTop: 4,
    marginBottom: 4,
  },
  styleCardSelected: {
    transform: [{ scale: 0.98 }],
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
  },
  styleImageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F7F7F8',
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  styleImageOverlaySelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.4)',
  },
  styleImageLabel: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 200,
  },
  previewCanvas: {
    width: '100%',
    flex: 1,
    maxHeight: 'none',
    minHeight: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  afterMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  sliderHandleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderKnob: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderKnobText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 200,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F8',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#111827',
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    marginTop: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  bottomActionsContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
  },
  progressContainer: {
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
    gap: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 28,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  progressBarLabelWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarLabelTextLight: {
    color: '#f9fafb',
  },
  progressBarLabelTextDark: {
    color: '#374151',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  errorRetryContainer: {
    width: '100%',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  errorRetryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
  },
  errorRetrySubtext: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  errorRetryMessage: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
  },
  errorRetryHint: {
    fontSize: 12,
    color: '#b91c1c',
  },
  retryButton: {
    marginTop: 4,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#dc2626',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
    paddingBottom: 0,
  },
  actionButtonWrapper: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  actionButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
    flexShrink: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonIcon: {
    fontSize: 32,
    color: '#111827',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 32,
    width: 32,
    height: 32,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  homeButtonIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '900',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  // Upload screen - badge as progress bar (option 2)
  badgeAsBarContainer: {
    flex: 1,
    width: '100%',
    height: 32,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  badgeAsBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  badgeAsBarTextWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAsBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
  },
  uploadSubscriptionBadge: {
    flex: 1,
    width: '100%',
    height: 32,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSubscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f46e5',
  },
  // Result screen - badge as progress bar
  resultBadgeAsBarContainer: {
    flex: 1,
    marginHorizontal: 8,
    height: 32,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  resultSubscriptionBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    marginHorizontal: 8,
  },
  resultSubscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f46e5',
  },
  // Quota progress bar
  quotaProgressContainer: {
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  quotaProgressBar: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  quotaProgressFill: {
    height: '100%',
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
  quotaWarningButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
  },
  quotaWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  quotaExceededButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  quotaExceededText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
  },
  // Style screen header
  // Refined header bar (used on Style + Upload + Result screens)
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    flexShrink: 1,
  },
  headerPillProgress: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  headerPillProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  headerPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonIcon: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  styleCardLabel: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  styleCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  styleCardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  // Upload screen — refined
  photoPlaceholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoPlaceholderIconText: {
    fontSize: 28,
    color: '#4F46E5',
    fontWeight: '300',
    lineHeight: 32,
  },
  photoPlaceholderTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  photoPlaceholderHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cropChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  cropChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadSourceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  slimButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimButtonText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  quotaExceededBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  quotaExceededBannerText: {
    color: '#A32D2D',
    fontWeight: '600',
    fontSize: 13,
  },
  // Menu modal
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  menuHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#94A3B8',
  },
  // Info screen (Privacy, Terms, About)
  infoContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 8,
  },
  infoContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  // Paywall — refined
  paywallContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  paywallPlanCard: {
    backgroundColor: '#F7F7F8',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  paywallPlanHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paywallPlanTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  paywallPlanQuotaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  paywallPlanRenewalText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  paywallPendingText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 4,
  },
  paywallActivePill: {
    backgroundColor: '#EAF3DE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  paywallActivePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B6D11',
    letterSpacing: 0.4,
  },
  paywallUpgradePill: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  paywallUpgradePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4F46E5',
    letterSpacing: 0.4,
  },
  paywallCancelPill: {
    backgroundColor: '#FAEEDA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  paywallCancelPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#854F0B',
  },
  paywallProgress: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  paywallProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  paywallSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 4,
  },
  paywallTierCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  paywallTierCardSelected: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  paywallTierCardCurrent: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  paywallTierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paywallTierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  paywallTierName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  paywallTierPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  paywallTierPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  paywallTierDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  paywallTierBadgeCurrent: {
    backgroundColor: '#4F46E5',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 99,
  },
  paywallTierBadgeCurrentText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paywallTierBadgePopular: {
    backgroundColor: '#4F46E5',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 99,
  },
  paywallTierBadgePopularText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paywallTierBadgeNeutral: {
    backgroundColor: '#F1EFE8',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 99,
  },
  paywallTierBadgeNeutralText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#5F5E5A',
    letterSpacing: 0.5,
  },
  paywallActions: {
    paddingTop: 12,
    gap: 8,
  },
  paywallCancelLink: {
    fontSize: 13,
    color: '#A32D2D',
    fontWeight: '500',
    paddingVertical: 8,
  },
  styleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '900',
  },
  // Subscription screen
  subscriptionContainer: {
    padding: 24,
    paddingTop: 60,
    gap: 24,
    flexGrow: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subscriptionHeaderContent: {
    gap: 2,
  },
  subscriptionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subscriptionTagline: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '900',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  planCardDescription: {
    fontSize: 14,
  },
  pendingTierText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  trialBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  activeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#d1fae5',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  cancelWarning: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  cancelWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  quotaInfoContainer: {
    gap: 8,
    marginTop: 8,
  },
  quotaInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quotaProgressBarFull: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  quotaProgressFillFull: {
    height: '100%',
    borderRadius: 999,
  },
  quotaWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  quotaExceededTextFull: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  tierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tierCardSelected: {
    borderColor: '#f97316',
    borderWidth: 2.5,
    backgroundColor: '#fff7ed',
  },
  tierCardPopular: {
    borderColor: '#f97316',
    backgroundColor: '#ffffff',
    shadowColor: '#f97316',
    shadowOpacity: 0.12,
  },
  tierCardActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  popularRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f97316',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 10,
  },
  popularRibbonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tierCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  tierCardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ea580c',
    marginTop: 4,
  },
  tierCardQuota: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  currentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#d1fae5',
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  actionButton: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryActionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  secondaryActionButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ef4444',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
});
