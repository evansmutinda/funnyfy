import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MediaTile from '../components/MediaTile';
import { BOTTOM_INSET_MIN, getStyleImage } from '../constants';
import {
  DEFAULT_ENABLED_STYLES,
  STYLE_CATALOG,
  STYLE_CATEGORIES,
  getStyleCategory,
} from '../utils/styleCategories';
import styles from '../styles';

function resolveStyleCategory(style) {
  return style?.categoryId || getStyleCategory(style?.id);
}

function getCategoryPreviewStyle(categoryId, styleList) {
  const enabled = styleList.find((s) => resolveStyleCategory(s) === categoryId);
  if (enabled) return enabled;
  return STYLE_CATALOG.find((s) => s.categoryId === categoryId) || null;
}

const BROWSE_CATEGORIES = STYLE_CATEGORIES.filter((cat) => cat.id !== 'all');

/** Alternate: full-width row, then two half-width cards */
function getCategoryTileLayout(index) {
  return index % 3 === 0 ? 'wide' : 'compact';
}

export default function StyleScreen({
  selectedStyle,
  availableStyles,
  onNext,
  onOpenMenu,
  restyleMode = false,
  onCancelRestyle,
}) {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(null);
  const styleList = Array.isArray(availableStyles) && availableStyles.length > 0
    ? availableStyles
    : DEFAULT_ENABLED_STYLES;

  const browsingCategories = !restyleMode && activeCategory === null;
  const activeCategoryMeta = BROWSE_CATEGORIES.find((cat) => cat.id === activeCategory);

  const categoryStyles = useMemo(() => {
    if (browsingCategories) return [];
    if (restyleMode) return styleList;
    return styleList.filter((s) => resolveStyleCategory(s) === activeCategory);
  }, [activeCategory, browsingCategories, restyleMode, styleList]);

  useEffect(() => {
    if (browsingCategories || restyleMode) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveCategory(null);
      return true;
    });
    return () => sub.remove();
  }, [browsingCategories, restyleMode]);

  const handleCancel = () => {
    if (onCancelRestyle) onCancelRestyle();
  };

  const handleBack = () => {
    if (restyleMode) {
      handleCancel();
      return;
    }
    setActiveCategory(null);
  };

  return (
    <SafeAreaView style={styles.styleScreenSafe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ height: insets.top, backgroundColor: '#FFFFFF' }} />

      <View style={styles.styleScreenHeader}>
        <View style={styles.headerBar}>
          {browsingCategories ? (
            <>
              <Text style={styles.wordmark}>FunnyFy</Text>
              <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton}>
                <Feather name="menu" size={20} color="#0F172A" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                <Text style={styles.iconButtonIcon}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.restyleHeaderTitle} numberOfLines={1}>
                {restyleMode ? 'Same photo' : activeCategoryMeta?.label || 'Styles'}
              </Text>
              <View style={{ width: 36 }} />
            </>
          )}
        </View>
      </View>

      {restyleMode ? (
        <View style={styles.restyleBanner}>
          <View style={styles.restyleBannerRow}>
            <View style={styles.restyleBannerBody}>
              <Text style={styles.restyleBannerText}>
                Pick a new style to regenerate with your last photo
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.restyleBannerCancel}
            activeOpacity={0.85}
          >
            <Text style={styles.restyleBannerCancelText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.styleContainer,
          { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
        ]}
        style={styles.styleScroll}
        showsVerticalScrollIndicator={false}
      >
        {browsingCategories ? (
          <View style={styles.discoveryGrid}>
            {BROWSE_CATEGORIES.map((cat, index) => {
              const layout = getCategoryTileLayout(index);
              const isWide = layout === 'wide';
              const previewStyle = getCategoryPreviewStyle(cat.id, styleList);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={isWide ? styles.discoveryCardWide : styles.discoveryCard}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.92}
                >
                  <MediaTile
                    imageSource={getStyleImage(previewStyle)}
                    label={cat.label}
                    variant={isWide ? 'discoveryWide' : 'discovery'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <>
            {categoryStyles.length === 0 ? (
              <View style={styles.styleEmptyState}>
                <Text style={styles.styleEmptyStateTitle}>Coming soon</Text>
                <Text style={styles.styleEmptyStateText}>
                  New styles for this category are on the way.
                </Text>
              </View>
            ) : (
              <View style={styles.discoveryGrid}>
                {categoryStyles.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.discoveryCard}
                    activeOpacity={0.92}
                    onPress={() => onNext(s)}
                  >
                    <MediaTile
                      imageSource={getStyleImage(s)}
                      label={s.label}
                      isSelected={selectedStyle?.id === s.id}
                      variant="discovery"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
