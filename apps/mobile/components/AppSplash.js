import React from 'react';
import { Image, View } from 'react-native';
import styles from '../styles';

const SPLASH_LOGO = require('../assets/splash-logo.png');

/** In-app splash — used in Expo Go where native splash/icon config is ignored. */
export default function AppSplash() {
  return (
    <View style={styles.appSplashRoot}>
      <Image source={SPLASH_LOGO} style={styles.appSplashLogo} resizeMode="contain" />
    </View>
  );
}
