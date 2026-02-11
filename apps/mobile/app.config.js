// Expo app configuration
// Note: EXPO_PUBLIC_* environment variables are automatically available in the app
// They are loaded from:
// 1. .env file in this directory (for local development)
// 2. EAS secrets (for EAS builds - set via: eas secret:create)
// 3. System environment variables

export default {
  expo: {
    name: 'FunnyFy',
    slug: 'funnyfyapp',
    version: '1.0.1',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    icon: './assets/icon.jpg',
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: { 
      supportsTablet: true,
      buildNumber: '1'
    },
    android: {
      package: 'com.evansks.funnyfyapp',
      versionCode: 2,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
      ],
      navigationBar: {
        backgroundColor: '#f9fafb',
        barStyle: 'light-content',
      },
    },
    web: { bundler: 'metro' },
    extra: {
      // Correct EAS project ID provided by `eas build`
      eas: { projectId: '09895e1f-da8e-4d28-88e1-e8ba89949281' }
    }
  }
};