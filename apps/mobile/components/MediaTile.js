import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';

const DISCOVERY_VARIANTS = new Set(['discovery', 'discoveryWide', 'discoveryDense']);

/**
 * Shared image tile — style picker, gallery grid, upload chip.
 * variant: 'grid' | 'discovery' | 'discoveryWide' | 'discoveryDense' | 'chip' | 'hero'
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
  const isDiscovery = DISCOVERY_VARIANTS.has(variant);
  const isWide = variant === 'discoveryWide';
  const isDense = variant === 'discoveryDense';

  const imageWrapperStyle = isDiscovery
    ? [
        !isWide && !isDense && styles.discoveryImageWrapper,
        isWide && styles.discoveryWideImageWrapper,
        isDense && styles.discoveryDenseImageWrapper,
        styles.styleCardImageShell,
        isSelected && styles.styleCardImageShellSelected,
      ]
    : [
        styles.styleImageWrapper,
        variant === 'chip' && styles.mediaTileChipWrapper,
        isHero && styles.styleHeroImageWrapper,
      ];

  const labelStyle = [
    !isDiscovery && styles.styleImageLabel,
    isDiscovery && !isWide && !isDense && styles.discoveryImageLabel,
    isWide && styles.discoveryWideImageLabel,
    isDense && styles.discoveryDenseImageLabel,
    variant === 'chip' && styles.mediaTileChipLabel,
  ];

  return (
    <View
      style={[
        isDiscovery ? styles.styleCardOuter : styles.styleTileRing,
        isSelected && !isDiscovery && styles.styleTileRingSelected,
      ]}
    >
      <View style={imageWrapperStyle}>
        <Image source={imageSource} style={styles.styleImage} resizeMode="cover" />
        {badge ? (
          <View style={styles.styleHeroBadge}>
            <Text style={styles.styleHeroBadgeText}>{badge}</Text>
          </View>
        ) : null}
        {showLabel ? (
          <>
            <LinearGradient
              colors={
                isWide
                  ? ['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.55)']
                  : isDense
                    ? ['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.7)']
                    : isDiscovery
                      ? ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)']
                      : ['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']
              }
              locations={isWide ? [0.55, 0.85, 1] : isDense ? [0.52, 0.84, 1] : [0.5, 0.82, 1]}
              style={[
                styles.styleTileGradient,
                isWide && styles.discoveryWideTileGradient,
                isDense && styles.discoveryDenseTileGradient,
                isDiscovery && !isWide && !isDense && styles.discoveryTileGradient,
                variant === 'chip' && styles.mediaTileChipGradient,
              ]}
            />
            <View
              style={[
                styles.styleImageOverlay,
                isWide && styles.discoveryWideImageOverlay,
                isDense && styles.discoveryDenseImageOverlay,
                isDiscovery && !isWide && !isDense && styles.discoveryImageOverlay,
                variant === 'chip' && styles.mediaTileChipOverlay,
              ]}
            >
              {isDiscovery ? (
                <View
                  style={[
                    styles.discoveryLabelBackdrop,
                    isWide && styles.discoveryWideLabelBackdrop,
                    isDense && styles.discoveryDenseLabelBackdrop,
                  ]}
                >
                  <Text
                    style={labelStyle}
                    numberOfLines={isWide ? 1 : isDense ? 2 : 2}
                  >
                    {label}
                  </Text>
                </View>
              ) : (
                <Text style={labelStyle} numberOfLines={isWide ? 1 : isDense ? 2 : 2}>
                  {label}
                </Text>
              )}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}
