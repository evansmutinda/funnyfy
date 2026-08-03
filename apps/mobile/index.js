import './polyfills';
import registerRootComponent from 'expo/src/launch/registerRootComponent';

import App from './App';

let Root = App;
try {
  const Sentry = require('@sentry/react-native');
  const { initSentry } = require('./utils/sentry');
  initSentry();
  Root = Sentry.wrap(App);
} catch (err) {
  console.warn('[Sentry] Startup skipped:', err?.message || err);
}

registerRootComponent(Root);
