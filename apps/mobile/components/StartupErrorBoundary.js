import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DARK_BG } from '../constants/theme';

/**
 * Surfaces fatal render/import errors instead of leaving users on a blank splash logo.
 */
export default class StartupErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[StartupErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error?.message || String(this.state.error);
    const stack = this.state.error?.stack || '';

    return (
      <View style={{ flex: 1, backgroundColor: DARK_BG, padding: 24, paddingTop: 64 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          Startup error
        </Text>
        <ScrollView>
          <Text style={{ color: '#FCA5A5', fontSize: 14, marginBottom: 16 }}>{message}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{stack}</Text>
        </ScrollView>
      </View>
    );
  }
}
