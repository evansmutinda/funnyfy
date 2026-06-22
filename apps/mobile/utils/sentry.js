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

  Sentry.init({
    dsn,
    environment,
    enabled: forceEnable || !__DEV__,
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });

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
  Sentry.captureException(err, { extra: context });
}
