import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StyleLoadingBar from './StyleLoadingBar';
import styles from '../styles';

export default function StyleLoadingEmptyState({
  title = 'Loading styles',
  message = 'Fetching the latest looks…',
}) {
  return (
    <View style={styles.styleEmptyState}>
      <View style={styles.styleLoadingIconWrap}>
        <Feather name="layers" size={22} color="rgba(255,255,255,0.55)" />
      </View>
      <Text style={styles.styleEmptyStateTitle}>{title}</Text>
      <Text style={styles.styleEmptyStateText}>{message}</Text>
      <StyleLoadingBar />
    </View>
  );
}
