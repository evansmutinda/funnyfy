import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PressScale from '../components/PressScale';
import { BOTTOM_INSET_MIN } from '../constants';
import useStableSafeAreaInsets from '../hooks/useStableSafeAreaInsets';
import styles from '../styles';

export default function InfoScreen({ title, content, onBack }) {
  const insets = useStableSafeAreaInsets();
  return (
    <View style={styles.safe}>
      <View style={[styles.infoContainer, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerBar}>
          <PressScale onPress={onBack} style={styles.iconButton}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </PressScale>
          <Text style={styles.restyleHeaderTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.infoContent, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.infoText}>{content}</Text>
        </ScrollView>
      </View>
    </View>
  );
}
