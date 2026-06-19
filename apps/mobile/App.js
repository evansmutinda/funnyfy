// URL polyfill — RevenueCat's sdk_initialized tracking uses URL.search (not fully supported in RN/Hermes)
import 'react-native-url-polyfill/auto';
import {
  useFonts,
  PlusJakartaSans_400Regular,
} from '@expo-google-fonts/plus-jakarta-sans';
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
import OfflineBanner from './components/OfflineBanner';
import MenuModal from './components/MenuModal';
import SplashScreen from './components/SplashScreen';
import GalleryScreen from './screens/GalleryScreen';
import InfoScreen from './screens/InfoScreen';
import StyleScreen from './screens/StyleScreen';
import UploadScreen from './screens/UploadScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import ResultScreen from './screens/ResultScreen';
import {
  API_BASE,
  PRIVACY_POLICY_TEXT,
  TERMS_TEXT,
  ABOUT_TEXT,
} from './constants';
import { DEFAULT_ENABLED_STYLES } from './data/styleCatalog';
import { getTrialRemaining, getTrialWarningMessage, isTrialUser } from './utils/trialWarnings';

// Enforce HTTPS for security — prevent accidental HTTP misconfiguration
if (API_BASE.startsWith('http://') && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')) {
  console.error('[Security] API_BASE must use HTTPS in production. Refusing to start with insecure URL.');
  throw new Error('Insecure API URL: HTTPS required for production');
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <NetworkProvider>
          <AppContent />
        </NetworkProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

function AppShell({ children, showOfflineBanner = true }) {
  return (
    <View style={{ flex: 1 }}>
      {showOfflineBanner ? <OfflineBanner /> : null}
      {children}
    </View>
  );
}

function AppContent() {
  const { showToast, showDialog, closeDialog } = useNotifications();
  const { isOnline } = useNetwork();
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
  const [restyleMode, setRestyleMode] = useState(false);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [splashMinDone, setSplashMinDone] = useState(false);
  const userIdRef = useRef(null);
  const authTokenRef = useRef(null);
  const authInitPromiseRef = useRef(null);
  const resultBackHandlerRef = useRef(null);
  const subscriptionRefreshSeqRef = useRef(0);
  const revenueCatExpirationRef = useRef(null);
  const wasOnlineRef = useRef(true);

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

  const applyAuthState = (auth) => {
    if (!auth?.userId) return auth;
    setUserId(auth.userId);
    setAuthToken(auth.token || null);
    userIdRef.current = auth.userId;
    authTokenRef.current = auth.token || null;
    return auth;
  };

  const linkRevenueCatToBackend = async (backendUserId) => {
    if (!hasRevenueCatKey() || !backendUserId) return null;
    try {
      const rcCustomerInfo = await loginUser(backendUserId);
      console.log('[RevenueCat] Linked to backend user:', backendUserId);
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
        await initRevenueCat(null);
        rcUserId = await getAppUserId();
        console.log('[RevenueCat] Initialized, appUserId:', rcUserId);
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
      console.log('[AUTH_DEBUG] API_BASE:', API_BASE);
      console.log('[AUTH_DEBUG] userId:', auth.userId);
      console.log('[AUTH_DEBUG] hasToken:', !!auth.token);
      console.log('[AUTH_DEBUG] isLocal:', !!auth.isLocal);

      if (auth.isLocal) {
        console.warn('[Auth] Running with local ID — backend unavailable. Check DATABASE_URL in Vercel.');
      } else if (auth.userId && auth.token && hasKey) {
        const rcCustomerInfo = await linkRevenueCatToBackend(auth.userId);
        if (rcCustomerInfo) {
          // sync happens after ensureAuthenticated is available — defer via getCustomerInfo in refresh
        }
      }
    } catch (err) {
      console.error('[Auth] init error:', err);
      auth = { userId: null, token: null, isLocal: true };
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

    console.log('[Auth] Ensuring authentication...');
    const rcUserId = hasRevenueCatKey() ? await getAppUserId().catch(() => null) : null;

    // No JWT means stored auth is stale or startup raced — force a fresh token
    let auth = await forceReAuth(API_BASE, rcUserId);
    applyAuthState(auth);

    if (!auth.token && auth.isLocal) {
      console.warn('[Auth] Still no token after forceReAuth — backend may be unreachable');
      return auth;
    }

    if (auth.userId && auth.token && hasRevenueCatKey()) {
      await linkRevenueCatToBackend(auth.userId);
    }

    return auth;
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
        console.log('[subscription] Synced to backend:', syncResult.subscription);
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
    authInitPromiseRef.current = performAuthInit()
      .catch((err) => {
        console.error('[Auth] Startup init failed:', err);
        return null;
      })
      .finally(() => setAuthReady(true));
  }, []);

  // Leave splash only after minimum display time AND auth has finished starting
  useEffect(() => {
    if (screen === 'splash' && splashMinDone && authReady) {
      setScreen('style');
    }
  }, [screen, splashMinDone, authReady]);

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

  const fetchStyles = useCallback(async () => {
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
        setAvailableStyles(serverStyles);
      } else {
        throw new Error('No styles returned');
      }
    } catch (err) {
      console.error('Failed to fetch styles from server, using default:', err);
      setAvailableStyles(DEFAULT_ENABLED_STYLES);
    }
  }, []);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  useEffect(() => {
    if (!wasOnlineRef.current && isOnline) {
      console.log('[Network] Back online — refreshing styles and subscription');
      fetchStyles();
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

                // NOTE: Gallery save is intentionally NOT done here.
                // The user must tap Save on the result screen to add to My Caricatures.

                // Auto-refresh subscription after successful generation
                setTimeout(async () => {
                  console.log('[App] Auto-refreshing subscription after generation...');
                  const sub = await refreshSubscription();
                  if (sub) showTrialWarningIfNeeded(sub);
                }, 1500);

                return; // Done
              } else {
                throw new Error(jobInfo.errorMessage || 'Image generation failed');
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          throw new Error('Image generation timed out. Please check My Gallery later.');
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
    if (!isOnline) {
      showToast(
        'No connection',
        'Connect to the internet to purchase or restore subscriptions.',
        'warning',
      );
      return;
    }
    setSubscribeLoading(true);
    setError('');
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
        console.log('[RevenueCat] Purchase successful:', subDetails.productIdentifier);

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
    showDialog({
      title: 'Manage subscription',
      message: `To cancel auto-renew, turn it off in ${storeName}. Your plan stays active until the end of the current billing period. When you return here, tap Refresh to update your status.`,
      cancelLabel: 'Not now',
      confirmLabel: `Open ${storeName}`,
      destructive: false,
      onCancel: closeDialog,
      onConfirm: async () => {
        closeDialog();
        setSubscribeLoading(true);
        try {
          const customerInfo = await getCustomerInfo();
          await openSubscriptionManagement(customerInfo);
        } catch (err) {
          console.error('[Manage Subscription] error:', err);
          showToast(
            'Could not open subscriptions',
            `Open ${storeName} manually, then tap Refresh here.`,
            'error',
          );
        } finally {
          setSubscribeLoading(false);
        }
      },
    });
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
    setOriginal({ imageUri, imageDataUrl, prompt: style?.prompt });
    setPendingJobId(null);
    setFailedAttempts(0);
    setError('');
    setRestyleMode(false);
    setScreen('result');
    await callApi({ imageDataUrl });
  };

  const handleCancelRestyle = () => {
    setRestyleMode(false);
  };

  const handleTryAnotherStyle = () => {
    setRestyleMode(true);
    setResult(null);
    setError('');
    setFailedAttempts(0);
    setPendingJobId(null);
    setScreen('style');
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
              // NOTE: Gallery save is manual only — not triggered on retry completion.
              setTimeout(() => refreshSubscription(), 500);
              return;
            } else {
              throw new Error(jobInfo.errorMessage || 'Image generation failed');
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        throw new Error('Image generation timed out. Please check My Gallery later.');
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
      if (screen === 'style') {
        if (restyleMode) {
          handleCancelRestyle();
          return true;
        }
        return false;
      }
      if (screen === 'splash') return true;
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [screen, restyleMode]);

  if (screen === 'splash') {
    return <SplashScreen onComplete={() => setSplashMinDone(true)} />;
  }

  if (screen === 'style') {
    return (
      <AppShell>
        <StyleScreen
          selectedStyle={style}
          availableStyles={availableStyles}
          restyleMode={restyleMode}
          onCancelRestyle={handleCancelRestyle}
          onOpenMenu={() => setMenuOpen(true)}
          onNext={(s) => {
            setStyle(s);
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
              setError('');
              setFailedAttempts(0);
              setPendingJobId(null);
              setScreen('result');
              callApi({ imageDataUrl: original.imageDataUrl });
              return;
            }
            setRestyleMode(false);
            setScreen('upload');
          }}
        />
        <MenuModal
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onSelect={(id) => {
            setMenuOpen(false);
            setRestyleMode(false);
            setScreen(id);
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

  if (screen === 'subscription') {
    return (
      <AppShell>
        <SubscriptionScreen
          subscriptionInfo={subscriptionInfo}
          subscriptionLoading={subscriptionLoading}
          onRefreshSubscription={refreshSubscription}
          onSubscribe={handleSubscribe}
          subscribeLoading={subscribeLoading}
          onManageSubscription={handleManageSubscription}
          storeSubscriptionLabel={getStoreSubscriptionLabel()}
          onRestorePurchases={handleRestorePurchases}
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
          isOnline={isOnline}
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
        onOpenSubscription={() => setScreen('subscription')}
        onBackToStyle={() => { setRestyleMode(false); setScreen('style'); }}
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
        error={error}
        failedAttempts={failedAttempts}
        onRetry={handleRetry}
        subscriptionInfo={subscriptionInfo}
        backHandlerRef={resultBackHandlerRef}
        style={style}
        onBack={() => { setScreen('upload'); setError(''); setFailedAttempts(0); }}
        onHome={() => { setRestyleMode(false); setScreen('style'); }}
        onOpenGallery={() => setScreen('gallery')}
        onTryAnotherStyle={handleTryAnotherStyle}
        />
      </AppShell>
    );
  }

  return null;
}
