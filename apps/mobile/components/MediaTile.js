import React, { memo, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ComparisonFade, {
  DEFAULT_COMPARISON_CYCLES,
  TILE_FADE_MS,
  TILE_HOLD_MS,
} from './ComparisonFade';
import useAppForeground from '../hooks/useAppForeground';
import styles from '../styles';

const DISCOVERY_VARIANTS = new Set(['discovery', 'discoveryWide', 'discoveryDense', 'discoveryRow']);

const CAPTION_MAX_LINES = {
  discovery: 3,
  discoveryRow: 3,
  discoveryWide: 2,
  discoveryDense: 3,
};

/**
 * Shared image tile — style picker, gallery grid, upload chip.
 * variant: 'grid' | 'discovery' | 'discoveryWide' | 'discoveryDense' | 'chip' | 'hero'
 */
function MediaTile({
  imageSource,
  comparisonPair = null,
  label,
  isSelected = false,
  variant = 'grid',
  badge,
  comparisonActive = true,
  interactionPaused = false,
}) {
  const showLabel = Boolean(label);
  const isHero = variant === 'hero';
  const isDiscovery = DISCOVERY_VARIANTS.has(variant);
  const isWide = variant === 'discoveryWide';
  const isDense = variant === 'discoveryDense';
  const labelBelowImage = isDiscovery;
  const resolvedPair =
    comparisonPair?.before && comparisonPair?.after ? comparisonPair : null;
  const showComparison = Boolean(resolvedPair);
  const appForeground = useAppForeground();
  const comparisonPausedRaw =
    !showComparison || !comparisonActive || !appForeground;
  const [comparisonPaused, setComparisonPaused] = useState(comparisonPausedRaw);

  useEffect(() => {
    if (interactionPaused) return undefined;
    if (!comparisonPausedRaw) {
      setComparisonPaused(false);
      return undefined;
    }
    const timeoutId = setTimeout(() => setComparisonPaused(true), 120);
    return () => clearTimeout(timeoutId);
  }, [comparisonPausedRaw, interactionPaused]);

  const [comparisonReady, setComparisonReady] = useState(!interactionPaused);
  useEffect(() => {
    if (interactionPaused) {
      setComparisonReady(false);
      return undefined;
    }
    const timeoutId = setTimeout(() => setComparisonReady(true), 280);
    return () => clearTimeout(timeoutId);
  }, [interactionPaused]);

  // Menu overlay: skip ComparisonFade entirely so Reanimated stops immediately.
  const useStaticComparison = interactionPaused && showComparison;
  const runComparison = showComparison && comparisonReady && !interactionPaused;

  const imageWrapperStyle = isDiscovery
    ? [
        variant === 'discoveryRow' && styles.discoveryRowImageWrapper,
        variant === 'discovery' && styles.discoveryImageWrapper,
        isWide && styles.discoveryWideImageWrapper,
        isDense && styles.discoveryDenseImageWrapper,
        styles.styleCardImageShell,
        showComparison && styles.styleCardImageShellComparison,
        isSelected && styles.styleCardImageShellSelected,
      ]
    : [
        styles.styleImageWrapper,
        variant === 'chip' && styles.mediaTileChipWrapper,
        isHero && styles.styleHeroImageWrapper,
      ];

  const overlayLabelStyle = [
    !isDiscovery && styles.styleImageLabel,
    isDiscovery && !isWide && !isDense && styles.discoveryImageLabel,
    isWide && styles.discoveryWideImageLabel,
    isDense && styles.discoveryDenseImageLabel,
    variant === 'chip' && styles.mediaTileChipLabel,
  ];

  const isRow = variant === 'discoveryRow';
  const captionStyle = [
    styles.discoveryCardCaption,
    isRow && styles.discoveryRowCardCaption,
    isWide && styles.discoveryWideCardCaption,
    isDense && styles.discoveryDenseCardCaption,
  ];

  const captionLines = CAPTION_MAX_LINES[variant] || 2;

  return (
    <View
      style={[
        isDiscovery ? styles.styleCardOuter : styles.styleTileRing,
        isSelected && !isDiscovery && styles.styleTileRingSelected,
      ]}
    >
      <View style={imageWrapperStyle}>
        {runComparison ? (
          <ComparisonFade
            beforeSource={resolvedPair.before}
            afterSource={resolvedPair.after}
            style={StyleSheet.absoluteFillObject}
            paused={comparisonPaused}
            holdMs={TILE_HOLD_MS}
            fadeMs={TILE_FADE_MS}
            maxCycles={DEFAULT_COMPARISON_CYCLES}
          />
        ) : useStaticComparison ? (
          <Image
            source={resolvedPair.after}
            style={styles.styleImage}
            resizeMode="cover"
          />
        ) : (
          <Image source={imageSource} style={styles.styleImage} resizeMode="cover" />
        )}
        {badge ? (
          <View style={styles.styleHeroBadge}>
            <Text style={styles.styleHeroBadgeText}>{badge}</Text>
          </View>
        ) : null}
        {isDiscovery ? (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.28)']}
            locations={[0.65, 0.88, 1]}
            style={[
              styles.styleTileGradient,
              isWide && styles.discoveryWideTileGradient,
              isDense && styles.discoveryDenseTileGradient,
              !isWide && !isDense && styles.discoveryTileGradient,
            ]}
          />
        ) : null}
        {showLabel && !labelBelowImage ? (
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
              <Text style={overlayLabelStyle} numberOfLines={captionLines}>
                {label}
              </Text>
            </View>
          </>
        ) : null}
      </View>
      {showLabel && labelBelowImage ? (
        <Text
          style={captionStyle}
          numberOfLines={captionLines}
          ellipsizeMode="tail"
          {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export default memo(MediaTile);
