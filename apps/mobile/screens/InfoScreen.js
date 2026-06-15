import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_INSET_MIN } from '../constants';
import styles from '../styles';

export default function InfoScreen({ title, content, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={styles.infoContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.wordmark}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.infoContent, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.infoText}>{content}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
