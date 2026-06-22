// Expo app configuration
// Version: apps/mobile/version.json (bump via scripts/bump-version.js or build scripts)
// Note: EXPO_PUBLIC_* environment variables are automatically available in the app
// They are loaded from:
// 1. .env file in this directory (for local development)
// 2. EAS secrets (for EAS builds - set via: eas secret:create)
// 3. System environment variables

const versionInfo = require('./version.json');
const { DARK_BG, navBarColorNative } = require('./constants/theme');

export default {
  expo: {
    name: 'FunnyFy',
    slug: 'funnyfyapp',
    version: versionInfo.version,
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    icon: './assets/icon.jpg',
    splash: {
      // Android 12+ needs a splash image drawable; transparent pixel = solid color only.
      image: './assets/splash-transparent.png',
      resizeMode: 'contain',
      backgroundColor: DARK_BG,
    },
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      buildNumber: String(versionInfo.iosBuildNumber),
      infoPlist: {
        NSCameraUsageDescription: 'FunnyFy needs camera access to take photos for caricatures.',
        NSPhotoLibraryUsageDescription: 'FunnyFy needs photo library access to pick photos for caricatures.',
        NSPhotoLibraryAddUsageDescription: 'FunnyFy needs permission to save caricatures to your photo library.',
      },
    },
    android: {
      package: 'com.evansks.funnyfyapp',
      versionCode: versionInfo.androidVersionCode,
      allowBackup: false,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
      ],
    },
    androidNavigationBar: {
      backgroundColor: navBarColorNative(),
      barStyle: 'light-content',
    },
    web: { bundler: 'metro' },
    plugins: [
      'expo-font',
      [
        'expo-navigation-bar',
        {
          backgroundColor: navBarColorNative(),
          barStyle: 'light',
          position: 'absolute',
        },
      ],
      './plugins/withAndroidNavBarContrast.js',
      [
        'expo-splash-screen',
        {
          backgroundColor: DARK_BG,
          image: './assets/splash-transparent.png',
          resizeMode: 'contain',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow FunnyFy to access your photos.',
          savePhotosPermission: 'Allow FunnyFy to save your caricatures.',
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
