import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MediaTile from '../components/MediaTile';
import PressScale from '../components/PressScale';
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

// Tiles to render before the "See all" affordance kicks in.
const ROW_PREVIEW_COUNT = 8;
// Staggered entrance delay (ms) per row.
const ROW_ENTRANCE_STAGGER = 60;

const BROWSE_CATEGORIES = STYLE_CATEGORIES.filter((cat) => cat.id !== 'all');

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
  const styleList =
    Array.isArray(availableStyles) && availableStyles.length > 0
      ? availableStyles
      : DEFAULT_ENABLED_STYLES;

  const browsingHome = !restyleMode && activeCategory === null;
  const activeCategoryMeta = BROWSE_CATEGORIES.find((cat) => cat.id === activeCategory);

  // Group enabled styles by category, in the catalog's declared order.
  // Categories with zero enabled styles are hidden (cleaner UX while the
  // catalog is being filled — they reappear as styles get enabled).
  const categoryRows = useMemo(() => {
    if (!browsingHome) return [];
    const byCategory = new Map();
    for (const style of styleList) {
      const catId = resolveStyleCategory(style);
      if (!catId) continue;
      if (!byCategory.has(catId)) byCategory.set(catId, []);
      byCategory.get(catId).push(style);
    }
    return BROWSE_CATEGORIES
      .map((cat) => ({ ...cat, styles: byCategory.get(cat.id) || [] }))
      .filter((row) => row.styles.length > 0);
  }, [browsingHome, styleList]);

  const categoryStyles = useMemo(() => {
    if (browsingHome) return [];
    if (restyleMode) return styleList;
    return styleList.filter((s) => resolveStyleCategory(s) === activeCategory);
  }, [activeCategory, browsingHome, restyleMode, styleList]);

  useEffect(() => {
    if (browsingHome || restyleMode) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveCategory(null);
      return true;
    });
    return () => sub.remove();
  }, [browsingHome, restyleMode]);

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
    <View style={styles.styleScreenSafe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={[styles.styleScreenHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerBar}>
          {browsingHome ? (
            <>
              <Text style={styles.wordmark}>FunnyFy</Text>
              <PressScale onPress={onOpenMenu} style={styles.menuButton} hitSlop={8}>
                <Feather name="menu" size={22} color="#FFFFFF" />
              </PressScale>
            </>
          ) : (
            <>
              <PressScale onPress={handleBack} style={styles.iconButton}>
                <Feather name="chevron-left" size={22} color="#FFFFFF" />
              </PressScale>
              <Text style={styles.restyleHeaderTitle} numberOfLines={1}>
                {restyleMode ? 'Same photo' : activeCategoryMeta?.label || 'Styles'}
              </Text>
              <View style={{ width: 40 }} />
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
          <PressScale
            onPress={handleCancel}
            style={styles.restyleBannerCancel}
          >
            <Text style={styles.restyleBannerCancelText}>Back to home</Text>
          </PressScale>
        </View>
      ) : null}

      {browsingHome ? (
        <ScrollView
          style={styles.styleScroll}
          contentContainerStyle={[
            styles.styleHomeContainer,
            { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {categoryRows.length === 0 ? (
            <View style={styles.styleEmptyState}>
              <Text style={styles.styleEmptyStateTitle}>Coming soon</Text>
              <Text style={styles.styleEmptyStateText}>
                We're loading styles. Pull down to refresh in a moment.
              </Text>
            </View>
          ) : (
            categoryRows.map((row, rowIndex) => (
              <CategoryRow
                key={row.id}
                category={row}
                styleList={row.styles}
                selectedStyle={selectedStyle}
                onSelect={onNext}
                onSeeAll={() => setActiveCategory(row.id)}
                rowIndex={rowIndex}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.styleScroll}
          contentContainerStyle={[
            styles.styleContainer,
            { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {categoryStyles.length === 0 ? (
            <View style={styles.styleEmptyState}>
              <Text style={styles.styleEmptyStateTitle}>Coming soon</Text>
              <Text style={styles.styleEmptyStateText}>
                New styles for this category are on the way.
              </Text>
            </View>
          ) : (
            <View style={styles.discoveryGrid}>
              {categoryStyles.map((s, index) => (
                <Animated.View
                  key={s.id}
                  entering={FadeInDown.delay(index * 35).duration(280)}
                  style={styles.discoveryCard}
                >
                  <PressScale onPress={() => onNext(s)}>
                    <MediaTile
                      imageSource={getStyleImage(s)}
                      label={s.label}
                      isSelected={selectedStyle?.id === s.id}
                      variant="discovery"
                    />
                  </PressScale>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function CategoryRow({ category, styleList, selectedStyle, onSelect, onSeeAll, rowIndex }) {
  const hasOverflow = styleList.length > ROW_PREVIEW_COUNT;
  const visibleStyles = hasOverflow ? styleList.slice(0, ROW_PREVIEW_COUNT) : styleList;

  return (
    <Animated.View
      entering={FadeInDown.delay(rowIndex * ROW_ENTRANCE_STAGGER).duration(320)}
      style={styles.styleRowSection}
    >
      <View style={styles.styleRowHeader}>
        <Text style={styles.styleRowTitle}>{category.label}</Text>
        {hasOverflow ? (
          <PressScale onPress={onSeeAll} hitSlop={8}>
            <View style={styles.styleRowSeeAll}>
              <Text style={styles.styleRowSeeAllText}>See all</Text>
              <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.65)" />
            </View>
          </PressScale>
        ) : null}
      </View>

      <FlatList
        data={visibleStyles}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.styleRowList}
        renderItem={({ item }) => (
          <PressScale
            onPress={() => onSelect(item)}
            style={styles.styleRowCard}
          >
            <MediaTile
              imageSource={getStyleImage(item)}
              label={item.label}
              isSelected={selectedStyle?.id === item.id}
              variant="discovery"
            />
          </PressScale>
        )}
        ListFooterComponent={
          hasOverflow ? (
            <PressScale onPress={onSeeAll} style={styles.styleRowSeeAllTile}>
              <View style={styles.styleRowSeeAllTileImage}>
                <View style={styles.styleRowSeeAllTileInner}>
                  <Feather name="grid" size={22} color="#FFFFFF" />
                  <Text style={styles.styleRowSeeAllTileText}>See all</Text>
                  <Text style={styles.styleRowSeeAllTileCount}>
                    {styleList.length} styles
                  </Text>
                </View>
              </View>
              <View style={styles.styleRowSeeAllCaptionSpacer} />
            </PressScale>
          ) : null
        }
      />
    </Animated.View>
  );
}

// Suppress unused-import warning while keeping the path available for
// future "show coming soon rows" toggling.
void STYLE_CATALOG;
