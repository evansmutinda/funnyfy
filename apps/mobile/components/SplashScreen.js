import React, { useEffect } from 'react';
import { Image, SafeAreaView, StatusBar, View } from 'react-native';
import styles from '../styles';

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SafeAreaView style={[styles.safe, styles.splashSafe]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.splashContainer}>
        <Image
          source={require('../assets/icon.jpg')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}
