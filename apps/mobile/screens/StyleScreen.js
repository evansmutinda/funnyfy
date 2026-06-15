import React from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_INSET_MIN, STYLE_90S_CARTOON, getStyleImage } from '../constants';
import styles from '../styles';

export default function StyleScreen({
  selectedStyle,
  availableStyles,
  onNext,
  onOpenMenu,
}) {
  const insets = useSafeAreaInsets();
  const styleList = Array.isArray(availableStyles) && availableStyles.length > 0
    ? availableStyles
    : [STYLE_90S_CARTOON];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />

      <View style={styles.fixedHeader}>
        <View style={styles.headerBar}>
          <Text style={styles.wordmark}>FunnyFy</Text>
          <TouchableOpacity onPress={onOpenMenu} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.styleContainer}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.styleGrid, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
          {styleList.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.card,
                styles.styleCard,
                selectedStyle?.id === s.id && styles.styleCardSelected
              ]}
              activeOpacity={0.9}
              onPress={() => onNext(s)}
            >
              <View style={styles.styleImageWrapper}>
                <Image source={getStyleImage(s)} style={styles.styleImage} />
              </View>
              <View style={styles.styleCardLabel}>
                <Text style={styles.styleCardName} numberOfLines={1}>{s.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: Math.max(insets.bottom, BOTTOM_INSET_MIN) }} />
      </ScrollView>
    </SafeAreaView>
  );
}
