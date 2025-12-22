// Expo app configuration
// Note: EXPO_PUBLIC_* environment variables are automatically available in the app
// Set EXPO_PUBLIC_API_URL in your environment before running 'expo start'

export default {
  expo: {
    name: 'FunnyFy',
    slug: 'funnyfy',
    version: '1.0.0',
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
      versionCode: 1,
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