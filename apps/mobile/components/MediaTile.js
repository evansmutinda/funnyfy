import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';

/**
 * Shared image tile — style picker, gallery grid, upload chip.
 * variant: 'grid' (48% width parent) | 'chip' (compact thumbnail)
 */
export default function MediaTile({
  imageSource,
  label,
  isSelected = false,
  variant = 'grid',
  badge,
}) {
  const showLabel = Boolean(label);
  const isHero = variant === 'hero';

  return (
    <View style={[styles.styleTileRing, isSelected && styles.styleTileRingSelected]}>
      <View
        style={[
          styles.styleImageWrapper,
          variant === 'chip' && styles.mediaTileChipWrapper,
          isHero && styles.styleHeroImageWrapper,
        ]}
      >
        <Image source={imageSource} style={styles.styleImage} resizeMode="cover" />
        {badge ? (
          <View style={styles.styleHeroBadge}>
            <Text style={styles.styleHeroBadgeText}>{badge}</Text>
          </View>
        ) : null}
        {showLabel && (
          <>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
              locations={[0.45, 0.78, 1]}
              style={[
                styles.styleTileGradient,
                variant === 'chip' && styles.mediaTileChipGradient,
              ]}
            />
            <View
              style={[
                styles.styleImageOverlay,
                variant === 'chip' && styles.mediaTileChipOverlay,
              ]}
            >
              <Text
                style={[
                  styles.styleImageLabel,
                  variant === 'chip' && styles.mediaTileChipLabel,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
