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
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageView from 'react-native-image-viewing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { initRevenueCat, getOfferings, purchasePackage, restorePurchases, getCustomerInfo, getAppUserId, hasRevenueCatKey } from './services/revenuecat';
import { initAuth, resetAuthIfLocal } from './services/auth';
import { Feather } from '@expo/vector-icons';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://funnyfyapp.vercel.app';

// Enforce HTTPS for security — prevent accidental HTTP misconfiguration
if (API_BASE.startsWith('http://') && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')) {
  console.error('[Security] API_BASE must use HTTPS in production. Refusing to start with insecure URL.');
  throw new Error('Insecure API URL: HTTPS required for production');
}

// Placeholder content for info screens — replace SUPPORT_EMAIL with your actual email and host these on a public URL before Play Store submission
const SUPPORT_EMAIL = 'support@funnyfy.app';
const APP_NAME = 'FunnyFy';
const COMPANY_NAME = 'FunnyFy';

const PRIVACY_POLICY_TEXT = `Last updated: ${new Date().toLocaleDateString()}

${COMPANY_NAME} ("we", "us", "our") operates the ${APP_NAME} mobile application ("the App"). This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use the App.

1. INFORMATION WE COLLECT

Photos You Upload
When you generate a caricature, the photo you upload is temporarily processed by our AI partner (Replicate) to create your caricature. Photos are not stored on our servers after processing.

Anonymous Account Identifier
We generate a random anonymous identifier for your device when you first open the App. This lets us track your trial usage and subscription status without collecting personal data.

Subscription Information
If you subscribe, our payment processor (RevenueCat with Google Play) handles your payment. We receive only your subscription tier and renewal status — never your credit card or payment details.

Usage Data
We track how many caricatures you generate to enforce your monthly quota. We may collect basic technical data (device model, OS version, app version) for crash reporting and analytics.

2. HOW WE USE YOUR INFORMATION

We use the information we collect to:
• Provide the caricature generation service
• Process your subscription and enforce usage limits
• Improve the App's performance and fix bugs
• Comply with legal obligations

We do NOT:
• Sell your data to third parties
• Use your photos to train AI models
• Share your data with advertisers

3. DATA SHARING

We share data only with these third-party services that help us operate the App:
• Replicate (AI image generation)
• RevenueCat (subscription management)
• Google Play (in-app purchases)
• Vercel (server hosting)
• Supabase (database hosting)

These providers are bound by their own privacy policies and process data only as needed to provide their services.

4. DATA RETENTION

• Uploaded photos: Deleted from our servers after processing (within hours)
• Generated caricatures: Hosted on Replicate's CDN for ~24 hours, then automatically deleted
• Account data: Retained as long as you use the App. Deleted on request.
• Subscription records: Retained for legal/tax compliance (typically 7 years)

5. YOUR RIGHTS

You can:
• Request a copy of your data
• Request deletion of your account and all associated data
• Opt out of analytics (contact us)

To exercise these rights, email ${SUPPORT_EMAIL}.

6. CHILDREN'S PRIVACY

The App is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal information, contact us immediately.

7. SECURITY

We use industry-standard security measures: HTTPS for all data transmission, encrypted databases, and authenticated APIs. However, no method of transmission over the internet is 100% secure.

8. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the App and updating the "Last updated" date.

9. CONTACT US

If you have questions about this Privacy Policy, contact us at: ${SUPPORT_EMAIL}
`;

const TERMS_TEXT = `Last updated: ${new Date().toLocaleDateString()}

These Terms and Conditions ("Terms") govern your use of the ${APP_NAME} mobile application ("the App"). By using the App, you agree to these Terms.

1. ACCEPTANCE

By downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.

2. ELIGIBILITY

You must be at least 13 years old to use the App. By using the App, you represent that you meet this age requirement.

3. USE OF THE APP

The App is provided for personal, non-commercial use. You may:
• Upload photos to generate caricatures
• Save and share generated caricatures for personal use

You may NOT:
• Upload photos of others without their consent
• Upload illegal, inappropriate, or copyrighted images without permission
• Use the App for commercial resale of caricatures without a license
• Attempt to reverse engineer, hack, or abuse the App
• Use automated tools, bots, or scripts to interact with the App
• Upload images of minors in any sexual, suggestive, or exploitative context

Violation of these terms may result in account suspension or termination.

4. CONTENT OWNERSHIP

You retain ownership of photos you upload. By uploading, you grant us a limited license to process the photo solely for caricature generation.

You own the caricatures generated from your photos. We retain no ownership claim on your generated content.

5. SUBSCRIPTIONS

The App offers monthly subscription plans (Starter, Popular, Pro) with different generation quotas. Subscriptions:
• Auto-renew monthly unless canceled
• Can be canceled anytime through your Google Play account
• Provide quota that resets each billing cycle
• Unused quota does not roll over

Subscription pricing is shown in the App and may change with notice.

6. FREE TRIAL

New users receive 3 free caricature generations. After the trial, a subscription is required to continue using the App.

7. INTELLECTUAL PROPERTY

The App, including its design, code, and content (other than user-uploaded photos), is owned by ${COMPANY_NAME} and protected by copyright laws.

8. DISCLAIMERS

THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
• Continuous availability of the service
• The quality or accuracy of generated caricatures
• That the App will meet your specific needs

9. LIMITATION OF LIABILITY

To the maximum extent permitted by law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App. Our total liability is limited to the amount you paid us in the 12 months prior to the claim.

10. TERMINATION

We may suspend or terminate your access to the App at any time for violation of these Terms or for any other reason at our discretion. You can stop using the App at any time.

11. CHANGES TO TERMS

We may modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.

12. GOVERNING LAW

These Terms are governed by the laws of the jurisdiction in which ${COMPANY_NAME} operates, without regard to conflict of law principles.

13. CONTACT

For questions about these Terms, contact us at: ${SUPPORT_EMAIL}
`;

