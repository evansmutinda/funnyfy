import 'react-native-url-polyfill/auto';

// RevenueCat Expo Go / browser mode tracks sdk_initialized via purchases-js,
// which reads window.location.search — undefined in React Native.
const win = globalThis.window ?? globalThis;
if (!win.location) {
  win.location = {
    search: '',
    origin: 'https://localhost',
    pathname: '/',
    href: 'https://localhost/',
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = win;
}
