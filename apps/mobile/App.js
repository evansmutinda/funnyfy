import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Share,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { initRevenueCat, getOfferings, purchasePackage, hasRevenueCatKey } from './services/revenuecat';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://funnyfyapp.vercel.app';
// Temporary test user id used for RevenueCat appUserID and FunnyFy backend (via x-user-id)
const TEST_USER_ID = 'test-user-123';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  onSubscribe,
  subscribeLoading,
  subscriptionInfo,
  subscriptionLoading,
  onRefreshSubscription,
}) {
  const insets = useSafeAreaInsets();
  const styleList = Array.isArray(availableStyles) && availableStyles.length > 0
    ? availableStyles
    : [STYLE_90S_CARTOON];

  const renderPlanLabel = () => {
    if (subscriptionLoading) {
      return 'Loading your plan…';
    }

    if (!subscriptionInfo) {
      return 'Free trial • Limited caricatures until you subscribe';
    }

    const { subscription, usage, isTrial } = subscriptionInfo;

    if (isTrial || !subscription) {
      const current = usage?.current ?? 0;
      const limit = usage?.limit ?? 3;
      return `Free trial • ${current}/${limit} caricatures used this month`;
    }

    const tierLabel = (subscription.tier || 'starter')
      .toString()
      .replace(/^\w/, (c) => c.toUpperCase());

    if (usage && typeof usage.current === 'number' && typeof usage.limit === 'number' && usage.limit > 0) {
      const remaining = Math.max(0, usage.limit - usage.current);
      return `${tierLabel} plan • ${remaining} of ${usage.limit} caricatures remaining this month`;
    }

    return `${tierLabel} plan`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={[styles.styleContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.title}>✨ Choose Your Style</Text>
        <View style={styles.subscriptionSummaryContainer}>
          <View style={styles.subscriptionPlanPill}>
            <Text style={styles.subscriptionPlanPillText}>{renderPlanLabel()}</Text>
          </View>
          <TouchableOpacity
            style={styles.subscriptionRefreshButton}
            onPress={onRefreshSubscription}
            disabled={subscriptionLoading}
          >
            <Text style={styles.subscriptionRefreshText}>
              {subscriptionLoading ? 'Refreshing…' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {styleList.length > 1
            ? `Pick from ${styleList.length} amazing styles`
            : 'Transform your photos with our signature styles'}
        </Text>
        <TouchableOpacity
          style={[styles.subscribeButton, (subscribeLoading) && styles.buttonDisabled]}
          onPress={onSubscribe}
          disabled={subscribeLoading}
        >
          <Text style={styles.subscribeButtonText}>
            {subscribeLoading ? 'Checking...' : 'Manage Subscription'}
          </Text>
        </TouchableOpacity>

        <View style={styles.styleGrid}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function UploadScreen({ style, onStart, onBackToStyle, canGenerateMore, subscriptionInfo }) {
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
      <StatusBar barStyle="dark-content" />
      <View style={[styles.uploadContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.uploadHeader}>
          <TouchableOpacity onPress={onBackToStyle} style={styles.backButton}>
            <Text style={styles.backButtonIcon}>‹</Text>
          </TouchableOpacity>
        </View>
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
            onPress={() => onStart({ imageUri, imageDataUrl })}
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

function ResultScreen({ original, result, loading, error, onBack, onHome }) {
  const insets = useSafeAreaInsets();
  const imageUrl = result ? getImageUrlFromOutput(result.output) : null;
  const [mix, setMix] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const hasResult = !!result && !!imageUrl;

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK' }]);
    }
  }, [error]);

  useEffect(() => {
    // Reset mix to 0 (show result) when new result loads
    if (hasResult) {
      setMix(0);
    }
  }, [hasResult]);

  useEffect(() => {
    if (hasResult) {
      setProgressPercent(100);
      return;
    }

    if (!loading) {
      setProgressPercent(0);
      return;
    }

    let baseProgress = 5;

    if (result) {
      const status = result?.status || result?.data?.status;
      if (status === 'starting') baseProgress = 10;
      else if (status === 'processing') baseProgress = 40;
      else baseProgress = 20;
    }

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= baseProgress - 5) return Math.min(prev + 1, baseProgress);
        return prev + 0.5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [loading, result, hasResult]);

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      await Share.share({
        message: 'Check out my caricature!',
        url: imageUrl,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl || loading) return;
    try {
      const urlNoQuery = imageUrl.split('?')[0];
      const fileName = urlNoQuery.split('/').pop() || 'funnyfy.jpg';
      const localPath = FileSystem.documentDirectory + fileName;

      console.log('Downloading image to:', localPath);
      const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);
      console.log('Download complete, file URI:', resultDl.uri);

      let saved = false;

      if (Platform.OS === 'android') {
        const downloadsPath = 'file:///storage/emulated/0/Download/' + fileName;
        try {
          console.log('Attempting direct copy to Downloads:', downloadsPath);
          await FileSystem.copyAsync({ from: resultDl.uri, to: downloadsPath });
          console.log('Image saved directly to Downloads folder!');
          saved = true;
        } catch (copyErr) {
          console.log('Direct copy failed:', copyErr.message);
          try {
            console.log('Trying MediaLibrary.saveToLibraryAsync without permission check...');
            await MediaLibrary.saveToLibraryAsync(resultDl.uri);
            console.log('Image saved via MediaLibrary!');
            saved = true;
          } catch (mlErr) {
            console.error('MediaLibrary also failed:', mlErr.message);
            await Sharing.shareAsync(resultDl.uri, {
              mimeType: 'image/jpeg',
              dialogTitle: 'Save image',
            });
          }
        }
      } else {
        try {
          await MediaLibrary.saveToLibraryAsync(resultDl.uri);
          console.log('Image saved to gallery!');
          saved = true;
        } catch (mlErr) {
          await Sharing.shareAsync(resultDl.uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Save image',
          });
        }
      }

      if (saved) {
        Alert.alert('Image Saved', 'Your image has been saved successfully!');
      }
    } catch (err) {
      console.error('Download/save error:', err);
      console.error('Error message:', err.message);
    }
  };

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
      <StatusBar barStyle="dark-content" />
      <View style={[styles.resultContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.resultHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onHome} style={styles.homeButton}>
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
                  <Text style={styles.progressLabel}>
                    {progressPercent < 20
                      ? 'Starting…'
                      : progressPercent < 70
                      ? 'Processing…'
                      : 'Almost done…'}
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    <View style={styles.progressBarLabelWrapper}>
                      <Text
                        style={[
                          styles.progressBarLabelText,
                          progressPercent > 20
                            ? styles.progressBarLabelTextLight
                            : styles.progressBarLabelTextDark,
                        ]}
                      >
                        {Math.round(progressPercent)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
              
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleDownload}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.actionButtonText}>💾 Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleShare}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.actionButtonText}>📤 Share</Text>
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
  const [job, setJob] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [hasRcKey, setHasRcKey] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    // Initialize RevenueCat with a placeholder user id (replace with real auth later)
    const hasKey = hasRevenueCatKey();
    setHasRcKey(hasKey);
    if (!hasKey) {
      console.warn('[RevenueCat] Missing SDK key, skipping init');
      return;
    }
    initRevenueCat(TEST_USER_ID).catch((err) => {
      console.error('[RevenueCat] init error:', err);
    });
  }, []);

  const refreshSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/subscription?userId=${encodeURIComponent(TEST_USER_ID)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': TEST_USER_ID,
        },
      });
      const text = await res.text();
      console.log('[subscription] response:', text);
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.error('[subscription] invalid JSON');
        return;
      }
      if (!res.ok || !json.ok) {
        console.warn('[subscription] non-ok response:', json);
        setSubscriptionInfo(null);
        return;
      }
      setSubscriptionInfo(json);
    } catch (err) {
      console.error('[subscription] error:', err);
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
    // Also try to load subscription info on startup
    refreshSubscription();
  }, []);

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
          userId: TEST_USER_ID,
          payload: {
            styleId: style.id,
            imageUrl: imageDataUrl || null,
          },
        };

        try {
          const res = await fetch(`${API_BASE}/api/test`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': TEST_USER_ID,
            },
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
        } finally {
          setLoading(false);
        }
      },
    [style]
  );

  const handleSubscribe = async () => {
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

      // Show package selection (for now, use first package; can add UI later)
      const selected = pkgs[0];
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

        if (hasActiveSubscription) {
          console.log('[RevenueCat] Purchase successful, active entitlements:', Object.keys(activeEntitlements));
          
          // Wait a moment for webhook to process (RevenueCat sends webhook async)
          Alert.alert(
            'Purchase Successful! 🎉',
            `Your subscription is now active. Your plan will update in a moment.`,
            [{ text: 'OK' }]
          );

          // Wait 2 seconds for webhook to process, then refresh
          setTimeout(async () => {
            console.log('[RevenueCat] Refreshing subscription after purchase...');
            await refreshSubscription();
          }, 2000);
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

  const handleUploadStart = async ({ imageUri, imageDataUrl }) => {
    setOriginal({ imageUri, prompt: style?.prompt });
    setScreen('result');
    await callApi({ imageDataUrl });
  };

  useEffect(() => {
    const onBackPress = () => {
      if (screen === 'result') {
        setScreen('upload');
        return true;
      }
      if (screen === 'upload') {
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
          subscriptionInfo={subscriptionInfo}
          subscriptionLoading={subscriptionLoading}
          onRefreshSubscription={refreshSubscription}
          onSubscribe={handleSubscribe}
          subscribeLoading={subscribeLoading}
          onNext={(s) => {
            setStyle(s);
            setScreen('upload');
          }}
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
          onBack={() => setScreen('upload')}
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
    backgroundColor: '#f9fafb',
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
    paddingTop: 24,
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
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 0,
    paddingBottom: 0,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
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
    fontSize: 15,
    letterSpacing: 0.3,
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
});