const ABOUT_TEXT = `${APP_NAME}

Transform your photos into amazing caricatures with the power of AI.

Pick a style, upload a photo, and watch the magic happen.

Version 1.0.1

Made with care.

Contact: ${SUPPORT_EMAIL}`;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_INSET_MIN = Platform.OS === 'android' ? 48 : 34;

// Industry-standard folder for app-generated photos (e.g. Pictures/Funnyfy/)
const FUNNYFY_FOLDER_NAME = 'Funnyfy';
const FUNNYFY_ANDROID_FOLDER_PATH = `file:///storage/emulated/0/Pictures/${FUNNYFY_FOLDER_NAME}/`;

// Ensure the FunnyFy folder exists on Android (creates it the first time)
async function ensureFunnyfyFolder() {
  if (Platform.OS !== 'android') return;
  try {
    const info = await FileSystem.getInfoAsync(FUNNYFY_ANDROID_FOLDER_PATH);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(FUNNYFY_ANDROID_FOLDER_PATH, { intermediates: true });
      console.log('[Save] Created FunnyFy folder');
    }
  } catch (err) {
    console.warn('[Save] ensureFunnyfyFolder error (non-fatal):', err);
  }
}

// Save an image to the device library (no system prompt on Android)
// Uses saveToLibraryAsync which is silent — no "allow modify" dialog
async function saveToFunnyfyAlbum(localFileUri) {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Save] MediaLibrary permission denied');
      return false;
    }
    await MediaLibrary.saveToLibraryAsync(localFileUri);
    return true;
  } catch (err) {
    console.error('[Save] saveToFunnyfyAlbum error:', err);
    return false;
  }
}

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

// Beautiful custom toast notification (replaces ugly system Alert for simple messages)
// Slides down from top, auto-dismisses after a few seconds
function Toast({ visible, title, message, type = 'info', onHide }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();

      // Auto-hide after 2.8s
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 220,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, 2800);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
    }
  }, [visible]);

  if (!visible) return null;

  // Type-based accent (subtle, on-brand)
  const accent = type === 'success' ? '#10B981'
    : type === 'error' ? '#F59E0B'
    : type === 'warning' ? '#F59E0B'
    : '#0F172A';

  const icon = type === 'success' ? '✓'
    : type === 'error' ? '!'
    : type === 'warning' ? '!'
    : 'i';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        { paddingTop: insets.top + 8, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.toastInner}>
        <View style={[styles.toastIconCircle, { backgroundColor: accent }]}>
          <Text style={styles.toastIconText}>{icon}</Text>
        </View>
        <View style={styles.toastTextWrap}>
          {title ? <Text style={styles.toastTitle}>{title}</Text> : null}
          {message ? <Text style={styles.toastMessage}>{message}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}

