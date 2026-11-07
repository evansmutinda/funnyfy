import './polyfills';
import React from 'react';
import registerRootComponent from 'expo/src/launch/registerRootComponent';

import App from './App';
import StartupErrorBoundary from './components/StartupErrorBoundary';

let Root = function RootApp() {
  return (
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  );
};

try {
  const Sentry = require('@sentry/react-native');
  const { initSentry } = require('./utils/sentry');
  initSentry();
  Root = Sentry.wrap(Root);
} catch (err) {
  console.warn('[Sentry] Startup skipped:', err?.message || err);
}

registerRootComponent(Root);
