import {
  useFonts,
  PlusJakartaSans_400Regular,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { configureAndroidNavigationBar } from './utils/androidNavigationBar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Platform,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  initRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
  getAppUserId,
  hasRevenueCatKey,
  isConfigured as isRcConfigured,
  loginUser,
  getActiveSubscriptionDetails,
  getSubscriptionBillingState,
  openSubscriptionManagement,
  getStoreSubscriptionLabel,
  tierFromProductId,
} from './services/revenuecat';
import { initAuth, resetAuthIfLocal, forceReAuth } from './services/auth.js';
import NotificationProvider, { useNotifications } from './components/NotificationProvider';
import NetworkProvider, { useNetwork } from './components/NetworkProvider';
import MenuModal from './components/MenuModal';
import GalleryScreen from './screens/GalleryScreen';
import UsageScreen from './screens/UsageScreen';
import InfoScreen from './screens/InfoScreen';
import StyleScreen from './screens/StyleScreen';
import StylesLaunchLoader from './components/StylesLaunchLoader';
import UploadScreen from './screens/UploadScreen';
import PhotoReviewScreen from './screens/PhotoReviewScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import ResultScreen from './screens/ResultScreen';
import { getStyleCategory } from './utils/styleCategories';
import { DARK_BG } from './constants/theme';
import {
  API_BASE,
  PRIVACY_POLICY_TEXT,
  TERMS_TEXT,
  ABOUT_TEXT,
  SUPPORT_EMAIL,
} from './constants';
import { mergeServerStyles, getServerConfirmedStyleIds } from './utils/mergeServerStyles';
import { readStylesCache, writeStylesCache } from './utils/stylesCache';
import { getTrialRemaining, getTrialWarningMessage, isTrialUser } from './utils/trialWarnings';
import { isNsfwContentError, buildContentPolicyDialog, notifyGenerationFailure } from './utils/contentErrors';
import {
  isContentPolicyError,
  recordContentViolation,
  ContentPolicyBlockedError,
} from './utils/contentViolations';
import { pollJobUntilDone } from './utils/jobClient';
import { setSentryUser, captureAppError } from './utils/sentry';
import { openContactSupport, openStyleRequest } from './utils/contactSupport';
import { shareApp } from './utils/shareApp';

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
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
  });

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <NetworkProvider>
          <AppContent fontsLoaded={fontsLoaded} />
        </NetworkProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

function AppShell({ children }) {
  return (
    <View style={{ flex: 1, backgroundColor: DARK_BG }}>
      {children}
    </View>
  );
}

