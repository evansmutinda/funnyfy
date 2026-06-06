import React from 'react';
import { SafeAreaView, StatusBar, View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';
import StyleCard from '../components/StyleCard';

const STYLE_90S_CARTOON = {
  id: '90s-cartoon',
  label: '90s Cartoon',
  description: 'Classic 90s animated cartoon style'
};

export default function HomeScreen({
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
      
      {/* Fixed header */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerBar}>
          <Text style={styles.wordmark}>FunnyFy</Text>
          <TouchableOpacity onPress={onOpenMenu} style={styles.iconButton}>
            <Text style={styles.iconButtonIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content under fixed header */}
      <ScrollView 
        contentContainerStyle={styles.styleContainer}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.styleGrid, { paddingBottom: Math.max(insets.bottom, 48) }]}>
          {styleList.map((s) => (
            <StyleCard
              key={s.id}
              style={s}
              isSelected={selectedStyle?.id === s.id}
              onPress={onNext}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
