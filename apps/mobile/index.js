import './polyfills';
import registerRootComponent from 'expo/src/launch/registerRootComponent';

import App from './App';
import * as Sentry from '@sentry/react-native';
import { initSentry } from './utils/sentry';

initSentry();
registerRootComponent(Sentry.wrap(App));