function AppContent({ fontsLoaded }) {
  const { showToast, showDialog, closeDialog } = useNotifications();
  const { isOnline } = useNetwork();
  const [screen, setScreen] = useState('style');
  const [style, setStyle] = useState(null);
  // pickedImage: { uri, dataUrl } | null — OS-cropped photo for review → generate.
  const [pickedImage, setPickedImage] = useState(null);
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [pendingJobId, setPendingJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [hasRcKey, setHasRcKey] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [restyleMode, setRestyleMode] = useState(false);
  const [styleReturnCategory, setStyleReturnCategory] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const userIdRef = useRef(null);
  const authTokenRef = useRef(null);
  const authInitPromiseRef = useRef(null);
  const resultBackHandlerRef = useRef(null);
  const subscriptionRefreshSeqRef = useRef(0);
  const revenueCatExpirationRef = useRef(null);
  const wasOnlineRef = useRef(true);
  const serverStyleIdsRef = useRef(null);
  const hasStylesRef = useRef(false);

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

    let rcUserId = null;
    if (hasKey) {
      try {
        await withTimeout(initRevenueCat(null), RC_STARTUP_TIMEOUT_MS, 'RevenueCat init');
        rcUserId = await withTimeout(getAppUserId(), RC_STARTUP_TIMEOUT_MS, 'RevenueCat user');
        devLog('[RevenueCat] Initialized, appUserId:', rcUserId);
      } catch (err) {
        console.error('[RevenueCat] init error:', err);
      }
    } else {
      console.warn('[RevenueCat] Missing SDK key, skipping init');
    }

    await resetAuthIfLocal();

    let auth;
    try {
      auth = await initAuth(API_BASE, rcUserId);
      applyAuthState(auth);
      devLog('[Auth] API_BASE:', API_BASE);
      devLog('[Auth] userId:', auth.userId);
      devLog('[Auth] hasToken:', !!auth.token);
      devLog('[Auth] isLocal:', !!auth.isLocal);

      if (auth.isLocal) {
        console.warn('[Auth] Running with local ID — backend unavailable. Check DATABASE_URL in Vercel.');
      } else if (auth.userId && auth.token && hasKey) {
        // Never block splash/authReady on Purchases.logIn — it can hang past the failsafe
        // and leave subscription/API calls racing with a half-finished startup.
        withTimeout(
          linkRevenueCatToBackend(auth.userId),
          RC_STARTUP_TIMEOUT_MS,
          'RevenueCat link'
        ).catch((err) => console.warn('[RevenueCat] link deferred/failed:', err?.message || err));
      }
    } catch (err) {
      console.error('[Auth] init error:', err);
      auth = { userId: null, token: null, isLocal: true };
    }

    return auth;
  };

  const refreshAuthToken = async () => {
    devLog('[Auth] Refreshing JWT...');
    const rcUserId = hasRevenueCatKey() ? await getAppUserId().catch(() => null) : null;
    const auth = await forceReAuth(API_BASE, rcUserId);
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
  const syncSubscriptionToBackend = async (customerInfo) => {
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

    const { productIdentifier, expirationDate } = details;
    const tier = tierFromProductId(productIdentifier);

    try {
      const syncResponse = await fetch(`${API_BASE}/api/sync-subscription`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          userId: syncUserId,
          revenuecatUserId: customerInfo?.originalAppUserId,
          productId: productIdentifier,
          tier,
          expirationDate: expirationDate || undefined,
          platform: Platform.OS,
        }),
      });
      const syncResult = await syncResponse.json();
      if (syncResult.ok) {
        devLog('[subscription] Synced to backend:', syncResult.subscription);
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

  useEffect(() => {
    if (!fontsLoaded || !authReady) return;
    ExpoSplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setSplashHidden(true));
  }, [fontsLoaded, authReady]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !splashHidden) return undefined;

    configureAndroidNavigationBar();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        configureAndroidNavigationBar();
      }
    });

    return () => { subscription.remove(); };
  }, [screen, splashHidden]);

  const showTrialWarningIfNeeded = (subInfo) => {
    if (!isTrialUser(subInfo)) return;
    const remaining = getTrialRemaining(subInfo);
    if (remaining !== 1) return;
    showToast('Trial', getTrialWarningMessage(remaining), 'warning', {
      actionLabel: 'Upgrade',
      onAction: () => setScreen('subscription'),
    });
  };

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
        console.warn('[subscription] No JWT token — refresh may fail in production. Re-authenticate if stuck on trial.');
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

  const fetchStyles = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setStylesLoading(true);
    }
    try {
      const res = await fetch(`${API_BASE}/api/styles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

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
  }, [applyStyles]);

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
      const run = async ({ imageDataUrl, styleId, _authRetried = false }) => {
        if (!styleId) {
          showToast(
            "Couldn't generate",
            'No style selected. Please choose a style and try again.',
            'error'
          );
          return;
        }

        if (serverStyleIdsRef.current && !serverStyleIdsRef.current.has(styleId)) {
          showToast(
            "Couldn't generate",
            `"${styleId}" is not available on ${API_BASE} yet. Redeploy staging to pick up the latest styles.`,
            'error'
          );
          return;
        }

        setLoading(true);
        setJob(null);
        setResult(null);

        // Failsafe: stop loading after 3 minutes (poll loop is up to ~180s)
        const failsafeTimer = setTimeout(() => {
          console.warn('[callApi] Failsafe timeout reached - forcing loading off');
          setLoading(false);
          showToast(
            'Taking longer',
            'This is taking longer than usual. Tap Try again — we may still be finishing your caricature.',
            'warning'
          );
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
              },
            }),
          });

          const enqueueText = await enqueueRes.text();
          let enqueueJson = null;
          try {
            enqueueJson = JSON.parse(enqueueText);
          } catch (parseErr) {
            console.error('Enqueue - JSON parse error:', parseErr, enqueueText?.slice?.(0, 200));
            notifyGenerationFailure(
              showToast,
              'We had trouble talking to the server. Tap Try again — your caricature may still be processing.'
            );
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
              return await run({ imageDataUrl, styleId, _authRetried: true });
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
            throw new Error('NO_JOB_ID: We could not start your caricature');
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

          setTimeout(async () => {
            devLog('[App] Auto-refreshing subscription after generation...');
            const sub = await refreshSubscription();
            if (sub) showTrialWarningIfNeeded(sub);
          }, 1500);

          return;
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
          notifyGenerationFailure(showToast, err);
          setFailedAttempts((prev) => prev + 1);
        } finally {
          clearTimeout(failsafeTimer);
          setLoading(false);
          setJob(null);
        }
      };

      return run;
    },
    [showDialog, closeDialog, handleContentPolicyBlock, showToast]
  );

  const handleSubscribe = async (selectedTier = null) => {
    // Defensive: if called from a TouchableOpacity onPress directly,
    // the arg may be a synthetic event object instead of a tier string.
    if (selectedTier && typeof selectedTier !== 'string') {
      selectedTier = null;
    }
    if (!isOnline) {
      showToast(
        'No connection',
        'Connect to the internet to purchase or restore subscriptions.',
        'warning',
      );
      return;
    }
    setSubscribeLoading(true);
    try {
      const auth = await ensureAuthenticated();
      if (!auth?.userId || !auth?.token) {
        showToast(
          'Connection required',
          'Could not connect to the server. Check your internet and try again.',
          'error'
        );
        return;
      }

      if (!hasRcKey) {
        showToast('Subscriptions', 'RevenueCat SDK key is missing. Please set EXPO_PUBLIC_REVENUECAT_* env vars.', 'error');
        setSubscribeLoading(false);
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
          setSubscribeLoading(false);
          return;
        }
      }

      devLog('[RevenueCat] Fetching offerings...');
      const pkgs = await getOfferings();

      if (!pkgs || pkgs.length === 0) {
        showToast('Subscriptions', 'No subscription packages available yet', 'error');
        setSubscribeLoading(false);
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

      // Attempt purchase
      const purchaseResult = await purchasePackage(selected);

      devLog('[RevenueCat] Purchase result:', {
        productIdentifier: purchaseResult?.productIdentifier,
        hasCustomerInfo: !!purchaseResult?.customerInfo,
      });

      // Re-fetch customer info — entitlements may not be populated immediately in purchaseResult
      let customerInfo = purchaseResult?.customerInfo;
      try {
        customerInfo = (await getCustomerInfo()) || customerInfo;
      } catch (infoErr) {
        console.warn('[RevenueCat] getCustomerInfo after purchase failed:', infoErr);
      }

      const subDetails = getActiveSubscriptionDetails(customerInfo);
      if (subDetails?.productIdentifier) {
        devLog('[RevenueCat] Purchase successful:', subDetails.productIdentifier);

        await ensureAuthenticated();
        await syncSubscriptionToBackend(customerInfo);
        showToast('Purchase successful', 'Your subscription is now active', 'success');
        await refreshSubscription();
      } else {
        console.warn('[RevenueCat] Purchase completed but no active subscription found yet');
        showToast('Purchase completed', 'Subscription will appear shortly. Tap Refresh if it doesn\'t update.', 'warning');
        await new Promise((r) => setTimeout(r, 2000));
        try {
          customerInfo = await getCustomerInfo();
          await ensureAuthenticated();
          await syncSubscriptionToBackend(customerInfo);
        } catch {}
        await refreshSubscription();
      }
    } catch (err) {
      console.error('[RevenueCat] Purchase error code:', err?.code);
      console.error('[RevenueCat] Purchase error message:', err?.message);
      console.error('[RevenueCat] Underlying error:', err?.underlyingErrorMessage);
      console.error('[RevenueCat] Full error:', err);

      // Better error messages based on error type
      let errorMessage = 'Purchase failed or was cancelled.';
      if (err?.userCancelled) {
        errorMessage = 'Purchase was cancelled.';
      } else if (err?.underlyingErrorMessage && err?.message) {
        errorMessage = `${err.message} (${err.underlyingErrorMessage})`;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.code) {
        errorMessage = `Purchase error (code ${err.code})`;
      }

      showToast('Purchase failed', errorMessage, 'error');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!isOnline) {
      showToast(
        'No connection',
        'Connect to the internet to restore purchases.',
        'warning',
      );
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
      showToast(
        'No connection',
        'Connect to the internet to generate caricatures.',
        'warning',
      );
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

  const handleMenuSelect = useCallback((id) => {
    setMenuOpen(false);
    setRestyleMode(false);
    if (id === 'contact') {
      openContactSupport(() => {
        showToast('Email', `Contact us at ${SUPPORT_EMAIL}`, 'info');
      });
      return;
    }
    if (id === 'request-style') {
      openStyleRequest(() => {
        showToast('Email', `Email style ideas to ${SUPPORT_EMAIL}`, 'info');
      });
      return;
    }
    if (id === 'share-app') {
      shareApp().catch(() => {
        showToast('Share', 'Could not open the share sheet', 'error');
      });
      return;
    }
    setScreen(id);
  }, [showToast]);

  const handleUnloadableOutput = useCallback(
    async ({ reason, imageUrl, jobId } = {}) => {
      const resolvedJobId = jobId || result?.jobId || pendingJobId || null;
      const friendly =
        'The caricature came back empty or could not be loaded. Please try again — you were not charged.';

      captureAppError(new Error('BLANK_OR_UNLOADABLE_OUTPUT'), {
        flow: 'generate_output',
        styleId: style?.id || null,
        jobId: resolvedJobId,
        rawErrorMessage: reason || 'unloadable_output',
        imageUrl: imageUrl ? String(imageUrl).slice(0, 200) : null,
      });

      setResult(null);
      notifyGenerationFailure(showToast, friendly);
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
    [pendingJobId, result?.jobId, style?.id, showToast]
  );

  const handleRetry = async () => {
    if (!pendingJobId) {
      if (original?.imageDataUrl && style?.id) {
        callApi({ imageDataUrl: original.imageDataUrl, styleId: style.id });
        return;
      }
      showToast(
        "Couldn't generate",
        'Tap Generate to start again, or go back and choose another photo.',
        'info'
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
      notifyGenerationFailure(showToast, err);
      setFailedAttempts((prev) => prev + 1);
    } finally {
      setLoading(false);
      setJob(null);
    }
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
      if (screen === 'subscription' || screen === 'usage' || screen === 'privacy' || screen === 'terms' || screen === 'about' || screen === 'gallery') {
        setScreen('style');
        return true;
      }
      if (screen === 'style') {
        if (restyleMode) {
          handleCancelRestyle();
          return true;
        }
        return false;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [screen, restyleMode]);

  if (!splashHidden) {
    return null;
  }

  if (stylesLoading && availableStyles.length === 0) {
    return (
      <AppShell>
        <StylesLaunchLoader />
      </AppShell>
    );
  }

  if (screen === 'style') {
    return (
      <AppShell>
        <StyleScreen
          selectedStyle={style}
          availableStyles={availableStyles}
          stylesLoading={stylesLoading}
          restyleMode={restyleMode}
          initialActiveCategory={styleReturnCategory}
          interactionPaused={menuOpen}
          onCancelRestyle={handleCancelRestyle}
          onOpenMenu={() => setMenuOpen(true)}
          onNext={(s) => {
            setStyle(s);
            setStyleReturnCategory(s?.categoryId || getStyleCategory(s?.id) || null);
            if (restyleMode && original?.imageDataUrl) {
              if (!isOnline) {
                showToast(
                  'No connection',
                  'Connect to the internet to generate caricatures.',
                  'warning',
                );
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
            // Fresh style selection — clear any previously picked photo
            // so the upload screen starts from its empty state.
            setPickedImage(null);
            setScreen('upload');
          }}
        />
        <MenuModal
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onSelect={handleMenuSelect}
          userId={userId}
          onUserIdCopied={() => {
            showToast('Copied', 'User ID copied — include it when contacting support', 'success');
          }}
        />
      </AppShell>
    );
  }

  if (screen === 'privacy') {
    return (
      <AppShell>
        <InfoScreen
          title="Privacy Policy"
          content={PRIVACY_POLICY_TEXT}
          onBack={() => setScreen('style')}
        />
      </AppShell>
    );
  }

  if (screen === 'terms') {
    return (
      <AppShell>
        <InfoScreen
          title="Terms & Conditions"
          content={TERMS_TEXT}
          onBack={() => setScreen('style')}
        />
      </AppShell>
    );
  }

  if (screen === 'about') {
    return (
      <AppShell>
        <InfoScreen
          title="About"
          content={ABOUT_TEXT}
          onBack={() => setScreen('style')}
        />
      </AppShell>
    );
  }

  if (screen === 'gallery') {
    return (
      <AppShell>
        <GalleryScreen onBack={() => setScreen('style')} />
      </AppShell>
    );
  }

  if (screen === 'usage') {
    return (
      <AppShell>
        <UsageScreen
          subscriptionInfo={subscriptionInfo}
          subscriptionLoading={subscriptionLoading}
          onRefreshSubscription={refreshSubscription}
          onOpenSubscription={() => setScreen('subscription')}
          onBack={() => setScreen('style')}
        />
      </AppShell>
    );
  }

  if (screen === 'subscription') {
    return (
      <AppShell>
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
      </AppShell>
    );
  }

  if (screen === 'upload') {
    return (
      <AppShell>
        <UploadScreen
          style={style}
          onPicked={(image) => { setPickedImage(image); setScreen('review'); }}
          canGenerateMore={
            subscriptionInfo
              ? !(
                  !subscriptionInfo.isTrial &&
                  subscriptionInfo.usage &&
                  subscriptionInfo.usage.limit > 0 &&
                  subscriptionInfo.usage.current >= subscriptionInfo.usage.limit
                )
              : true
          }
          subscriptionInfo={subscriptionInfo}
          onSubscribe={handleSubscribe}
          onOpenUsage={() => setScreen('usage')}
          onBackToStyle={() => { setRestyleMode(false); setScreen('style'); }}
        />
      </AppShell>
    );
  }

  if (screen === 'review') {
    return (
      <AppShell>
        <PhotoReviewScreen
          style={style}
          imageUri={pickedImage?.uri}
          imageDataUrl={pickedImage?.dataUrl}
          isOnline={isOnline}
          isGenerating={loading}
          subscriptionInfo={subscriptionInfo}
          canGenerateMore={
            subscriptionInfo
              ? !(
                  !subscriptionInfo.isTrial &&
                  subscriptionInfo.usage &&
                  subscriptionInfo.usage.limit > 0 &&
                  subscriptionInfo.usage.current >= subscriptionInfo.usage.limit
                )
              : true
          }
          onStart={handleUploadStart}
          onSubscribe={handleSubscribe}
          onOpenUsage={() => setScreen('usage')}
          onReplacePhoto={(image) => setPickedImage(image)}
          onBack={() => { setPickedImage(null); setScreen('upload'); }}
        />
      </AppShell>
    );
  }

  if (screen === 'result') {
    return (
      <AppShell>
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
        />
      </AppShell>
    );
  }

  return null;
}
