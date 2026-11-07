import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import {
  configureAndroidNavigationBar,
  hideAndroidNavigationBar,
} from './utils/androidNavigationBar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import {
  initRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
  getCurrentAppUserId,
  collectRcIdentityIds,
  hasRevenueCatKey,
  isConfigured as isRcConfigured,
  loginUser,
  getActiveSubscriptionDetails,
  getSubscriptionBillingState,
  openSubscriptionManagement,
  getStoreSubscriptionLabel,
  tierFromProductId,
  describePurchaseError,
} from './services/revenuecat';
import { initAuth, resetAuthIfLocal, forceReAuth, hasStoredAuth } from './services/auth.js';
import NotificationProvider, { useNotifications } from './components/NotificationProvider';
import NetworkProvider, { useNetwork } from './components/NetworkProvider';
import GalleryScreen from './screens/GalleryScreen';
import MenuScreen from './screens/MenuScreen';
import UsageScreen from './screens/UsageScreen';
import InfoScreen from './screens/InfoScreen';
import StyleScreen from './screens/StyleScreen';
import AppSplash from './components/AppSplash';
import ConfirmDialog from './components/ConfirmDialog';
import UploadScreen from './screens/UploadScreen';
import PhotoReviewScreen from './screens/PhotoReviewScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ResultScreen from './screens/ResultScreen';
import StickerPackScreen from './screens/StickerPackScreen';
import { getStyleCategory } from './utils/styleCategories';
import {
  STICKER_PACK_MAX,
  STICKER_PACK_SIZE_HINT,
  STICKER_SHEET_STYLE_ID,
  canBuildStickerPack,
  isStickerStyle,
  stickerPackQuotaMessage,
  stickerSheetStyle,
  toggleStickerSelection,
} from './utils/stickerPack';
import { DARK_BG } from './constants/theme';
import {
  API_BASE,
  PRIVACY_POLICY_TEXT,
  TERMS_TEXT,
  SUPPORT_EMAIL,
  APP_STORE_LISTING_URL,
} from './constants';
import { mergeServerStyles, getServerConfirmedStyleIds } from './utils/mergeServerStyles';
import { readStylesCache, writeStylesCache } from './utils/stylesCache';
import { formatSubscriptionDate, getDisplayRenewalDate } from './utils/subscriptionDates';
import { getTierName, isSubscriptionDowngrade, isSubscriptionUpgrade } from './utils/subscriptionTiers';
import {
  canUseGenerationQuota,
  requiresSubscriptionPaywall,
} from './utils/usageQuota';
import {
  getInstalledAppVersion,
  shouldForceUpdate,
  shouldPromptUpdate,
  shouldShowSoftUpdatePrompt,
  snoozeSoftUpdatePrompt,
} from './utils/appVersion';
import {
  isNsfwContentError,
  buildContentPolicyDialog,
  buildGenerationFailedDialog,
  SERVER_UNREACHABLE_MESSAGE,
  TAKING_LONGER_MESSAGE,
  BLANK_OUTPUT_MESSAGE,
} from './utils/contentErrors';
import {
  isContentPolicyError,
  recordContentViolation,
  ContentPolicyBlockedError,
} from './utils/contentViolations';
import { pollJobUntilDone } from './utils/jobClient';
import { NO_INTERNET_MESSAGE, NO_INTERNET_TITLE } from './utils/network';
import { setSentryUser, captureAppError } from './utils/sentry';
import { openContactSupport, openStyleRequest } from './utils/contactSupport';
import { shareApp } from './utils/shareApp';
import { markRateAppRated, openPlayStoreListing } from './utils/rateApp';
import { hasSeenOnboarding, markOnboardingSeen } from './utils/onboardingPrefs';

// Enforce HTTPS for security — prevent accidental HTTP misconfiguration
if (API_BASE.startsWith('http://') && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')) {
  console.error('[Security] API_BASE must use HTTPS in production. Refusing to start with insecure URL.');
  throw new Error('Insecure API URL: HTTPS required for production');
}

const devLog = (...args) => {
  if (__DEV__) console.log(...args);
};

const STARTUP_FAILSAFE_MS = 12_000;
const RC_STARTUP_TIMEOUT_MS = 8_000;
const EXIT_CONFIRM_MS = 2000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
  });

  useEffect(() => {
    if (fontError) {
      console.warn('[Fonts] Failed to load:', fontError?.message || fontError);
    }
  }, [fontError]);

  // Do not gate the UI on fonts — custom font can load in the background.
  void fontsLoaded;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NotificationProvider>
        <NetworkProvider>
          <AppContent />
        </NetworkProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

