import * as Sentry from '@sentry/react-native';

const SENSITIVE_KEY = /authorization|token|password|secret|base64|dataurl|image/i;

function scrubEvent(event) {
  if (event.request?.headers) {
    for (const key of Object.keys(event.request.headers)) {
      if (SENSITIVE_KEY.test(key)) {
        event.request.headers[key] = '[Filtered]';
      }
    }
  }
  return event;
}

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (!__DEV__) {
      console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN is not set');
    }
    return false;
  }

  const forceEnable = process.env.EXPO_PUBLIC_SENTRY_ENABLED === 'true';
  const environment =
    process.env.EXPO_PUBLIC_SENTRY_ENV ||
    (__DEV__ ? 'development' : 'production');

  try {
    Sentry.init({
      dsn,
      environment,
      enabled: forceEnable || !__DEV__,
      tracesSampleRate: 0.2,
      sendDefaultPii: false,
      beforeSend: scrubEvent,
    });
  } catch (err) {
    console.warn('[Sentry] init failed:', err?.message || err);
    return false;
  }

  if (process.env.EXPO_PUBLIC_SENTRY_TEST === 'true') {
    Sentry.captureMessage('FunnyFy Sentry connection test');
  }

  return true;
}

export function setSentryUser(userId) {
  if (!userId || !process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.setUser({ id: String(userId) });
}

export function captureAppError(err, context = {}) {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;

  const rawErrorMessage =
    err?.rawErrorMessage ||
    context.rawErrorMessage ||
    null;
  const jobId = err?.jobId || context.jobId || null;
  const styleId = err?.styleId || context.styleId || null;

  const extra = {
    ...context,
    ...(rawErrorMessage ? { rawErrorMessage: String(rawErrorMessage).slice(0, 1000) } : {}),
    ...(jobId ? { jobId: String(jobId) } : {}),
    ...(styleId ? { styleId: String(styleId) } : {}),
    userMessage: err?.message ? String(err.message).slice(0, 240) : undefined,
  };

  // Group by technical cause when available, not the shared friendly copy
  const fingerprint = rawErrorMessage
    ? ['generation-failed', String(rawErrorMessage).slice(0, 160)]
    : undefined;

  Sentry.captureException(err, {
    extra,
    tags: {
      flow: context.flow || 'unknown',
      ...(jobId ? { jobId: String(jobId) } : {}),
    },
    ...(fingerprint ? { fingerprint } : {}),
  });
}
