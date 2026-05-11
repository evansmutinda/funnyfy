import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  BackHandler,
  Image,
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
      <StatusBar barStyle="light-content" />
      <View style={styles.splashContainer}>
        <Text style={styles.splashLogo}>🎨 FunnyFy</Text>
        <Text style={styles.splashTagline}>Transform photos into amazing caricatures</Text>
      </View>
    </SafeAreaView>
  );
}

function StyleScreen({
  selectedStyle,
  availableStyles,
  onNext,
  onOpenSubscription,
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
        <View style={styles.styleHeader}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={onOpenSubscription} style={styles.menuButton}>
            <Text style={styles.menuButtonIcon}>☰</Text>
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
                <View
                  style={[
                    styles.styleImageOverlay,
                    selectedStyle?.id === s.id && styles.styleImageOverlaySelected
                  ]}
                />
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

  const pickImage = async (useCamera = false) => {
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
        // Use full frame from camera (no forced crop)
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Photo library permission is required to select images.');
          return;
        }
        // Use original image from gallery (no crop dialog)
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
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
        <View style={styles.uploadHeader}>
          {/* Plan badge as progress bar - full width */}
          {subscriptionInfo && (
            <>
              {subscriptionInfo.usage && subscriptionInfo.usage.limit > 0 ? (
                <View style={styles.badgeAsBarContainer}>
                  <View
                    style={[
                      styles.badgeAsBarFill,
                      {
                        width: `${Math.min(quotaInfo.percentage, 100)}%`,
                        backgroundColor: quotaInfo.isExceeded ? '#ef4444' : quotaInfo.isLow ? '#f59e0b' : '#10b981',
                      },
                    ]}
                  />
                  <View style={styles.badgeAsBarTextWrapper}>
                    <Text style={styles.badgeAsBarText}>
                      {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                        ? `Trial • ${quotaInfo.current}/${quotaInfo.limit}`
                        : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} • ${quotaInfo.current}/${quotaInfo.limit}`}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadSubscriptionBadge}>
                  <Text style={styles.uploadSubscriptionBadgeText}>
                    {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                      ? `Trial • ${quotaInfo.current}/${quotaInfo.limit}`
                      : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} • ${quotaInfo.current}/${quotaInfo.limit}`}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        {quotaInfo.isExceeded && (
          <TouchableOpacity onPress={onSubscribe} style={[styles.quotaExceededButton, { marginTop: 12 }]}>
            <Text style={styles.quotaExceededText}>❌ Quota exceeded - Upgrade to continue</Text>
          </TouchableOpacity>
        )}
        <View style={styles.uploadImageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Select or take a photo</Text>
            </View>
          )}
        </View>
        <View style={styles.uploadButtonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, picking && styles.buttonDisabled]}
            onPress={() => pickImage(true)}
            disabled={picking}
          >
            <Text style={styles.secondaryButtonText}>
              {picking && pickingSource === 'camera' ? 'Opening camera…' : 'Take a photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, picking && styles.buttonDisabled]}
            onPress={() => pickImage(false)}
            disabled={picking}
          >
            <Text style={styles.secondaryButtonText}>
              {picking && pickingSource === 'gallery' ? 'Opening gallery…' : 'Choose from gallery'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (!canGenerate || picking) && styles.buttonDisabled]}
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
            <Text style={styles.buttonText}>
              {quotaOk ? '✨ Generate Caricature' : 'Quota reached – upgrade to continue'}
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
    starter: { name: 'Starter', price: '$5', quota: 50 },
    popular: { name: 'Popular', price: '$10', quota: 100 },
    pro: { name: 'Pro', price: '$25', quota: 250 },
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#f8fafc' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={{ height: insets.top, backgroundColor: '#f8fafc' }} />
      <ScrollView 
        contentContainerStyle={styles.subscriptionContainer}
        style={{ flex: 1, backgroundColor: '#f8fafc' }}
      >
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionHeaderContent}>
            <Text style={styles.subscriptionTitle}>Subscriptions</Text>
            <Text style={styles.subscriptionTagline}>Unlock more caricatures</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Current Plan Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          {subscriptionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f97316" />
              <Text style={styles.loadingText}>Loading subscription...</Text>
            </View>
          ) : isTrial ? (
            <View style={styles.planCard}>
              <View style={styles.planCardHeader}>
                <Text style={styles.planCardTitle}>Free Trial</Text>
                <View style={styles.trialBadge}>
                  <Text style={styles.trialBadgeText}>Trial</Text>
                </View>
              </View>
              <Text style={styles.planCardDescription}>
                You're currently on the free trial. Subscribe to unlock more caricatures!
              </Text>
              <View style={styles.quotaInfoContainer}>
                <Text style={styles.quotaInfoText}>
                  {quotaInfo.current} of {quotaInfo.limit} caricatures used
                </Text>
                <View style={styles.quotaProgressBarFull}>
                  <View 
                    style={[
                      styles.quotaProgressFillFull,
                      { 
                        width: `${Math.min(quotaInfo.percentage, 100)}%`,
                        backgroundColor: quotaInfo.percentage >= 100 ? '#ef4444' : '#10b981'
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ) : subscription ? (
            <View style={styles.planCard}>
              <View style={styles.planCardHeader}>
                <Text style={styles.planCardTitle}>
                  {TIER_INFO[subscription.tier]?.name || subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                </Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
              {subscription.cancelAtPeriodEnd && (
                <View style={styles.cancelWarning}>
                  <Text style={styles.cancelWarningText}>
                    ⚠️ Your subscription will cancel on {formatDate(subscription.periodEnd)}
                  </Text>
                </View>
              )}
              <Text style={styles.planCardDescription}>
                Next renewal: {formatDate(subscription.periodEnd)}
              </Text>
              {subscription.pendingTier && (
                <Text style={styles.pendingTierText}>
                  Changing to {subscription.pendingTier.charAt(0).toUpperCase() + subscription.pendingTier.slice(1)} at next renewal
                </Text>
              )}
              <View style={styles.quotaInfoContainer}>
                <Text style={styles.quotaInfoText}>
                  {quotaInfo.remaining} of {quotaInfo.limit} caricatures remaining this month
                </Text>
                <View style={styles.quotaProgressBarFull}>
                  <View 
                    style={[
                      styles.quotaProgressFillFull,
                      { 
                        width: `${Math.min(quotaInfo.percentage, 100)}%`,
                        backgroundColor: quotaInfo.percentage >= 100 ? '#ef4444' : quotaInfo.percentage >= 80 ? '#f59e0b' : '#10b981'
                      }
                    ]} 
                  />
                </View>
                {quotaInfo.percentage >= 80 && quotaInfo.percentage < 100 && (
                  <Text style={styles.quotaWarningText}>
                    ⚠️ Running low on caricatures
                  </Text>
                )}
                {quotaInfo.percentage >= 100 && (
                  <Text style={styles.quotaExceededTextFull}>
                    ❌ Quota exceeded - upgrade to continue
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.planCard}>
              <Text style={styles.planCardDescription}>No active subscription</Text>
            </View>
          )}
        </View>

        {/* Subscription Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your plan</Text>
          {Object.entries(TIER_INFO).map(([tier, info]) => (
            <TouchableOpacity
              key={tier}
              style={[
                styles.tierCard,
                subscription?.tier === tier && styles.tierCardActive,
                tier === 'popular' && styles.tierCardPopular,
                selectedTier === tier && styles.tierCardSelected,
              ]}
              onPress={() => {
                if (subscription?.tier !== tier) {
                  setSelectedTier(tier);
                }
              }}
              activeOpacity={0.85}
            >
              {tier === 'popular' && !subscription?.tier && (
                <View style={styles.popularRibbon}>
                  <Text style={styles.popularRibbonText}>Most popular</Text>
                </View>
              )}
              <View style={styles.tierCardHeader}>
                <View>
                  <Text style={styles.tierCardTitle}>{info.name}</Text>
                  <Text style={styles.tierCardPrice}>{info.price}/month</Text>
                </View>
                {subscription?.tier === tier && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tierCardQuota}>{info.quota} caricatures per month</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, (subscribeLoading || !selectedTier && !subscription) && styles.buttonDisabled]}
            onPress={() => onSubscribe(selectedTier)}
            disabled={subscribeLoading || (!selectedTier && !subscription)}
          >
            <Text style={styles.actionButtonText}>
              {subscribeLoading 
                ? 'Processing...' 
                : selectedTier
                  ? `Subscribe to ${TIER_INFO[selectedTier]?.name} – ${TIER_INFO[selectedTier]?.price}/mo`
                  : subscription 
                    ? 'Change Subscription' 
                    : 'Select a plan above'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton, subscriptionLoading && styles.buttonDisabled]}
            onPress={onRefreshSubscription}
            disabled={subscriptionLoading}
          >
            <Text style={styles.secondaryActionButtonText}>
              {subscriptionLoading ? 'Refreshing...' : 'Refresh Status'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton, subscribeLoading && styles.buttonDisabled]}
            onPress={onRestorePurchases}
            disabled={subscribeLoading}
          >
            <Text style={styles.secondaryActionButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
          {subscription && !subscription.cancelAtPeriodEnd && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, subscribeLoading && styles.buttonDisabled]}
              onPress={onCancelSubscription}
              disabled={subscribeLoading}
            >
              <Text style={styles.cancelButtonText}>
                Cancel Subscription
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: Math.max(insets.bottom, BOTTOM_INSET_MIN) }} />
      </ScrollView>
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
        <View style={styles.resultHeader}>
          <TouchableOpacity onPress={() => confirmNavigate(onBack)} style={styles.backButton}>
            <Text style={styles.backButtonIcon}>‹</Text>
          </TouchableOpacity>
          {/* Plan badge as progress bar */}
          {subscriptionInfo && (
            subscriptionInfo.usage && subscriptionInfo.usage.limit > 0 ? (
              <View style={styles.resultBadgeAsBarContainer}>
                <View
                  style={[
                    styles.badgeAsBarFill,
                    {
                      width: `${resultQuotaPct}%`,
                      backgroundColor: resultQuotaPct >= 100 ? '#ef4444' : resultQuotaPct >= 80 ? '#f59e0b' : '#10b981',
                    },
                  ]}
                />
                <View style={styles.badgeAsBarTextWrapper}>
                  <Text style={styles.badgeAsBarText}>
                    {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                      ? `Trial • ${resultQuotaCurrent}/${resultQuotaLimit}`
                      : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} • ${resultQuotaCurrent}/${resultQuotaLimit}`}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.resultSubscriptionBadge}>
                <Text style={styles.resultSubscriptionBadgeText}>
                  {subscriptionInfo.isTrial || !subscriptionInfo.subscription
                    ? `Trial • ${resultQuotaCurrent}/${resultQuotaLimit}`
                    : `${subscriptionInfo.subscription.tier.charAt(0).toUpperCase() + subscriptionInfo.subscription.tier.slice(1)} • ${resultQuotaCurrent}/${resultQuotaLimit}`}
                </Text>
              </View>
            )
          )}
          <TouchableOpacity onPress={() => confirmNavigate(onHome)} style={styles.homeButton}>
            <Text style={styles.homeButtonIcon}>🏠</Text>
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
                <View style={styles.actionButtonWrapper}>
                  <TouchableOpacity
                    style={[styles.actionButton, (!hasResult || loading) && styles.buttonDisabled]}
                    onPress={handleDownload}
                    disabled={!hasResult || loading}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1}>Save</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.actionButtonWrapper}>
                  <TouchableOpacity
                    style={[styles.actionButton, (!hasResult || loading) && styles.buttonDisabled]}
                    onPress={handleShare}
                    disabled={!hasResult || loading}
                  >
                    <Text style={styles.actionButtonText} numberOfLines={1}>Share</Text>
                  </TouchableOpacity>
                </View>
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
      if (screen === 'subscription') {
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
          onOpenSubscription={() => setScreen('subscription')}
          onNext={(s) => {
            setStyle(s);
            setScreen('upload');
          }}
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
    backgroundColor: '#0f172a',
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f97316',
    letterSpacing: 3,
    textShadowColor: 'rgba(249, 115, 22, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  splashTagline: {
    marginTop: 12,
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '500',
    letterSpacing: 0.5,
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
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#111827',
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
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
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
