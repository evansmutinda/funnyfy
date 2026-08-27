// Expo app configuration
// Version: apps/mobile/version.json (bump via apps/mobile/scripts/bump-version.js or build scripts)
// Note: EXPO_PUBLIC_* environment variables are automatically available in the app
// They are loaded from:
// 1. .env file in this directory (for local development)
// 2. EAS secrets (for EAS builds - set via: eas secret:create)
// 3. System environment variables

const versionInfo = require('./version.json');
const { DARK_BG } = require('./constants/theme');

export default {
  expo: {
    name: 'FunnyFy',
    slug: 'funnyfyapp',
    version: versionInfo.version,
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash-logo.png',
      resizeMode: 'contain',
      backgroundColor: DARK_BG,
    },
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: [
      'assets/**/*',
      '!assets/comparisons/source/**',
    ],
    ios: {
      supportsTablet: true,
      buildNumber: String(versionInfo.iosBuildNumber),
      infoPlist: {
        NSCameraUsageDescription: 'FunnyFy needs camera access to take photos for image generation.',
        NSPhotoLibraryUsageDescription: 'FunnyFy needs photo library access to pick photos for image generation.',
        NSPhotoLibraryAddUsageDescription: 'FunnyFy needs permission to save images to your photo library.',
      },
    },
    android: {
      package: 'com.evansks.funnyfyapp',
      versionCode: versionInfo.androidVersionCode,
      allowBackup: false,
      adaptiveIcon: {
        // Android crops the foreground to a circle; art is sized to survive that.
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: DARK_BG,
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
      ],
    },
    androidNavigationBar: {
      backgroundColor: DARK_BG,
      barStyle: 'light-content',
    },
    web: { bundler: 'metro' },
    plugins: [
      [
        '@sentry/react-native/expo',
        {
          organization: 'funnyfy',
          project: 'react-native',
        },
      ],
      'expo-secure-store',
      './plugins/withReleaseSigning.js',
      'expo-font',
      [
        'expo-navigation-bar',
        {
          backgroundColor: DARK_BG,
          barStyle: 'light',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: DARK_BG,
          image: './assets/splash-logo.png',
          resizeMode: 'contain',
          // Android 12+ masks the splash icon into a circle; keep it small enough to survive the crop.
          imageWidth: 200,
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow FunnyFy to access your photos.',
          savePhotosPermission: 'Allow FunnyFy to save your images.',
          isAccessMediaLocationEnabled: true,
          granularPermissions: ['photo'],
        },
      ],
    ],
    extra: {
      // Correct EAS project ID provided by `eas build`
      eas: { projectId: '09895e1f-da8e-4d28-88e1-e8ba89949281' },
    },
  },
};