function AppShell({ children }) {
  return (
    <View style={{ flex: 1, backgroundColor: DARK_BG }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {children}
    </View>
  );
}

function AppContent() {
  const { showToast, showDialog, closeDialog } = useNotifications();
  const { isOnline } = useNetwork();
  const [screen, setScreen] = useState('style');
  const [style, setStyle] = useState(null);
  // pickedImage: { uri, dataUrl } | null — full photo from picker for review → generate.
  const [pickedImage, setPickedImage] = useState(null);
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [pendingJobId, setPendingJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [updatePrompt, setUpdatePrompt] = useState(null);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [hasRcKey, setHasRcKey] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [restyleMode, setRestyleMode] = useState(false);
  const [styleReturnCategory, setStyleReturnCategory] = useState(null);
  const [selectedStickerIds, setSelectedStickerIds] = useState([]);
  const [stickerPackError, setStickerPackError] = useState('');
  const [stickerPackPending, setStickerPackPending] = useState(false);
  const [stickerPackSheetUrl, setStickerPackSheetUrl] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const userIdRef = useRef(null);
  const authTokenRef = useRef(null);
  const authInitPromiseRef = useRef(null);
  const resultBackHandlerRef = useRef(null);
  const styleBackHandlerRef = useRef(null);
  const lastExitPressRef = useRef(0);
  const pendingFailureDialogRef = useRef(null);
  const subscriptionRefreshSeqRef = useRef(0);
  const revenueCatExpirationRef = useRef(null);
  const wasOnlineRef = useRef(true);
  const serverStyleIdsRef = useRef(null);
  const hasStylesRef = useRef(false);
  /** Show paywall once per cold start when the user has no active plan. */
  const launchPaywallShownRef = useRef(false);
  /** First-launch onboarding — wait for AsyncStorage before paywall. */
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const onboardingShownRef = useRef(false);

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

  const handleContentPolicyBlock = useCallback(
    (err, { styleId } = {}) => {
      const infringementCount =
        err?.infringementCount != null ? err.infringementCount : 0;

      recordContentViolation({
        jobId: err?.jobId || null,
        styleId: styleId || err?.styleId || null,
        source: err?.source || 'unknown',
        rawMessage: err?.rawErrorMessage || err?.message || null,
        infringementCount: err?.infringementCount ?? null,
      });

      showDialog({
        ...buildContentPolicyDialog(infringementCount),
        onConfirm: () => {
          closeDialog();
          setPickedImage(null);
          setScreen('upload');
          setFailedAttempts(0);
        },
      });
    },
    [showDialog, closeDialog]
  );

  const notifyGenerationFailure = useCallback(
    (err) => {
      const dialog = buildGenerationFailedDialog(err);
      showDialog({
        ...dialog,
        onConfirm: closeDialog,
      });
      return dialog.message;
    },
    [showDialog, closeDialog]
  );

  // Present deferred failure dialogs after loading UI settles (Android Modal race).
  useEffect(() => {
    if (loading) return;
    const pending = pendingFailureDialogRef.current;
    if (!pending) return;
    pendingFailureDialogRef.current = null;
    notifyGenerationFailure(pending);
  }, [loading, notifyGenerationFailure]);

  const applyAuthState = (auth) => {
    if (!auth?.userId) return auth;
    setUserId(auth.userId);
    setAuthToken(auth.token || null);
    userIdRef.current = auth.userId;
    authTokenRef.current = auth.token || null;
    setSentryUser(auth.userId);
    return auth;
  };

  const linkRevenueCatToBackend = async (backendUserId) => {
    if (!hasRevenueCatKey() || !backendUserId) return null;
    try {
      const rcCustomerInfo = await loginUser(backendUserId);
      devLog('[RevenueCat] Linked to backend user:', backendUserId);
      return rcCustomerInfo;
    } catch (loginErr) {
      console.warn('[RevenueCat] logIn error (non-fatal):', loginErr?.message || loginErr);
      return null;
    }
  };

  const performAuthInit = async () => {
    const hasKey = hasRevenueCatKey();
    setHasRcKey(hasKey);

    let rcIdentity = null;
    let isCleanInstall = false;
    if (hasKey) {
      try {
        await withTimeout(initRevenueCat(null), RC_STARTUP_TIMEOUT_MS, 'RevenueCat init');
        // Clean install: restore before minting a backend user so we reuse the
        // existing RC-linked account (same usage) instead of creating a new UUID.
        const stored = await hasStoredAuth();
        isCleanInstall = !stored;
        if (isCleanInstall) {
          try {
            await withTimeout(
              restorePurchases(),
              Math.max(RC_STARTUP_TIMEOUT_MS, 15_000),
              'RevenueCat restore',
            );
            devLog('[RevenueCat] Startup restore finished');
          } catch (restoreErr) {
            console.warn(
              '[RevenueCat] Startup restore skipped:',
              restoreErr?.message || restoreErr,
            );
          }
        }
        const revenuecatIds = await collectRcIdentityIds();
        rcIdentity = { revenuecatIds };
        devLog('[RevenueCat] Identity ids:', revenuecatIds);
      } catch (err) {
        console.error('[RevenueCat] init error:', err);
      }
    } else {
      console.warn('[RevenueCat] Missing SDK key, skipping init');
    }

    await resetAuthIfLocal();

    let auth;
    try {
      auth = await initAuth(API_BASE, rcIdentity);
      applyAuthState(auth);
      devLog('[Auth] API_BASE:', API_BASE);
      devLog('[Auth] userId:', auth.userId);
      devLog('[Auth] hasToken:', !!auth.token);
      devLog('[Auth] isLocal:', !!auth.isLocal);

      if (auth.isLocal) {
        console.warn('[Auth] Running with local ID — backend unavailable. Check DATABASE_URL in Vercel.');
      } else if (auth.userId && auth.token && hasKey) {
        if (isCleanInstall) {
          // Serialize link → sync → reclaim so logIn(newUuid) cannot race reclaim(oldUuid).
          withTimeout(
            (async () => {
              await linkRevenueCatToBackend(auth.userId);
              const info = await getCustomerInfo();
              const active = info?.entitlements?.active || {};
              if (Object.keys(active).length === 0) return;
              await syncSubscriptionToBackend(info);
              await refreshSubscription().catch(() => {});
            })(),
            Math.max(RC_STARTUP_TIMEOUT_MS, 25_000),
            'Post-restore usage reclaim',
          ).catch((err) =>
            console.warn('[Auth] Post-restore reclaim failed:', err?.message || err),
          );
        } else {
          // Never block splash/authReady on Purchases.logIn — it can hang past the failsafe.
          withTimeout(
            linkRevenueCatToBackend(auth.userId),
            RC_STARTUP_TIMEOUT_MS,
            'RevenueCat link'
          ).catch((err) => console.warn('[RevenueCat] link deferred/failed:', err?.message || err));
        }
      }
    } catch (err) {
      console.error('[Auth] init error:', err);
      auth = { userId: null, token: null, isLocal: true };
    }

    return auth;
  };

  const refreshAuthToken = async () => {
    devLog('[Auth] Refreshing JWT...');
    let rcIdentity = null;
    if (hasRevenueCatKey()) {
      const revenuecatIds = await collectRcIdentityIds().catch(() => []);
      rcIdentity = revenuecatIds.length ? { revenuecatIds } : null;
    }
    const auth = await forceReAuth(API_BASE, rcIdentity);
    applyAuthState(auth);

    if (!auth.token && auth.isLocal) {
      console.warn('[Auth] Still no token after forceReAuth — backend may be unreachable');
      return auth;
    }

    if (auth.userId && auth.token && hasRevenueCatKey()) {
      withTimeout(
        linkRevenueCatToBackend(auth.userId),
        RC_STARTUP_TIMEOUT_MS,
        'RevenueCat link'
      ).catch((err) => console.warn('[RevenueCat] link deferred/failed:', err?.message || err));
    }

    return auth;
  };

  const ensureAuthenticated = async () => {
    if (authInitPromiseRef.current) {
      try {
        await authInitPromiseRef.current;
      } catch (err) {
        console.warn('[Auth] Waiting for init failed:', err?.message || err);
      }
    }

    if (userIdRef.current && authTokenRef.current) {
      return { userId: userIdRef.current, token: authTokenRef.current, isLocal: false };
    }

    return refreshAuthToken();
  };

  // Push RevenueCat purchase state to our backend (webhook may lag or be unconfigured)
  const syncSubscriptionToBackend = async (customerInfo, { pendingTier } = {}) => {
    if (!userIdRef.current || !authTokenRef.current) {
      await ensureAuthenticated();
    }

    const syncUserId = userIdRef.current;
    if (!syncUserId) {
      console.warn('[subscription] sync skipped — no backend userId');
      return { ok: false, error: 'no_user_id' };
    }

    const details = getActiveSubscriptionDetails(customerInfo);
    if (!details?.productIdentifier) {
      console.warn('[subscription] sync skipped — no active subscription in RevenueCat');
      return { ok: false, error: 'no_active_subscription' };
    }

    const { productIdentifier, expirationDate, storeTransactionId, isSandbox } = details;
    const tier = tierFromProductId(productIdentifier);

    try {
      const currentRcId = await getCurrentAppUserId().catch(() => null);
      const syncResponse = await fetch(`${API_BASE}/api/sync-subscription`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          userId: syncUserId,
          revenuecatUserId: customerInfo?.originalAppUserId,
          revenuecatAppUserId: currentRcId || undefined,
          productId: productIdentifier,
          tier,
          expirationDate: expirationDate || undefined,
          storeTransactionId: storeTransactionId || undefined,
          isSandbox: isSandbox === true,
          platform: Platform.OS,
          ...(pendingTier ? { pendingTier } : {}),
        }),
      });
      const syncResult = await syncResponse.json();
      if (syncResult.ok) {
        devLog('[subscription] Synced to backend:', syncResult.subscription);
        // Switch JWT via short-lived reclaimToken from sync (bare userId is rejected).
        const reclaimToken = syncResult.subscription?.reclaimToken;
        const canonicalId = syncResult.subscription?.reclaimUserId;
        if (reclaimToken && canonicalId && canonicalId !== userIdRef.current) {
          devLog('[Auth] Reclaiming restored account:', canonicalId);
          const revenuecatIds = await collectRcIdentityIds(customerInfo);
          if (currentRcId) revenuecatIds.push(currentRcId);
          const reclaimed = await forceReAuth(API_BASE, {
            reclaimToken,
            revenuecatIds,
          });
          applyAuthState(reclaimed);
          if (reclaimed?.userId && hasRevenueCatKey()) {
            await withTimeout(
              linkRevenueCatToBackend(reclaimed.userId),
              RC_STARTUP_TIMEOUT_MS,
              'RevenueCat reclaim link'
            ).catch((err) =>
              console.warn('[RevenueCat] reclaim link failed:', err?.message || err)
            );
          }
        }
      } else {
        console.warn('[subscription] Sync failed:', syncResult.error);
      }
      return syncResult;
    } catch (syncErr) {
      console.error('[subscription] Sync error:', syncErr);
      return { ok: false, error: String(syncErr?.message || syncErr) };
    }
  };

  useEffect(() => {
    const failsafe = setTimeout(() => {
      setAuthReady((ready) => {
        if (!ready) {
          console.warn('[Auth] Startup failsafe — continuing without full init');
        }
        return true;
      });
    }, STARTUP_FAILSAFE_MS);

    authInitPromiseRef.current = performAuthInit()
      .catch((err) => {
        console.error('[Auth] Startup init failed:', err);
        return null;
      })
      .finally(() => {
        clearTimeout(failsafe);
        setAuthReady(true);
      });

    return () => clearTimeout(failsafe);
  }, []);

  // Hide splash as soon as the JS tree mounts — don't wait on auth/fonts.
  // Auth continues in the background; screens already handle loading states.
  useEffect(() => {
    let cancelled = false;
    const hide = () => {
      if (cancelled) return;
      setSplashHidden(true);
      ExpoSplashScreen.hideAsync().catch(() => {});
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(hide);
    });
    const failsafe = setTimeout(hide, 800);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || !splashHidden) return undefined;

    if (screen === 'onboarding') {
      hideAndroidNavigationBar();
    } else {
      configureAndroidNavigationBar();
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') return;
      if (screen === 'onboarding') {
        hideAndroidNavigationBar();
      } else {
        configureAndroidNavigationBar();
      }
    });

    return () => { subscription.remove(); };
  }, [screen, splashHidden]);

  const refreshSubscription = async (retryCount = 0) => {
    const refreshSeq = ++subscriptionRefreshSeqRef.current;

    if (!userIdRef.current || !authTokenRef.current) {
      await ensureAuthenticated();
    }

    const currentUserId = userIdRef.current;
    if (!currentUserId) return;
    setSubscriptionLoading(true);
    const maxRetries = 2;

    try {
      let rcExpiration = revenueCatExpirationRef.current;
      let rcBillingState = null;
      if (hasRevenueCatKey()) {
        try {
          const customerInfo = await getCustomerInfo();
          await syncSubscriptionToBackend(customerInfo);
          const rcDetails = getActiveSubscriptionDetails(customerInfo);
          rcExpiration = rcDetails?.expirationDate || null;
          revenueCatExpirationRef.current = rcExpiration;
          rcBillingState = getSubscriptionBillingState(customerInfo);
        } catch (syncErr) {
          console.warn('[subscription] Pre-refresh sync failed (non-fatal):', syncErr);
        }
      }

      if (!authTokenRef.current) {
        console.warn('[subscription] No JWT token — refresh may fail in production. Re-authenticate if the plan never loads.');
      }

      const res = await fetch(`${API_BASE}/api/user/subscription?userId=${encodeURIComponent(currentUserId)}&debug=1`, {
        method: 'GET',
        headers: getApiHeaders(),
      });
      const text = await res.text();
      devLog('[subscription] response:', text);
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
        // Stale/invalid JWT — mint a fresh token and retry once
        if (
          retryCount < maxRetries &&
          (res.status === 401 || json?.error === 'AUTHENTICATION_REQUIRED')
        ) {
          await refreshAuthToken();
          return refreshSubscription(retryCount + 1);
        }
        // Retry on error response
        if (retryCount < maxRetries && res.status >= 500) {
          setTimeout(() => refreshSubscription(retryCount + 1), 1000);
          return;
        }
        // Don't clear subscription info on client errors (keep last known state)
        if (res.status >= 500 && refreshSeq === subscriptionRefreshSeqRef.current) {
          setSubscriptionInfo(null);
        }
        return;
      }
      if (refreshSeq === subscriptionRefreshSeqRef.current) {
        let subscription = json.subscription;
        if (subscription && rcBillingState) {
          subscription = {
            ...subscription,
            cancelAtPeriodEnd: rcBillingState.cancelAtPeriodEnd,
          };
        }
        setSubscriptionInfo({
          ...json,
          subscription,
          revenueCatExpiration: rcExpiration,
        });
      }
      return json;
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

  const applyStyles = useCallback((serverStyles) => {
    const merged = mergeServerStyles(serverStyles);
    hasStylesRef.current = merged.length > 0;
    serverStyleIdsRef.current = getServerConfirmedStyleIds(serverStyles);
    setAvailableStyles(merged);
    return merged;
  }, []);

  const applyUpdatePromptFromServer = useCallback(async (data) => {
    const latest = data?.latestAppVersion || null;
    const minRequired = data?.minRequiredAppVersion || null;
    const storeUrl = (data?.storeUrl || APP_STORE_LISTING_URL || '').trim();
    const installed = getInstalledAppVersion();
    const force =
      data?.forceUpdate === true || shouldForceUpdate(installed, minRequired);
    const soft =
      data?.updateAvailable === true || shouldPromptUpdate(installed, latest);

    if (force) {
      setUpdatePrompt({
        force: true,
        latestAppVersion: latest || minRequired,
        minRequiredAppVersion: minRequired,
        storeUrl,
      });
      return;
    }

    if (!soft || !latest) {
      setUpdatePrompt(null);
      return;
    }

    if (!(await shouldShowSoftUpdatePrompt(latest))) {
      setUpdatePrompt(null);
      return;
    }

    setUpdatePrompt({
      force: false,
      latestAppVersion: latest,
      storeUrl,
    });
  }, []);

  const handleOpenUpdateStore = useCallback(() => {
    const url = (updatePrompt?.storeUrl || APP_STORE_LISTING_URL || '').trim();
    if (!url) return;
    Linking.openURL(url).catch(() => {
      showToast('Play Store', 'Could not open the Play Store listing.', 'error');
    });
  }, [updatePrompt, showToast]);

  const handleDismissSoftUpdate = useCallback(async () => {
    if (updatePrompt?.force) return;
    const latest = updatePrompt?.latestAppVersion;
    setUpdatePrompt(null);
    if (latest) {
      await snoozeSoftUpdatePrompt(latest);
    }
  }, [updatePrompt]);

  const fetchStyles = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setStylesLoading(true);
    }
    try {
      const installed = getInstalledAppVersion();
      const res = await fetch(`${API_BASE}/api/styles`, {
        headers: installed ? { 'X-App-Version': installed } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await applyUpdatePromptFromServer(data);

      if (data.ok && Array.isArray(data.styles) && data.styles.length > 0) {
        const serverStyles = data.styles.map((s) => ({
          id: s.id,
          label: s.label,
          description: s.description,
          categoryId: s.categoryId,
        }));
        applyStyles(serverStyles);
        await writeStylesCache(serverStyles);
      } else {
        throw new Error('No styles returned');
      }
    } catch (err) {
      console.error('Failed to fetch styles from server:', err);
      if (!hasStylesRef.current) {
        applyStyles([]);
      }
    } finally {
      setStylesLoading(false);
    }
  }, [applyStyles, applyUpdatePromptFromServer]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await readStylesCache();
      if (cancelled) return;

      if (cached?.styles?.length) {
        applyStyles(cached.styles);
        setStylesLoading(false);
        fetchStyles({ background: true });
        return;
      }

      fetchStyles();
    })();

    return () => {
      cancelled = true;
    };
  }, [applyStyles, fetchStyles]);

  useEffect(() => {
    if (!wasOnlineRef.current && isOnline) {
      devLog('[Network] Back online — refreshing styles and subscription');
      fetchStyles({ background: hasStylesRef.current });
      refreshSubscription();
      ensureAuthenticated()
        .then((auth) => applyAuthState(auth))
        .catch((err) => console.warn('[Network] Re-auth on reconnect failed:', err?.message || err));
    }
    wasOnlineRef.current = isOnline;
  }, [isOnline, fetchStyles]);

  // Refresh subscription once auth is ready
  useEffect(() => {
    if (authReady) {
      refreshSubscription();
    }
  }, [authReady]);

  // Load whether first-launch onboarding has already been dismissed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await hasSeenOnboarding();
      if (cancelled) return;
      setNeedsOnboarding(!seen);
      setOnboardingReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // First launch: show before/after onboarding once (skip if subscribed).
  useEffect(() => {
    if (!splashHidden || !authReady || !onboardingReady) return;
    if (subscriptionLoading || !subscriptionInfo) return;
    if (!needsOnboarding) return;

    // Production: subscribed users skip onboarding. In Expo (__DEV__), still
    // show it so reload can preview the screen even with an active plan.
    if (subscriptionInfo.subscription && !__DEV__) {
      markOnboardingSeen();
      setNeedsOnboarding(false);
      return;
    }

    if (onboardingShownRef.current) return;
    onboardingShownRef.current = true;
    setScreen('onboarding');
  }, [
    splashHidden,
    authReady,
    onboardingReady,
    needsOnboarding,
    subscriptionLoading,
    subscriptionInfo,
  ]);

  // New installs / users without a plan: open paywall once on launch.
  // Wait until onboarding is finished/seen so the two screens do not fight.
  // Closed testers with allowance skip this so they can try the product.
  useEffect(() => {
    if (!splashHidden || !authReady || subscriptionLoading) return;
    if (!onboardingReady || needsOnboarding) return;
    if (!subscriptionInfo) return;
    if (subscriptionInfo.subscription) return;
    if (subscriptionInfo.closedTesting) return;
    if (launchPaywallShownRef.current) return;
    launchPaywallShownRef.current = true;
    setScreen('subscription');
  }, [
    splashHidden,
    authReady,
    subscriptionLoading,
    subscriptionInfo,
    onboardingReady,
    needsOnboarding,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && authReady) {
        devLog('[App] App came to foreground, refreshing subscription...');
        refreshSubscription();
      }
    });
    return () => { subscription.remove(); };
  }, [authReady]);

  useEffect(() => {
    // Polling has been moved server-side; frontend just waits for final result
  }, []);

  const callApi = useMemo(
    () => {
      const run = async ({
        imageDataUrl,
        styleId,
        expressions,
        _authRetried = false,
        manageLoading = true,
      }) => {
        const failOut = (message) => {
          if (!manageLoading) {
            throw new Error(message);
          }
          notifyGenerationFailure(message);
        };

        if (!styleId) {
          failOut('No style selected. Please choose a style and try again.');
          return;
        }

        if (
          styleId !== STICKER_SHEET_STYLE_ID &&
          serverStyleIdsRef.current &&
          !serverStyleIdsRef.current.has(styleId)
        ) {
          failOut(
            `"${styleId}" is not available on ${API_BASE} yet. Redeploy staging to pick up the latest styles.`
          );
          return;
        }

        if (manageLoading) setLoading(true);
        setJob(null);
        if (manageLoading) setResult(null);

        // Failsafe: stop loading after 3 minutes (poll loop is up to ~180s)
        const failsafeTimer = setTimeout(() => {
          console.warn('[callApi] Failsafe timeout reached - forcing loading off');
          if (manageLoading) {
            setLoading(false);
            pendingFailureDialogRef.current = TAKING_LONGER_MESSAGE;
          }
        }, 200000);

        try {
          // Step 1: Enqueue the job
          const enqueueRes = await fetch(`${API_BASE}/api/enqueue`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              userId: userIdRef.current,
              payload: {
                styleId,
                imageUrl: imageDataUrl || null,
                ...(Array.isArray(expressions) && expressions.length
                  ? { expressions }
                  : {}),
              },
            }),
          });

          const enqueueText = await enqueueRes.text();
          let enqueueJson = null;
          try {
            enqueueJson = JSON.parse(enqueueText);
          } catch (parseErr) {
            console.error('Enqueue - JSON parse error:', parseErr, enqueueText?.slice?.(0, 200));
            const enqueueFailed =
              /function_invocation_timeout/i.test(enqueueText || '') ||
              /an error occurred with your deployment/i.test(enqueueText || '')
                ? TAKING_LONGER_MESSAGE
                : SERVER_UNREACHABLE_MESSAGE;
            if (!manageLoading) {
              throw new Error(enqueueFailed);
            }
            pendingFailureDialogRef.current = enqueueFailed;
            setFailedAttempts((prev) => prev + 1);
            return;
          }

          if (!enqueueRes.ok || !enqueueJson.ok) {
            const errCode = enqueueJson?.error?.error || enqueueJson?.error;
            if (
              (enqueueRes.status === 401 || errCode === 'AUTHENTICATION_REQUIRED') &&
              !_authRetried
            ) {
              await refreshAuthToken();
              return await run({
                imageDataUrl,
                styleId,
                expressions,
                _authRetried: true,
                manageLoading,
              });
            }
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
            throw new Error('NO_JOB_ID: We could not start your image');
          }
          setPendingJobId(jobId);
          setJob({
            status: enqueueJson.status || 'pending',
            queuePosition: enqueueJson.queuePosition ?? null,
            estimatedWaitTime: enqueueJson.estimatedWaitTime ?? null,
          });

          fetch(`${API_BASE}/api/cron/process-queue`, {
            method: 'GET',
            headers: getApiHeaders(),
          }).catch((kickErr) => {
            console.warn('[callApi] queue kick failed (non-fatal, cron-job.org will pick up):', kickErr?.message || kickErr);
          });

          const pollResult = await pollJobUntilDone({
            apiBase: API_BASE,
            jobId,
            getApiHeaders,
            onUpdate: setJob,
          });

          setResult({
            status: 'succeeded',
            output: pollResult.output,
            jobId: pollResult.jobInfo?.id || jobId,
          });
          setFailedAttempts(0);
          setPendingJobId(null);

          setTimeout(() => {
            devLog('[App] Auto-refreshing subscription after generation...');
            refreshSubscription();
          }, 1500);

          return pollResult;
        } catch (err) {
          const errorMessage = err.message || String(err);

          if (isContentPolicyError(err)) {
            handleContentPolicyBlock(
              err.name === 'ContentPolicyBlockedError'
                ? err
                : new ContentPolicyBlockedError({
                    userMessage: errorMessage,
                    errorMessage,
                    styleId,
                    jobId: err.jobId || null,
                  }),
              { styleId }
            );
            return;
          }

          console.error('API error:', err);
          if (err?.rawErrorMessage || err?.jobId) {
            console.error('[API error detail]', {
              name: err?.name,
              jobId: err?.jobId ?? null,
              styleId: err?.styleId ?? styleId ?? null,
              rawErrorMessage: err?.rawErrorMessage ?? null,
            });
          }
          if (!/invalid_style_id/i.test(errorMessage)) {
            captureAppError(err, {
              flow: 'generate',
              styleId,
              jobId: err.jobId || null,
              rawErrorMessage: err.rawErrorMessage || null,
            });
          }
          // Defer dialog until after loading=false so Android Modal isn't swallowed
          // by the ResultScreen loading → error transition (users only saw it after Save).
          if (!manageLoading) throw err;
          pendingFailureDialogRef.current = err;
          setFailedAttempts((prev) => prev + 1);
        } finally {
          clearTimeout(failsafeTimer);
          if (manageLoading) {
            setLoading(false);
            setJob(null);
          }
        }
      };

      return run;
    },
    [showDialog, closeDialog, handleContentPolicyBlock, notifyGenerationFailure]
  );

  const handleSubscribe = async (selectedTier = null) => {
    // Defensive: if called from a TouchableOpacity onPress directly,
    // the arg may be a synthetic event object instead of a tier string.
    if (selectedTier && typeof selectedTier !== 'string') {
      selectedTier = null;
    }
    if (!isOnline) {
      showToast(NO_INTERNET_TITLE, NO_INTERNET_MESSAGE, 'warning');
      return;
    }

    const currentTier = subscriptionInfo?.subscription?.tier;
    const downgrade = isSubscriptionDowngrade(currentTier, selectedTier);
    if (downgrade) {
      const currentName = getTierName(currentTier);
      const nextName = getTierName(selectedTier);
      const renewalDate = getDisplayRenewalDate(
        subscriptionInfo.subscription,
        subscriptionInfo?.revenueCatExpiration,
      );
      const renewalLabel = formatSubscriptionDate(renewalDate) || 'your next renewal';
      showDialog({
        title: 'Takes effect next renewal',
        message: `You'll keep ${currentName} until ${renewalLabel}. Then you'll switch to ${nextName} and the new image allowance will apply.`,
        confirmLabel: `Continue with ${nextName}`,
        cancelLabel: 'Keep current plan',
        onCancel: closeDialog,
        onConfirm: () => {
          closeDialog();
          runSubscriptionPurchase(selectedTier, {
            downgrade: true,
            currentName,
            nextName,
            renewalLabel,
          });
        },
      });
      return;
    }

    await runSubscriptionPurchase(selectedTier, { downgrade: false });
  };

  const runSubscriptionPurchase = async (selectedTier, { downgrade = false, currentName, nextName, renewalLabel } = {}) => {
    setSubscribeLoading(true);
    try {
      const auth = await ensureAuthenticated();
      if (!auth?.userId || !auth?.token) {
        showToast(
          NO_INTERNET_TITLE,
          NO_INTERNET_MESSAGE,
          'error'
        );
        return;
      }

      if (!hasRcKey) {
        showToast('Subscriptions', 'RevenueCat SDK key is missing. Please set EXPO_PUBLIC_REVENUECAT_* env vars.', 'error');
        return;
      }

      // Ensure RC is configured — re-attempt init if a startup error occurred
      const configured = await isRcConfigured();
      if (!configured) {
        console.warn('[RevenueCat] SDK not configured, attempting re-init...');
        try {
          await initRevenueCat(null);
        } catch (reInitErr) {
          console.error('[RevenueCat] Re-init failed:', reInitErr);
          showToast('Purchase failed', 'Could not initialize payment system. Please restart the app.', 'error');
          return;
        }
      }

      devLog('[RevenueCat] Fetching offerings...');
      const pkgs = await getOfferings();

      if (!pkgs || pkgs.length === 0) {
        showToast('Subscriptions', 'No subscription packages available yet', 'error');
        return;
      }

      devLog(`[RevenueCat] Found ${pkgs.length} package(s):`, pkgs.map(p => ({
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

      devLog(`[RevenueCat] Purchasing package: ${packageId} (${priceString})`);

      const currentTier = subscriptionInfo?.subscription?.tier;
      const isUpgrade = isSubscriptionUpgrade(currentTier, selectedTier);

      let customerInfoForChange = null;
      try {
        customerInfoForChange = await getCustomerInfo();
      } catch (infoErr) {
        console.warn('[RevenueCat] getCustomerInfo before purchase failed:', infoErr);
      }

      const billingBefore = getSubscriptionBillingState(customerInfoForChange);
      // Re-buy while cancel-at-period-end always fails on Play — explain before the sheet.
      if (billingBefore?.cancelAtPeriodEnd && !downgrade && !isUpgrade) {
        const until =
          formatSubscriptionDate(billingBefore.expirationDate) ||
          formatSubscriptionDate(subscriptionInfo?.revenueCatExpiration) ||
          null;
        const described = describePurchaseError(
          { message: 'arguments provided are invalid' },
          { cancelAtPeriodEnd: true, expirationDate: until },
        );
        showToast(described.title, described.message, 'info');
        return;
      }

      // Attempt purchase
      const purchaseResult = await purchasePackage(selected, {
        customerInfo: customerInfoForChange,
        isDowngrade: downgrade,
        isUpgrade,
      });

      devLog('[RevenueCat] Purchase result:', {
        productIdentifier: purchaseResult?.productIdentifier,
        hasCustomerInfo: !!purchaseResult?.customerInfo,
      });

      // Entitlements can lag a beat after Play confirms — poll briefly.
      let customerInfo = purchaseResult?.customerInfo || null;
      let subDetails = getActiveSubscriptionDetails(customerInfo);
      for (let attempt = 0; attempt < 5 && !subDetails?.productIdentifier; attempt += 1) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 700));
        }
        try {
          customerInfo = (await getCustomerInfo()) || customerInfo;
        } catch (infoErr) {
          console.warn('[RevenueCat] getCustomerInfo after purchase failed:', infoErr);
        }
        subDetails = getActiveSubscriptionDetails(customerInfo);
      }

      await ensureAuthenticated();
      if (subDetails?.productIdentifier) {
        await syncSubscriptionToBackend(customerInfo, {
          pendingTier: downgrade ? selectedTier : undefined,
        });
      } else {
        console.warn('[RevenueCat] Purchase completed but no active subscription found yet');
        try {
          await syncSubscriptionToBackend(customerInfo, {
            pendingTier: downgrade ? selectedTier : undefined,
          });
        } catch {}
      }

      const refreshed = await refreshSubscription();
      const hasAccess =
        !!subDetails?.productIdentifier || !!refreshed?.subscription;

      if (downgrade) {
        showToast(
          'Downgrade scheduled',
          `You'll keep ${currentName} until ${renewalLabel || 'your next renewal'}, then switch to ${nextName}.`,
          'info',
          { duration: 6000 },
        );
      } else if (hasAccess) {
        showToast('Purchase successful', 'Your subscription is now active', 'success');
      } else {
        showToast(
          'Purchase completed',
          'Subscription will appear shortly. Pull to refresh or reopen the app if it doesn\'t update.',
          'warning',
        );
      }

      // Always leave the paywall once Play accepted the purchase — don't strand
      // the user on "Select a plan" while entitlements/backend catch up.
      setScreen('style');
    } catch (err) {
      console.error('[RevenueCat] Purchase error code:', err?.code);
      console.error('[RevenueCat] Purchase error message:', err?.message);
      console.error('[RevenueCat] Underlying error:', err?.underlyingErrorMessage);
      console.error('[RevenueCat] Full error:', err);

      if (err?.userCancelled) {
        return;
      }

      let customerInfoAtFail = null;
      let billingAtFail = null;
      try {
        customerInfoAtFail = await getCustomerInfo();
        billingAtFail = getSubscriptionBillingState(customerInfoAtFail);
      } catch {
        billingAtFail = getSubscriptionBillingState(null);
      }
      const cancelAtPeriodEnd =
        !!billingAtFail?.cancelAtPeriodEnd ||
        !!subscriptionInfo?.subscription?.cancelAtPeriodEnd;
      const until =
        formatSubscriptionDate(billingAtFail?.expirationDate) ||
        formatSubscriptionDate(subscriptionInfo?.revenueCatExpiration) ||
        null;

      const described = describePurchaseError(err, {
        cancelAtPeriodEnd,
        expirationDate: until,
      });

      // Already owned / active on Play — sync and leave paywall instead of looping.
      if (
        described.kind === 'already_owned' ||
        (described.kind === 'invalid_arguments' && billingAtFail?.productIdentifier)
      ) {
        try {
          await ensureAuthenticated();
          if (customerInfoAtFail) {
            await syncSubscriptionToBackend(customerInfoAtFail);
          }
          await refreshSubscription();
        } catch (syncErr) {
          console.warn('[RevenueCat] already-owned sync failed:', syncErr);
        }
        showToast(
          described.title || 'Already subscribed',
          described.message || 'Your subscription is already active.',
          'success',
        );
        setScreen('style');
        return;
      }

      if (described.shouldReport) {
        captureAppError(err, {
          flow: 'purchase',
          kind: described.kind,
          selectedTier,
          downgrade: !!downgrade,
          cancelAtPeriodEnd,
          code: err?.code,
          readableErrorCode: err?.readableErrorCode,
          underlyingErrorMessage: err?.underlyingErrorMessage,
          productIdentifier: billingAtFail?.productIdentifier,
        });
      }

      showToast(
        described.title || 'Purchase failed',
        described.message,
        described.kind === 'active_after_cancel' ? 'info' : 'error',
      );
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!isOnline) {
      showToast(NO_INTERNET_TITLE, NO_INTERNET_MESSAGE, 'warning');
      return;
    }
    if (!hasRcKey) {
      showToast('Restore', 'RevenueCat is not configured', 'error');
      return;
    }
    setSubscribeLoading(true);
    try {
      const customerInfo = await restorePurchases();
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      if (Object.keys(activeEntitlements).length > 0) {
        // Sync first → adopt usage + reclaimUserId, then switch JWT to that user.
        const latestInfo = await getCustomerInfo().catch(() => customerInfo);
        await syncSubscriptionToBackend(latestInfo);
        await refreshSubscription();
        showToast('Restored', 'Your previous purchase has been restored', 'success');
        setScreen('style');
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

  const handleManageSubscription = async () => {
    const storeName = getStoreSubscriptionLabel();
    setSubscribeLoading(true);
    try {
      let customerInfo = null;
      try {
        customerInfo = await getCustomerInfo();
      } catch (rcErr) {
        console.warn('[Manage Subscription] getCustomerInfo failed, using store fallback:', rcErr);
      }
      await openSubscriptionManagement(customerInfo);
    } catch (err) {
      console.error('[Manage Subscription] error:', err);
      showToast(
        'Could not open subscriptions',
        `Open ${storeName} → Payments & subscriptions → FunnyFy, then tap Refresh here.`,
        'error',
      );
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleUploadStart = async ({ imageUri, imageDataUrl }) => {
    if (!isOnline) {
      showToast(NO_INTERNET_TITLE, NO_INTERNET_MESSAGE, 'warning');
      return;
    }
    if (loading) {
      showToast(
        'Generation in progress',
        'Wait for the current caricature to finish, or cancel it first.',
        'warning',
      );
      return;
    }
    setOriginal({ imageUri, imageDataUrl, prompt: style?.prompt });
    setPendingJobId(null);
    setFailedAttempts(0);
    setRestyleMode(false);
    if (canBuildStickerPack(selectedStickerIds.length)) {
      await runStickerPack({ imageDataUrl });
      return;
    }
    setScreen('result');
    await callApi({ imageDataUrl, styleId: style?.id });
  };

  const handleCancelRestyle = () => {
    setRestyleMode(false);
  };

  const handleTryAnotherStyle = () => {
    setRestyleMode(true);
    setResult(null);
    setFailedAttempts(0);
    setPendingJobId(null);
    setScreen('style');
  };

  const handleToggleSticker = (item) => {
    if (!isStickerStyle(item)) return;
    setSelectedStickerIds((prev) => {
      const next = toggleStickerSelection(prev, item.id);
      if (next.size === prev.length && !next.has(item.id) && prev.length >= STICKER_PACK_MAX) {
        showToast('Pack limit', `A pack can include up to ${STICKER_PACK_MAX} stickers.`, 'warning');
      }
      return [...next];
    });
    setStyleReturnCategory('stickers');
  };

  const runStickerPack = async ({ imageDataUrl: photoDataUrl } = {}) => {
    const byId = new Map(availableStyles.map((item) => [item.id, item]));
    const selected = selectedStickerIds
      .map((id) => byId.get(id))
      .filter((item) => item && isStickerStyle(item));
    const imageDataUrl = photoDataUrl || original?.imageDataUrl || pickedImage?.dataUrl;
    if (!canBuildStickerPack(selected.length)) {
      setStickerPackError(`Select ${STICKER_PACK_SIZE_HINT} sticker styles and a photo.`);
      return;
    }
    if (!imageDataUrl) {
      setStickerPackError('Pick a photo before generating a sticker pack.');
      setStickerPackPending(true);
      setOriginal(null);
      setPickedImage(null);
      setStyle(stickerSheetStyle());
      setStyleReturnCategory('stickers');
      setScreen('upload');
      return;
    }

    setStickerPackPending(false);
    setStickerPackError('');
    setStickerPackSheetUrl(null);
    setScreen('sticker-pack');
    setLoading(true);

    try {
      const sheetStyle = stickerSheetStyle();
      setStyle(sheetStyle);
      const pollResult = await callApi({
        imageDataUrl,
        styleId: STICKER_SHEET_STYLE_ID,
        expressions: selected.map((item) => item.id),
        manageLoading: false,
      });
      const sheetUrl = pollResult?.output || pollResult?.jobInfo?.outputImageUrl || null;
      if (!sheetUrl) {
        throw new Error('Could not generate the sticker sheet.');
      }
      setStickerPackSheetUrl(sheetUrl);
    } catch (err) {
      setStickerPackError(err?.message || 'Could not finish the sticker pack.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStickerPack = async () => {
    const byId = new Map(availableStyles.map((item) => [item.id, item]));
    const selected = selectedStickerIds
      .map((id) => byId.get(id))
      .filter((item) => item && isStickerStyle(item));
    if (!canBuildStickerPack(selected.length)) {
      showToast(
        `Pick ${STICKER_PACK_SIZE_HINT} stickers`,
        `A pack sheet needs exactly ${STICKER_PACK_SIZE_HINT} expressions.`,
        'warning',
      );
      return;
    }
    if (requiresSubscriptionPaywall(subscriptionInfo)) {
      setScreen('subscription');
      return;
    }
    const quotaMessage = stickerPackQuotaMessage(subscriptionInfo, selected.length);
    if (quotaMessage) {
      showToast('Not enough images', quotaMessage, 'warning');
      return;
    }

    // Always collect a fresh photo for a new pack — never reuse a leftover original.
    setStickerPackPending(true);
    setStickerPackError('');
    setStickerPackSheetUrl(null);
    setOriginal(null);
    setPickedImage(null);
    setResult(null);
    setJob(null);
    setPendingJobId(null);
    setLoading(false);
    setStyle(stickerSheetStyle());
    setStyleReturnCategory('stickers');
    setScreen('upload');
    showToast(
      'Photo first',
      'Pick a photo, then we will generate your sticker pack.',
      'info',
      { duration: 10000 },
    );
  };

  const handleTryAnotherPhoto = () => {
    setRestyleMode(false);
    setPickedImage(null);
    setOriginal(null);
    setResult(null);
    setFailedAttempts(0);
    setPendingJobId(null);
    setJob(null);
    setLoading(false);
    setScreen('upload');
  };

  const handleRegenerate = () => {
    if (!isOnline) {
      showToast(NO_INTERNET_TITLE, NO_INTERNET_MESSAGE, 'warning');
      return;
    }
    if (loading) {
      showToast(
        'Generation in progress',
        'Wait for the current caricature to finish, or cancel it first.',
        'warning',
      );
      return;
    }
    if (!original?.imageDataUrl || !style?.id) {
      showToast('Regenerate', 'Photo and style are missing. Pick them again.', 'warning');
      return;
    }
    if (requiresSubscriptionPaywall(subscriptionInfo)) {
      setScreen('subscription');
      return;
    }
    const usage = subscriptionInfo?.usage;
    const quotaOk = !subscriptionInfo || canUseGenerationQuota(subscriptionInfo);
    if (!quotaOk) {
      const dailyBlocked =
        usage?.dailyLimit != null &&
        usage?.dailyCurrent != null &&
        usage.dailyCurrent >= usage.dailyLimit;
      showDialog({
        title: dailyBlocked ? 'Daily limit reached' : 'Quota Exceeded',
        message: dailyBlocked
          ? `Closed testing allows ${usage.dailyLimit} image per day. Come back tomorrow (${usage.current}/${usage.limit} used).`
          : `You've used all ${usage?.limit ?? ''} images this month. Upgrade your plan to continue.`,
        cancelLabel: 'Cancel',
        confirmLabel: dailyBlocked ? 'OK' : 'Upgrade',
        onCancel: closeDialog,
        onConfirm: () => {
          closeDialog();
          if (!dailyBlocked) setScreen('subscription');
        },
      });
      return;
    }
    setFailedAttempts(0);
    setPendingJobId(null);
    setJob(null);
    setResult(null);
    callApi({ imageDataUrl: original.imageDataUrl, styleId: style.id });
  };

  const handleTryAnotherStickerStyle = () => {
    setStickerPackError('');
    setStickerPackSheetUrl(null);
    setFailedAttempts(0);
    setPendingJobId(null);
    setJob(null);
    setLoading(false);
    setStyleReturnCategory('stickers');
    setScreen('style');
  };

  const handleTryAnotherStickerPhoto = () => {
    setRestyleMode(false);
    setPickedImage(null);
    setOriginal(null);
    setResult(null);
    setStickerPackError('');
    setStickerPackSheetUrl(null);
    setFailedAttempts(0);
    setPendingJobId(null);
    setJob(null);
    setLoading(false);
    setStyle(stickerSheetStyle());
    setStyleReturnCategory('stickers');
    setScreen('upload');
  };

  const handleRegenerateStickerPack = () => {
    if (!isOnline) {
      showToast(NO_INTERNET_TITLE, NO_INTERNET_MESSAGE, 'warning');
      return;
    }
    if (loading) {
      showToast(
        'Generation in progress',
        'Wait for the current sticker pack to finish, or cancel it first.',
        'warning',
      );
      return;
    }
    if (!original?.imageDataUrl && !pickedImage?.dataUrl) {
      showToast('Regenerate', 'Photo is missing. Pick it again.', 'warning');
      return;
    }
    if (!canBuildStickerPack(selectedStickerIds.length)) {
      showToast(
        `Pick ${STICKER_PACK_SIZE_HINT} stickers`,
        `A pack sheet needs exactly ${STICKER_PACK_SIZE_HINT} expressions.`,
        'warning',
      );
      return;
    }
    if (requiresSubscriptionPaywall(subscriptionInfo)) {
      setScreen('subscription');
      return;
    }
    const quotaMessage = stickerPackQuotaMessage(subscriptionInfo, selectedStickerIds.length);
    if (quotaMessage) {
      showToast('Not enough images', quotaMessage, 'warning');
      return;
    }
    runStickerPack();
  };

  const handleOnboardingDone = useCallback(() => {
    markOnboardingSeen();
    setNeedsOnboarding(false);
    setScreen('style');
  }, []);

  const handleMenuSelect = useCallback((id) => {
    setRestyleMode(false);
    if (id === 'contact') {
      openContactSupport(() => {
        showToast('Email', `Contact us at ${SUPPORT_EMAIL}`, 'info');
      });
      return;
    }
    if (id === 'request-style') {
      openStyleRequest(() => {
        showToast('Email', `Request a style at ${SUPPORT_EMAIL}`, 'info');
      });
      return;
    }
    if (id === 'share-app') {
      shareApp().catch(() => {
        showToast('Share', 'Could not open the share sheet', 'error');
      });
      return;
    }
    if (id === 'rate-app') {
      openPlayStoreListing().then((opened) => {
        if (opened) {
          markRateAppRated();
        } else {
          showToast('Play Store', 'Could not open the Play Store listing.', 'error');
        }
      });
      return;
    }
    setScreen(id);
  }, [showToast]);

  const handleUnloadableOutput = useCallback(
    async ({ reason, imageUrl, jobId } = {}) => {
      const resolvedJobId = jobId || result?.jobId || pendingJobId || null;
      const friendly = BLANK_OUTPUT_MESSAGE;

      captureAppError(new Error('BLANK_OR_UNLOADABLE_OUTPUT'), {
        flow: 'generate_output',
        styleId: style?.id || null,
        jobId: resolvedJobId,
        rawErrorMessage: reason || 'unloadable_output',
        imageUrl: imageUrl ? String(imageUrl).slice(0, 200) : null,
      });

      setResult(null);
      notifyGenerationFailure(friendly);
      setFailedAttempts((prev) => prev + 1);
      setJob(null);
      setPendingJobId(null);

      if (resolvedJobId && authTokenRef.current) {
        try {
          await fetch(
            `${API_BASE}/api/job?action=report-bad-output&id=${encodeURIComponent(resolvedJobId)}`,
            {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({
                action: 'report-bad-output',
                jobId: resolvedJobId,
                reason: reason || 'client_unloadable',
              }),
            }
          );
        } catch (reportErr) {
          console.warn('[App] report-bad-output failed:', reportErr?.message || reportErr);
        }
      }

      setTimeout(() => refreshSubscription(), 500);
    },
    [pendingJobId, result?.jobId, style?.id, notifyGenerationFailure]
  );

  const handleRetry = async () => {
    if (!pendingJobId) {
      if (original?.imageDataUrl && style?.id) {
        callApi({ imageDataUrl: original.imageDataUrl, styleId: style.id });
        return;
      }
      notifyGenerationFailure(
        'Tap Generate to start again, or go back and choose another photo.'
      );
      return;
    }

    setLoading(true);
    setJob(null);

    fetch(`${API_BASE}/api/cron/process-queue`, {
      method: 'GET',
      headers: getApiHeaders(),
    }).catch(() => {});

    try {
      const pollResult = await pollJobUntilDone({
        apiBase: API_BASE,
        jobId: pendingJobId,
        getApiHeaders,
        onUpdate: setJob,
      });

      setResult({ status: 'succeeded', output: pollResult.output, jobId: pendingJobId });
      setFailedAttempts(0);
      setPendingJobId(null);
      setTimeout(() => refreshSubscription(), 500);
    } catch (err) {
      const errorMessage = err.message || String(err);

      if (isContentPolicyError(err)) {
        handleContentPolicyBlock(
          err.name === 'ContentPolicyBlockedError'
            ? err
            : new ContentPolicyBlockedError({
                userMessage: errorMessage,
                errorMessage,
                jobId: pendingJobId,
              }),
          { styleId: style?.id }
        );
        return;
      }

      if (!/invalid_style_id/i.test(errorMessage)) {
        captureAppError(err, {
          flow: 'generate_retry',
          styleId: style?.id || null,
          jobId: err.jobId || pendingJobId || null,
          rawErrorMessage: err.rawErrorMessage || null,
        });
      }
      pendingFailureDialogRef.current = err;
      setFailedAttempts((prev) => prev + 1);
    } finally {
      setLoading(false);
      setJob(null);
    }
  };

  const onHardwareBackRef = useRef(() => true);

  useEffect(() => {
    lastExitPressRef.current = 0;
  }, [screen, styleReturnCategory]);

  useEffect(() => {
    const confirmExit = () => {
      const now = Date.now();
      if (now - lastExitPressRef.current < EXIT_CONFIRM_MS) {
        lastExitPressRef.current = 0;
        return false;
      }
      lastExitPressRef.current = now;
      showToast('Press again to exit the app', '', 'info', { duration: EXIT_CONFIRM_MS });
      return true;
    };

    onHardwareBackRef.current = () => {
      if (screen === 'result') {
        resultBackHandlerRef.current?.();
        return true;
      }
      if (screen === 'upload') {
        setScreen('style');
        return true;
      }
      if (screen === 'review') {
        setPickedImage(null);
        setScreen('upload');
        return true;
      }
      if (screen === 'onboarding') {
        handleOnboardingDone();
        return true;
      }
      if (screen === 'subscription' || screen === 'usage' || screen === 'privacy' || screen === 'terms' || screen === 'gallery' || screen === 'menu') {
        setScreen('style');
        return true;
      }
      if (screen === 'style') {
        if (styleBackHandlerRef.current?.()) {
          lastExitPressRef.current = 0;
          return true;
        }
        if (styleReturnCategory) {
          setStyleReturnCategory(null);
          lastExitPressRef.current = 0;
          return true;
        }
        if (restyleMode) {
          handleCancelRestyle();
          return true;
        }
        return confirmExit();
      }
      return confirmExit();
    };
  }, [screen, restyleMode, showToast, styleReturnCategory, handleOnboardingDone]);

  useEffect(() => {
    const sub = BackHandler.addEventListener(
      'hardwareBackPress',
      () => onHardwareBackRef.current(),
    );
    return () => sub.remove();
  }, []);

  // Hard paywall / closed-test: API is the real gate; UI mirrors usage when known.
  const canGenerateMore = !subscriptionInfo
    ? true
    : canUseGenerationQuota(subscriptionInfo);

  const updateDialogEl = (
    <ConfirmDialog
      visible={Boolean(updatePrompt)}
      title={updatePrompt?.force ? 'Update required' : 'Update available'}
      message={
        updatePrompt?.force
          ? 'This version of FunnyFy is no longer supported.'
          : 'A newer version of FunnyFy is available.'
      }
      confirmLabel="Update"
      cancelLabel="Not now"
      hideCancel={Boolean(updatePrompt?.force)}
      onConfirm={handleOpenUpdateStore}
      onCancel={handleDismissSoftUpdate}
    />
  );

  // Keep one continuous brand splash from native hide → first styles paint.
  // Also hold until onboarding is decided/shown so StyleScreen never flashes first.
  const holdForOnboarding =
    !onboardingReady || (needsOnboarding && screen !== 'onboarding');

  if (
    !splashHidden ||
    (stylesLoading && availableStyles.length === 0) ||
    holdForOnboarding
  ) {
    return (
      <AppShell>
        {updateDialogEl}
        <AppSplash waiting={splashHidden || holdForOnboarding} />
      </AppShell>
    );
  }

  let overlay = null;
  if (screen === 'onboarding') {
    overlay = <OnboardingScreen onDone={handleOnboardingDone} />;
  } else if (screen === 'menu') {
    overlay = (
      <MenuScreen
        onBack={() => setScreen('style')}
        onSelect={handleMenuSelect}
        userId={userId}
        onUserIdCopied={() => {
          showToast('Copied', 'User ID copied — include it when contacting support', 'success');
        }}
      />
    );
  } else if (screen === 'sticker-pack') {
    overlay = (
      <StickerPackScreen
        selectedStyles={availableStyles.filter((item) => selectedStickerIds.includes(item.id))}
        loading={loading}
        job={job}
        errorMessage={stickerPackError}
        sheetUrl={stickerPackSheetUrl}
        subscriptionInfo={subscriptionInfo}
        onOpenUsage={() => setScreen('usage')}
        onTryAnotherPhoto={handleTryAnotherStickerPhoto}
        onTryAnotherStyle={handleTryAnotherStickerStyle}
        onRegenerate={handleRegenerateStickerPack}
        onBack={() => {
          setStyleReturnCategory('stickers');
          setScreen('style');
        }}
      />
    );
  } else if (screen === 'privacy') {
    overlay = (
      <InfoScreen
        title="Privacy Policy"
        content={PRIVACY_POLICY_TEXT}
        onBack={() => setScreen('style')}
      />
    );
  } else if (screen === 'terms') {
    overlay = (
      <InfoScreen
        title="Terms & Conditions"
        content={TERMS_TEXT}
        onBack={() => setScreen('style')}
      />
    );
  } else if (screen === 'gallery') {
    overlay = <GalleryScreen onBack={() => setScreen('style')} />;
  } else if (screen === 'usage') {
    overlay = (
      <UsageScreen
        subscriptionInfo={subscriptionInfo}
        subscriptionLoading={subscriptionLoading}
        onRefreshSubscription={refreshSubscription}
        onOpenSubscription={() => setScreen('subscription')}
        onBack={() => setScreen('style')}
      />
    );
  } else if (screen === 'subscription') {
    overlay = (
      <SubscriptionScreen
        subscriptionInfo={subscriptionInfo}
        subscriptionLoading={subscriptionLoading}
        onSubscribe={handleSubscribe}
        subscribeLoading={subscribeLoading}
        onManageSubscription={handleManageSubscription}
        storeSubscriptionLabel={getStoreSubscriptionLabel()}
        onRestorePurchases={handleRestorePurchases}
        onOpenPrivacy={() => setScreen('privacy')}
        onOpenTerms={() => setScreen('terms')}
        onClose={() => setScreen('style')}
      />
    );
  } else if (screen === 'upload') {
    overlay = (
      <UploadScreen
        style={style}
        onPicked={(image) => { setPickedImage(image); setScreen('review'); }}
        subscriptionInfo={subscriptionInfo}
        onSubscribe={() => setScreen('subscription')}
        onOpenUsage={() => setScreen('usage')}
        onBackToStyle={() => { setRestyleMode(false); setScreen('style'); }}
      />
    );
  } else if (screen === 'review') {
    overlay = (
      <PhotoReviewScreen
        style={style}
        imageUri={pickedImage?.uri}
        imageDataUrl={pickedImage?.dataUrl}
        isOnline={isOnline}
        isGenerating={loading}
        subscriptionInfo={subscriptionInfo}
        canGenerateMore={canGenerateMore}
        onStart={handleUploadStart}
        onSubscribe={() => setScreen('subscription')}
        onOpenUsage={() => setScreen('usage')}
        onReplacePhoto={(image) => setPickedImage(image)}
        onBack={() => { setPickedImage(null); setScreen('upload'); }}
      />
    );
  } else if (screen === 'result') {
    overlay = (
      <ResultScreen
        original={original}
        result={result}
        loading={loading}
        job={job}
        failedAttempts={failedAttempts}
        onRetry={handleRetry}
        subscriptionInfo={subscriptionInfo}
        backHandlerRef={resultBackHandlerRef}
        style={style}
        onUnloadableOutput={handleUnloadableOutput}
        onBack={() => {
          setRestyleMode(false);
          setStyleReturnCategory(style?.categoryId || getStyleCategory(style?.id) || null);
          setScreen('style');
          setFailedAttempts(0);
        }}
        onHome={() => {
          setRestyleMode(false);
          setStyleReturnCategory(null);
          setScreen('style');
          setFailedAttempts(0);
        }}
        onOpenUsage={() => setScreen('usage')}
        onOpenGallery={() => setScreen('gallery')}
        onTryAnotherStyle={handleTryAnotherStyle}
        onTryAnotherPhoto={handleTryAnotherPhoto}
        onRegenerate={handleRegenerate}
      />
    );
  }

  return (
    <AppShell>
      {updateDialogEl}
      <View style={{ flex: 1 }}>
        <View
          style={{ flex: 1 }}
          pointerEvents={screen === 'style' ? 'auto' : 'none'}
          importantForAccessibility={screen === 'style' ? 'auto' : 'no-hide-descendants'}
        >
          <StyleScreen
            selectedStyle={style}
            availableStyles={availableStyles}
            stylesLoading={stylesLoading}
            restyleMode={restyleMode}
            initialActiveCategory={styleReturnCategory}
            onActiveCategoryChange={setStyleReturnCategory}
            onCancelRestyle={handleCancelRestyle}
            interactionPaused={screen !== 'style'}
            onOpenMenu={() => setScreen('menu')}
            selectedStickerIds={selectedStickerIds}
            onToggleSticker={handleToggleSticker}
            onCreateStickerPack={handleCreateStickerPack}
            onClearStickerPack={() => {
              setSelectedStickerIds([]);
              setStickerPackPending(false);
            }}
            backHandlerRef={styleBackHandlerRef}
            onNext={(s) => {
              setSelectedStickerIds([]);
              setStickerPackPending(false);
              setStyle(s);
              setStyleReturnCategory(s?.categoryId || getStyleCategory(s?.id) || null);
              if (restyleMode && original?.imageDataUrl) {
                if (!isOnline) {
                  showToast(NO_INTERNET_TITLE, NO_INTERNET_MESSAGE, 'warning');
                  return;
                }
                setRestyleMode(false);
                setResult(null);
                setFailedAttempts(0);
                setPendingJobId(null);
                setOriginal((prev) => (prev ? { ...prev, prompt: s.prompt } : prev));
                setScreen('result');
                callApi({ imageDataUrl: original.imageDataUrl, styleId: s.id });
                return;
              }
              setRestyleMode(false);
              setPickedImage(null);
              setScreen('upload');
            }}
          />
        </View>
        {overlay ? (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: DARK_BG, zIndex: 2 }]}>
            {overlay}
          </View>
        ) : null}
      </View>
    </AppShell>
  );
}