// Custom modal-based confirmation dialog (replaces system Alert.alert for confirmations)
// Supports an optional third "neutral" action (e.g. "Discard") between cancel and confirm
function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  neutralLabel = null,
  destructive = false,
  neutralDestructive = false,
  onConfirm,
  onCancel,
  onNeutral,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.dialogBackdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.dialogCard} onStartShouldSetResponder={() => true}>
          {title ? <Text style={styles.dialogTitle}>{title}</Text> : null}
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          <View style={styles.dialogActionsRow}>
            <TouchableOpacity style={styles.dialogCancelButton} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            {neutralLabel ? (
              <TouchableOpacity
                style={[styles.dialogNeutralButton, neutralDestructive && styles.dialogNeutralDestructive]}
                onPress={onNeutral}
              >
                <Text style={[styles.dialogNeutralText, neutralDestructive && styles.dialogNeutralTextDestructive]}>
                  {neutralLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.dialogConfirmButton, destructive && styles.dialogConfirmDestructive]}
              onPress={onConfirm}
            >
              <Text style={[styles.dialogConfirmText, destructive && styles.dialogConfirmTextDestructive]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Notification context — provides showToast() and showDialog() to all screens
// Avoids duplicating Toast/ConfirmDialog state in every screen
const NotificationContext = React.createContext({
  showToast: () => {},
  showDialog: () => {},
});

function useNotifications() {
  return React.useContext(NotificationContext);
}

function NotificationProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [dialog, setDialog] = useState({ visible: false });

  const showToast = useCallback((title, message, type = 'info') => {
    setToast({ visible: true, title: title || '', message: message || '', type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  // Show a confirmation dialog. opts = {
  //   title, message,
  //   confirmLabel, cancelLabel, neutralLabel,
  //   destructive, neutralDestructive,
  //   onConfirm, onCancel, onNeutral
  // }
  const showDialog = useCallback((opts) => {
    setDialog({ visible: true, ...opts });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog((d) => ({ ...d, visible: false }));
  }, []);

  const value = useMemo(
    () => ({ showToast, showDialog, closeDialog }),
    [showToast, showDialog, closeDialog]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <ConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        cancelLabel={dialog.cancelLabel}
        neutralLabel={dialog.neutralLabel}
        neutralDestructive={dialog.neutralDestructive}
        confirmLabel={dialog.confirmLabel}
        destructive={dialog.destructive}
        onCancel={() => {
          if (dialog.onCancel) dialog.onCancel();
          closeDialog();
        }}
        onNeutral={() => {
          if (dialog.onNeutral) dialog.onNeutral();
        }}
        onConfirm={() => {
          if (dialog.onConfirm) dialog.onConfirm();
        }}
      />
    </NotificationContext.Provider>
  );
}

// Pulsing squares loader shown while a caricature is generating
function SkeletonLoader() {
  const delays = [0, 150, 300, 450];
  return (
    <View style={styles.skeletonContainer}>
      {delays.map((delay, i) => (
        <PulsingSquare key={i} delay={delay} />
      ))}
    </View>
  );
}

function PulsingSquare({ delay }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.2, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Reanimated.View style={[styles.skeletonSquare, animStyle]} />;
}

// Bottom-sheet menu shown when burger is tapped
function MenuModal({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const items = [
    { id: 'gallery',      label: 'My Caricatures',    icon: 'image' },
    { id: 'subscription', label: 'Subscriptions',      icon: 'star' },
    { id: 'privacy',      label: 'Privacy Policy',     icon: 'shield' },
    { id: 'terms',        label: 'Terms & Conditions', icon: 'file-text' },
    { id: 'about',        label: 'About',              icon: 'info' },
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
              <Feather name={item.icon} size={20} color="#0F172A" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Gallery storage helpers
const GALLERY_STORAGE_KEY = '@funnyfy_gallery';
const GALLERY_MAX_ITEMS = 50;
const GALLERY_FOLDER = FileSystem.documentDirectory + 'gallery/';

// Ensure the gallery folder exists (persistent across app launches)
async function ensureGalleryFolder() {
  try {
    const info = await FileSystem.getInfoAsync(GALLERY_FOLDER);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(GALLERY_FOLDER, { intermediates: true });
      console.log('[Gallery] Created gallery folder');
    }
  } catch (err) {
    console.warn('[Gallery] ensureGalleryFolder error:', err);
  }
}

async function saveToGallery(item) {
  try {
    await ensureGalleryFolder();

    // Download the image to local persistent storage so it survives the URL expiry
    const localFileName = `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const localPath = GALLERY_FOLDER + localFileName;

    let savedLocalUri = null;
    try {
      const dl = await FileSystem.downloadAsync(item.imageUrl, localPath);
      if (dl.status === 200) {
        savedLocalUri = dl.uri;
        console.log('[Gallery] Downloaded image to:', savedLocalUri);
      }
    } catch (dlErr) {
      console.warn('[Gallery] Could not download to local (will use remote URL):', dlErr);
    }

    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = existing ? JSON.parse(existing) : [];
    const newItem = {
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      // Use local URI if available; otherwise fallback to remote URL (which may expire)
      imageUrl: savedLocalUri || item.imageUrl,
      remoteUrl: item.imageUrl, // keep original for reference
      isLocal: !!savedLocalUri,
      styleLabel: item.styleLabel,
      styleId: item.styleId,
      createdAt: Date.now(),
    };

    // If we're about to drop old items past the cap, also delete their local files
    const updated = [newItem, ...items].slice(0, GALLERY_MAX_ITEMS);
    const dropped = items.slice(GALLERY_MAX_ITEMS - 1); // items that fell off the end
    for (const dropped_item of dropped) {
      if (dropped_item.isLocal && dropped_item.imageUrl?.startsWith('file://')) {
        try {
          await FileSystem.deleteAsync(dropped_item.imageUrl, { idempotent: true });
        } catch {}
      }
    }

    await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return newItem;
  } catch (err) {
    console.error('[Gallery] save error:', err);
    return null;
  }
}

// Rebuild the gallery index from the FunnyFy MediaLibrary album.
// Called after reinstall (when AsyncStorage is empty but photos still exist on the phone).
async function rebuildGalleryFromMediaLibrary() {
  try {
    console.log('[Gallery] Starting rebuild from MediaLibrary...');

    // Request permission — pass `true` for granular READ_MEDIA_IMAGES on Android 13+
    let permResult = await MediaLibrary.getPermissionsAsync();
    if (permResult.status !== 'granted') {
      permResult = await MediaLibrary.requestPermissionsAsync(true);
    }
    if (permResult.status !== 'granted') {
      console.warn('[Gallery] No MediaLibrary permission — cannot rebuild');
      return [];
    }

    let assets = [];

    try {
      let after = undefined;
      let hasMore = true;
      const PAGE = 100;

      while (hasMore && assets.length < GALLERY_MAX_ITEMS) {
        const result = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.photo,
          first: PAGE,
          after,
          sortBy: MediaLibrary.SortBy.creationTime,
        });

        const matching = result.assets.filter((a) =>
          a.filename?.toLowerCase().startsWith('funnyfy')
        );
        assets.push(...matching);

        hasMore = result.hasNextPage;
        after = result.endCursor;
        if (result.assets.length < PAGE) hasMore = false;
      }

      console.log('[Gallery] Rebuilt', assets.length, 'items from media library');
    } catch (e) {
      console.warn('[Gallery] MediaLibrary scan failed:', e.message);
    }

    const rebuilt = assets.map((asset) => ({
      id: `media_${asset.id}`,
      imageUrl: asset.uri,
      remoteUrl: null,
      isLocal: true,
      styleLabel: 'FunnyFy',
      styleId: null,
      createdAt: asset.creationTime,
    }));

    if (rebuilt.length > 0) {
      await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(rebuilt));
      console.log('[Gallery] Rebuilt and saved', rebuilt.length, 'items');
    }

    return rebuilt;
  } catch (err) {
    console.warn('[Gallery] rebuildGalleryFromMediaLibrary error:', err.message || err);
    return [];
  }
}

async function loadGallery() {
  try {
    const data = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = data ? JSON.parse(data) : [];

    // If nothing in storage (e.g. after reinstall), try to rebuild from the FunnyFy album
    if (items.length === 0) {
      return await rebuildGalleryFromMediaLibrary();
    }

    // Filter out items whose local file no longer exists (e.g. user cleared app data)
    const verified = [];
    for (const item of items) {
      if (item.isLocal && item.imageUrl?.startsWith('file://')) {
        try {
          const info = await FileSystem.getInfoAsync(item.imageUrl);
          if (info.exists) {
            verified.push(item);
          }
        } catch {
          // File missing, skip it
        }
      } else if (item.isLocal && item.imageUrl) {
        // MediaLibrary URI (content:// or ph://) — always include; OS manages these
        verified.push(item);
      } else {
        // Remote URL — keep (may still work briefly)
        verified.push(item);
      }
    }

    // If items were dropped, persist the cleaned list
    if (verified.length !== items.length) {
      await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(verified));
    }

    return verified;
  } catch (err) {
    console.error('[Gallery] load error:', err);
    return [];
  }
}

async function deleteFromGallery(id) {
  try {
    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = existing ? JSON.parse(existing) : [];
    const target = items.find((item) => item.id === id);
    const updated = items.filter((item) => item.id !== id);

    // Also delete the local file if applicable
    if (target?.isLocal && target?.imageUrl?.startsWith('file://')) {
      try {
        await FileSystem.deleteAsync(target.imageUrl, { idempotent: true });
      } catch {}
    }

    await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('[Gallery] delete error:', err);
    return false;
  }
}

async function clearGallery() {
  try {
    // Delete all local files
    const existing = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
    const items = existing ? JSON.parse(existing) : [];
    for (const item of items) {
      if (item.isLocal && item.imageUrl?.startsWith('file://')) {
        try {
          await FileSystem.deleteAsync(item.imageUrl, { idempotent: true });
        } catch {}
      }
    }
    await AsyncStorage.removeItem(GALLERY_STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('[Gallery] clear error:', err);
    return false;
  }
}

// Gallery Screen — shows past caricatures stored locally
function GalleryScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const refresh = async () => {
    setLoading(true);
    const data = await loadGallery();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (item) => {
    showDialog({
      title: 'Delete caricature?',
      message: 'This only removes it from your in-app gallery. Photos already saved to your phone are not affected.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        await deleteFromGallery(item.id);
        refresh();
        showToast('Removed', 'Caricature removed from gallery', 'success');
      },
    });
  };

  const handleClearAll = () => {
    showDialog({
      title: 'Clear all caricatures?',
      message: 'This removes all items from your in-app gallery. Photos saved to your phone are not affected.',
      confirmLabel: 'Clear All',
      destructive: true,
      onConfirm: async () => {
        closeDialog();
        await clearGallery();
        refresh();
        showToast('Gallery cleared', 'All caricatures removed', 'success');
      },
    });
  };

  // Share the currently-viewed image
  const handleViewerShare = useCallback(async () => {
    const item = items[viewerIndex];
    if (!item) return;
    try {
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.cacheDirectory + fileName;
      const dl = await FileSystem.downloadAsync(item.imageUrl, localPath);
      await Sharing.shareAsync(dl.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Check out my caricature!',
      });
    } catch (err) {
      console.error('[Gallery] share error:', err);
    }
  }, [items, viewerIndex]);

  // Footer rendered inside the image viewer
  const renderViewerFooter = useCallback(() => {
    const item = items[viewerIndex];
    if (!item) return null;
    return (
      <View style={[styles.viewerFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Text style={styles.viewerFooterLabel} numberOfLines={1}>
          {item.styleLabel || 'Caricature'}
        </Text>
        <View style={styles.viewerActionsRow}>
          <TouchableOpacity style={styles.viewerActionButton} onPress={handleViewerShare}>
            <Text style={styles.viewerActionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [items, viewerIndex, handleViewerShare, insets.bottom]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={styles.galleryContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>My Caricatures</Text>
          <View style={styles.galleryHeaderActions}>
            {items.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.iconButton}>
                <Text style={styles.galleryClearIcon}>🗑</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <Text style={styles.iconButtonIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.galleryLoadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.galleryEmptyContainer}>
            <View style={styles.galleryEmptyIcon}>
              <Text style={styles.galleryEmptyIconText}>✦</Text>
            </View>
            <Text style={styles.galleryEmptyTitle}>No caricatures yet</Text>
            <Text style={styles.galleryEmptyText}>
              Your generated caricatures will show up here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.galleryGrid}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={() => {
                    setViewerIndex(index);
                    setViewerVisible(true);
                  }}
                  onLongPress={() => handleDelete(item)}
                  activeOpacity={1}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.galleryItemImage} />
                  <View style={styles.galleryItemLabel}>
                    <Text style={styles.galleryItemStyle} numberOfLines={1}>
                      {item.styleLabel || 'Caricature'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.galleryHint}>Long-press an item to delete</Text>
          </ScrollView>
        )}
      </View>

      {/* Fullscreen image viewer with pinch-zoom and swipe gestures */}
      <ImageView
        images={items.map((item) => ({ uri: item.imageUrl }))}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        onImageIndexChange={(idx) => setViewerIndex(idx)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        FooterComponent={renderViewerFooter}
      />
    </SafeAreaView>
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
      
      {/* Fixed header */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerBar}>
          <Text style={styles.wordmark}>FunnyFy</Text>
          <TouchableOpacity onPress={onOpenMenu} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content under fixed header */}
      <ScrollView 
        contentContainerStyle={styles.styleContainer}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
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

// Photo Chooser Screen — browse recent photos before uploading
function PhotoChooserScreen({ onSelectPhoto, onClose }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useNotifications();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          showToast('Permission needed', 'Gallery access is required to browse photos', 'warning');
          return;
        }

        const allAssets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 100,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        setPhotos(allAssets.assets || []);
      } catch (err) {
        console.error('Failed to load photos:', err);
        showToast('Error', 'Failed to load photos from gallery', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const handleSelectPhoto = async (asset) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      onSelectPhoto({
        uri: asset.uri,
        dataUrl: dataUrl,
      });
    } catch (err) {
      console.error('Failed to read photo:', err);
      showToast('Error', 'Failed to load photo', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={[styles.photoChooserContainer, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
        {/* Header */}
        <View style={styles.photoChooserHeader}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>Choose Photo</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Photo Grid */}
        {loading ? (
          <View style={styles.photoChooserLoadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.photoChooserEmptyContainer}>
            <Text style={styles.photoChooserEmptyText}>No photos found</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.photoGrid}>
              {photos.map((asset, index) => (
                <TouchableOpacity
                  key={asset.id}
                  style={styles.photoGridItem}
                  onPress={() => handleSelectPhoto(asset)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: asset.uri }}
                    style={styles.photoGridImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function UploadScreen({ style, onStart, onBackToStyle, canGenerateMore, subscriptionInfo, onSubscribe }) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [imageUri, setImageUri] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [picking, setPicking] = useState(false);
  const [pickingSource, setPickingSource] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      showToast('Error', error, 'error');
      setError('');
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
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
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
          allowsEditing: true,
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

  // Crop the current image by re-opening it in the gallery picker with editing enabled
  const handleCrop = async () => {
    if (!imageUri || picking) return;
    setPicking(true);
    setError('');
    try {
      // Save current image to a temp file the picker can read, then launch editor
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageDataUrl(`data:image/jpeg;base64,${base64}`);
        } catch (fsErr) {
          console.error('Failed to read cropped image:', fsErr);
          setError('Failed to read cropped image.');
        }
      }
    } catch (err) {
      console.error('Crop error:', err);
      setError('Failed to crop image.');
    } finally {
      setPicking(false);
    }
  };

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
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
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
                showDialog({
                  title: 'Quota Exceeded',
                  message: `You've used all ${quotaInfo.limit} caricatures this month. Upgrade your plan to continue generating amazing caricatures!`,
                  cancelLabel: 'Cancel',
                  confirmLabel: 'Upgrade',
                  onCancel: closeDialog,
                  onConfirm: () => {
                    closeDialog();
                    onSubscribe();
                  },
                });
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
          {/* Hero icon — sprinkle of color */}
          <View style={styles.paywallHeroIconWrapper}>
            <View style={styles.paywallHeroIcon}>
              <Text style={styles.paywallHeroIconText}>✦</Text>
            </View>
          </View>

          {/* Current plan card — compact */}
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

function ResultScreen({ original, result, loading, error, failedAttempts = 0, onRetry, onBack, onHome, subscriptionInfo, backHandlerRef }) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog, closeDialog } = useNotifications();
  const imageUrl = result ? getImageUrlFromOutput(result.output) : null;
  const [mix, setMix] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const hasResult = !!result && !!imageUrl;
  const maxRetriesReached = error && failedAttempts >= 3;

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
      await Sharing.shareAsync(resultDl.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Check out my caricature!',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Save to gallery on the result screen (called by tapping Save button in callApi)
  // Auto-save to gallery index only (no DCIM/Pictures) — user explicitly saves via Save button
  const handleDownload = async (opts = {}) => {
    const { silent = false } = opts;
    if (!imageUrl || loading) return false;
    try {
      const fileName = getSavedImageFileName();
      const localPath = FileSystem.documentDirectory + fileName;

      const resultDl = await FileSystem.downloadAsync(imageUrl, localPath);

      let saved = false;
      let savedPath = '';

      // Save to FunnyFy album (industry standard - shows as FunnyFy album in Gallery)
      try {
        const ok = await saveToFunnyfyAlbum(resultDl.uri);
        if (ok) {
          saved = true;
          savedPath = Platform.OS === 'android'
            ? `Gallery › ${FUNNYFY_FOLDER_NAME} album`
            : 'Photos';
        }
      } catch (saveErr) {
        console.warn('[Save] saveToFunnyfyAlbum failed, trying fallback:', saveErr);
      }

      // Fallback: open share sheet if all save attempts failed
      if (!saved) {
        await Sharing.shareAsync(resultDl.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save image',
        });
      }

      if (saved) {
        setHasBeenSaved(true);
        if (!silent) {
          showToast('Saved', savedPath, 'success');
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
      showDialog({
        title: 'Save before leaving?',
        message: 'Your caricature hasn\'t been saved yet. What would you like to do?',
        cancelLabel: 'Cancel',
        neutralLabel: 'Discard',
        neutralDestructive: true,
        confirmLabel: 'Save',
        destructive: false,
        onCancel: closeDialog,
        onNeutral: () => {
          closeDialog();
          navigate();
        },
        onConfirm: async () => {
          closeDialog();
          const didSave = await handleDownload({ silent: true });
          if (didSave) {
            showToast('Saved', `Gallery › ${FUNNYFY_FOLDER_NAME} album`, 'success');
            // Give the toast a beat to be seen before navigating
            setTimeout(() => navigate(), 400);
          } else {
            showToast('Save failed', 'Could not save the image', 'error');
          }
        },
      });
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
                    <Text style={styles.sliderKnobText}>‹›</Text>
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
                  <SkeletonLoader />
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
                  <View style={styles.errorRetryHeader}>
                    <Feather name="alert-circle" size={18} color="#B45309" />
                    <Text style={styles.errorRetryMessage}>{error}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={onRetry}
                    style={styles.retryButton}
                    disabled={loading}
                  >
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }, (!hasResult || loading) && styles.buttonDisabled]}
                  onPress={handleDownload}
                  disabled={!hasResult || loading}
                >
                  <Text style={styles.primaryButtonText} numberOfLines={1}>Save</Text>
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
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { showToast, showDialog, closeDialog } = useNotifications();
  const [screen, setScreen] = useState('splash');
  const [style, setStyle] = useState(null);
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [pendingJobId, setPendingJobId] = useState(null);
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
        
        // Show a network error dialog if the app launched with no connectivity
        const isNetworkError = err.message?.includes('Failed to fetch') || 
                                err.message?.includes('Network request failed') ||
                                err.message?.includes('NetworkError');
        if (isNetworkError) {
          setTimeout(() => {
            showDialog({
              title: 'No internet connection',
              message: 'FunnyFy requires an internet connection. Please check your network and try again.',
              confirmLabel: 'Retry',
              onConfirm: () => {
                closeDialog();
                // Retry fetching styles
                fetchStyles();
              },
            });
          }, 500);
        }
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

        // Failsafe: stop loading after 90 seconds no matter what
        const failsafeTimer = setTimeout(() => {
          console.warn('[callApi] Failsafe timeout reached - forcing loading off');
          setLoading(false);
          setError('Request timed out. Please try again.');
        }, 90000);

        try {
          // Step 1: Enqueue the job
          const enqueueRes = await fetch(`${API_BASE}/api/enqueue`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              userId: userIdRef.current,
              payload: {
                styleId: style.id,
                imageUrl: imageDataUrl || null,
              },
            }),
          });

          const enqueueText = await enqueueRes.text();
          let enqueueJson = null;
          try {
            enqueueJson = JSON.parse(enqueueText);
          } catch (parseErr) {
            console.error('Enqueue - JSON parse error:', parseErr);
            setError('Server returned invalid response. Please try again.');
            setFailedAttempts((prev) => prev + 1);
            return;
          }

          if (!enqueueRes.ok || !enqueueJson.ok) {
            const msg =
              enqueueJson?.message ||
              enqueueJson?.error?.error ||
              enqueueJson?.error ||
              enqueueJson?.detail ||
              `Request failed with status ${enqueueRes.status}`;
            throw new Error(String(msg));
          }

          const jobId = enqueueJson.jobId;
          if (!jobId) {
            throw new Error('No job ID returned from server');
          }
          setPendingJobId(jobId); // store so retry can resume polling

          // Kick the queue worker immediately so the job starts processing now,
          // instead of waiting for the next scheduled cron tick (up to ~60s).
          // Uses the user's JWT (already in headers) — no secret embedded in the app.
          // Fire-and-forget: we don't await it, polling below picks up the result.
          fetch(`${API_BASE}/api/cron/process-queue`, {
            method: 'GET',
            headers: getApiHeaders(),
          }).catch((kickErr) => {
            console.warn('[callApi] queue kick failed (non-fatal, cron will pick up):', kickErr?.message || kickErr);
          });

          // Step 2: Poll for job completion
          const terminalStatuses = new Set(['completed', 'failed']);
          const maxAttempts = 40; // 40 * 2s = 80s

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const jobRes = await fetch(`${API_BASE}/api/job?id=${encodeURIComponent(jobId)}`, {
              method: 'GET',
              headers: getApiHeaders(),
            });

            if (!jobRes.ok) {
              throw new Error(`Failed to check job status: HTTP ${jobRes.status}`);
            }

            const jobData = await jobRes.json();
            if (!jobData.ok) {
              throw new Error(jobData.error || 'Failed to check job status');
            }

            const jobInfo = jobData.job;

            if (terminalStatuses.has(jobInfo.status)) {
              if (jobInfo.status === 'completed' && jobInfo.outputImageUrl) {
                // Success — format as Replicate-style output for result screen
                setResult({
                  status: 'succeeded',
                  output: jobInfo.outputImageUrl,
                });
                setFailedAttempts(0);

                // Save to local gallery
                try {
                  await saveToGallery({
                    imageUrl: jobInfo.outputImageUrl,
                    styleLabel: style?.label || 'Caricature',
                    styleId: style?.id,
                  });
                } catch (galleryErr) {
                  console.warn('[Gallery] failed to save (non-fatal):', galleryErr);
                }

                // Auto-refresh subscription after successful generation
                setTimeout(async () => {
                  console.log('[App] Auto-refreshing subscription after generation...');
                  await refreshSubscription();
                }, 500);

                return; // Done
              } else {
                throw new Error(jobInfo.errorMessage || 'Image generation failed');
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          throw new Error('Image generation timed out. Please check My Caricatures later.');
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

          // For NSFW/inappropriate image errors, show a dialog
          if (userMessage.toLowerCase().includes('cannot be processed') || 
              userMessage.toLowerCase().includes('appropriate')) {
            showDialog({
              title: 'Image not supported',
              message: 'This image cannot be processed. Please use an appropriate photo.',
              confirmLabel: 'Try again',
              onConfirm: () => {
                closeDialog();
                setScreen('upload');
                setError('');
                setFailedAttempts(0);
              },
            });
            return;
          }

          setError(userMessage);
          setFailedAttempts((prev) => prev + 1);
        } finally {
          clearTimeout(failsafeTimer);
          setLoading(false);
        }
      },
    [style]
  );

  const handleSubscribe = async (selectedTier = null) => {
    // Defensive: if called from a TouchableOpacity onPress directly,
    // the arg may be a synthetic event object instead of a tier string.
    if (selectedTier && typeof selectedTier !== 'string') {
      selectedTier = null;
    }
    setSubscribeLoading(true);
    setError('');
    try {
      if (!hasRcKey) {
        showToast('Subscriptions', 'RevenueCat SDK key is missing. Please set EXPO_PUBLIC_REVENUECAT_* env vars.', 'error');
        setSubscribeLoading(false);
        return;
      }

      console.log('[RevenueCat] Fetching offerings...');
      const pkgs = await getOfferings();
      
      if (!pkgs || pkgs.length === 0) {
        showToast('Subscriptions', 'No subscription packages available yet', 'error');
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

          showToast('Purchase successful', 'Your subscription is now active', 'success');

          // Refresh subscription immediately (sync should have updated it)
          setTimeout(async () => {
            console.log('[RevenueCat] Refreshing subscription after purchase...');
            await refreshSubscription();
          }, 1000);
        } else {
          console.warn('[RevenueCat] Purchase completed but no active entitlements found');
          showToast('Purchase completed', 'Subscription will appear shortly. Refresh if it doesn\'t update.', 'warning');
          // Still try to refresh
          setTimeout(async () => {
            await refreshSubscription();
          }, 3000);
        }
      } else {
        console.warn('[RevenueCat] Purchase result missing customerInfo');
        showToast('Purchase processing', 'Subscription will appear shortly', 'info');
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

      showToast('Purchase failed', errorMessage, 'error');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!hasRcKey) {
      showToast('Restore', 'RevenueCat is not configured', 'error');
      return;
    }
    setSubscribeLoading(true);
    try {
      const customerInfo = await restorePurchases();
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      if (Object.keys(activeEntitlements).length > 0) {
        showToast('Restored', 'Your previous purchase has been restored', 'success');
        setTimeout(() => refreshSubscription(), 1000);
      } else {
        showToast('No purchases found', 'No previous purchases on this account', 'info');
      }
    } catch (err) {
      console.error('[RevenueCat] Restore error:', err);
      showToast('Restore failed', 'Could not restore purchases. Please try again.', 'error');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    showDialog({
      title: 'Cancel Subscription?',
      message: 'Your subscription will remain active until the end of the current billing period.',
      cancelLabel: 'Keep Subscription',
      confirmLabel: 'Cancel Subscription',
      destructive: true,
      onCancel: closeDialog,
      onConfirm: async () => {
        closeDialog();
        setSubscribeLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/cancel-subscription`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({ userId: userIdRef.current }),
          });

          const json = await res.json();
          if (json.ok) {
            showToast(
              'Subscription cancelled',
              'Active until end of current period. Resubscribe anytime.',
              'success'
            );
            setTimeout(async () => {
              await refreshSubscription();
            }, 1000);
          } else {
            showToast('Error', json.error || 'Failed to cancel subscription', 'error');
          }
        } catch (err) {
          console.error('[Cancel Subscription] error:', err);
          showToast('Error', 'Failed to cancel subscription. Try again later.', 'error');
        } finally {
          setSubscribeLoading(false);
        }
      },
    });
  };

  const handleUploadStart = async ({ imageUri, imageDataUrl }) => {
    setOriginal({ imageUri, prompt: style?.prompt });
    setPendingJobId(null); // will be set after enqueue
    setFailedAttempts(0);
    setError('');
    setScreen('result');
    await callApi({ imageDataUrl });
  };

  const handleRetry = async () => {
    // If there's a pending job still in the queue, poll it instead of creating a new one
    if (pendingJobId) {
      setError('');
      setLoading(true);
      const terminalStatuses = new Set(['completed', 'failed']);
      const maxAttempts = 40;
      try {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const jobRes = await fetch(`${API_BASE}/api/job?id=${encodeURIComponent(pendingJobId)}`, {
            method: 'GET',
            headers: getApiHeaders(),
          });
          const jobData = await jobRes.json();
          const jobInfo = jobData.job;
          if (terminalStatuses.has(jobInfo.status)) {
            if (jobInfo.status === 'completed' && jobInfo.outputImageUrl) {
              setResult({ status: 'succeeded', output: jobInfo.outputImageUrl });
              setFailedAttempts(0);
              try {
                await saveToGallery({ imageUrl: jobInfo.outputImageUrl, styleLabel: style?.label || 'Caricature', styleId: style?.id });
              } catch {}
              setTimeout(() => refreshSubscription(), 500);
              return;
            } else {
              throw new Error(jobInfo.errorMessage || 'Image generation failed');
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        throw new Error('Image generation timed out. Please check My Caricatures later.');
      } catch (err) {
        setError(err.message || 'Generation failed');
        setFailedAttempts((prev) => prev + 1);
      } finally {
        setLoading(false);
      }
    }
    // No pending job — user must go back and start fresh
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
      if (screen === 'subscription' || screen === 'privacy' || screen === 'terms' || screen === 'about' || screen === 'gallery') {
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
    return <SplashScreen onComplete={() => setScreen('style')} />;
  }

  if (screen === 'style') {
    return (
      <>
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
      </>
    );
  }

  if (screen === 'privacy') {
    return (
      <InfoScreen
        title="Privacy Policy"
        content={PRIVACY_POLICY_TEXT}
        onBack={() => setScreen('style')}
      />
    );
  }

  if (screen === 'terms') {
    return (
      <InfoScreen
        title="Terms & Conditions"
        content={TERMS_TEXT}
        onBack={() => setScreen('style')}
      />
    );
  }

  if (screen === 'about') {
    return (
      <InfoScreen
        title="About"
        content={ABOUT_TEXT}
        onBack={() => setScreen('style')}
      />
    );
  }

  if (screen === 'gallery') {
    return <GalleryScreen onBack={() => setScreen('style')} />;
  }

  if (screen === 'subscription') {
    return (
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
    );
  }

  if (screen === 'upload') {
    return (
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
    );
  }

  if (screen === 'result') {
    return (
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    flexGrow: 1,
  },
  fixedHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
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
    marginTop: 12,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    width: '48%',
    marginBottom: 16,
  },
  styleCard: {
    marginTop: 0,
    marginBottom: 16,
  },
  styleCardSelected: {
    transform: [{ scale: 0.97 }],
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
    aspectRatio: 3 / 4.4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F7F7F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
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
  skeletonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  skeletonSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  skeletonBar: {},
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
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 12,
  },
  errorRetryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorRetryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  errorRetrySubtext: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  errorRetryMessage: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 20,
  },
  errorRetryHint: {
    fontSize: 12,
    color: '#B45309',
  },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: 11,
    paddingHorizontal: 32,
    backgroundColor: '#0F172A',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSubscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
    marginHorizontal: 8,
  },
  resultSubscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
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
    backgroundColor: '#0F172A',
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
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  styleCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 19,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  styleCardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  // Upload screen — refined
  photoPlaceholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoPlaceholderIconText: {
    fontSize: 28,
    color: '#0F172A',
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
    backgroundColor: '#0F172A',
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
  // Photo Chooser Screen
  photoChooserContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  photoChooserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoChooserLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoChooserEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoChooserEmptyText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 8,
  },
  photoGridItem: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F7F7F8',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  menuHeader: {},
  menuHeaderIcon: {},
  menuHeaderIconText: {},
  menuHeaderTitle: {},
  menuHeaderSub: {},
  menuDivider: {},
  menuItemsContainer: {},
  menuItemDivider: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuItemIcon: {
    marginRight: 14,
  },
  menuItemIconWrap: {},
  menuItemContent: {},
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  menuItemDesc: {},
  menuItemArrow: {},
  // Gallery screen
  galleryContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  galleryClearIcon: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  galleryHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  galleryEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  galleryEmptyIconText: {
    fontSize: 26,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 30,
  },
  galleryEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  galleryEmptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 12,
    rowGap: 12,
  },
  galleryItem: {
    width: '48%',
    marginBottom: 4,
  },
  galleryItemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F7F7F8',
  },
  galleryItemLabel: {
    marginTop: 6,
  },
  galleryItemStyle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  galleryHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  // Image viewer footer (Save / Share buttons over fullscreen viewer)
  viewerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 10,
  },
  viewerFooterLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewerActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewerActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  paywallUpgradePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
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
    backgroundColor: '#0F172A',
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
    borderColor: '#0F172A',
  },
  paywallTierCardCurrent: {
    backgroundColor: '#F1F5F9',
    borderColor: '#0F172A',
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
    backgroundColor: '#0F172A',
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
    backgroundColor: '#0F172A',
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
  paywallHeroIconWrapper: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  paywallHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallHeroIconText: {
    fontSize: 26,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 30,
  },
  paywallCancelLink: {
    fontSize: 13,
    color: '#A32D2D',
    fontWeight: '500',
    paddingVertical: 8,
  },
  cropScreenSafe: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  cropScreenContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  cropScreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  cropScreenBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cropScreenBackIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  cropScreenDoneButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  cropScreenDoneText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cropScreenCanvasWrapper: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  cropScreenCanvas: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  cropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cropOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cropBoxBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  cropHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHandleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F172A',
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

  // ---- Toast notification ----
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  toastIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toastIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  toastTextWrap: {
    flex: 1,
    gap: 1,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },

  // ---- Confirmation dialog ----
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  dialogMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  dialogCancelText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 15,
  },
  dialogConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  dialogConfirmDestructive: {
    backgroundColor: '#0F172A',
  },
  dialogConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  dialogConfirmTextDestructive: {
    color: '#FFFFFF',
  },
  dialogNeutralButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dialogNeutralDestructive: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  dialogNeutralText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 15,
  },
  dialogNeutralTextDestructive: {
    color: '#EF4444',
  },
});
