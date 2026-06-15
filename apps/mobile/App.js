import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initRevenueCat, getOfferings, purchasePackage, restorePurchases, getCustomerInfo, getAppUserId, hasRevenueCatKey, isConfigured as isRcConfigured } from './services/revenuecat';
import { initAuth, resetAuthIfLocal } from './services/auth';
import NotificationProvider, { useNotifications } from './components/NotificationProvider';
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
  STYLE_90S_CARTOON,
} from './constants';

// Enforce HTTPS for security — prevent accidental HTTP misconfiguration
if (API_BASE.startsWith('http://') && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')) {
  console.error('[Security] API_BASE must use HTTPS in production. Refusing to start with insecure URL.');
  throw new Error('Insecure API URL: HTTPS required for production');
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

                // NOTE: Gallery save is intentionally NOT done here.
                // The user must tap Save on the result screen to add to My Caricatures.

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
    setSubscribeLoading(true);
    setError('');
    try {
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
            // Fall back to RC anonymous ID if auth userId is missing (e.g. backend was briefly down)
            const syncUserId = userIdRef.current || customerInfo.originalAppUserId;
            console.log('[RevenueCat] Syncing subscription to backend...', { syncUserId: syncUserId || '(none)' });
            const syncResponse = await fetch(`${API_BASE}/api/sync-subscription`, {
              method: 'POST',
              headers: { ...getApiHeaders(), 'x-user-id': syncUserId || '' },
              body: JSON.stringify({
                userId: syncUserId,
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
        style={style}
        onBack={() => { setScreen('upload'); setError(''); setFailedAttempts(0); }}
        onHome={() => setScreen('style')}
      />
    );
  }

  return null;
}
