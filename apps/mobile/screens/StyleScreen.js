import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
  STYLE_CATEGORIES,
  getStyleCategory,
} from '../utils/styleCategories';
import { RowFocusProvider, useCategoryRowFocus } from '../hooks/useRowFocus';
import styles from '../styles';

function resolveStyleCategory(style) {
  return style?.categoryId || getStyleCategory(style?.id);
}

const ROW_PREVIEW_COUNT = 5;
const ROW_ENTRANCE_STAGGER = 40;
const GRID_COLUMNS = 2;
const MAX_ENTRANCE_ROWS = 4;

const BROWSE_CATEGORIES = STYLE_CATEGORIES.filter((cat) => cat.id !== 'all');

function chunkStyles(styles, columns = GRID_COLUMNS) {
  const rows = [];
  for (let i = 0; i < styles.length; i += columns) {
    rows.push(styles.slice(i, i + columns));
  }
  return rows;
}

export default function StyleScreen(props) {
  return <StyleScreenContent {...props} />;
}

function StyleScreenContent({
  selectedStyle,
  availableStyles,
  onNext,
  onOpenMenu,
  restyleMode = false,
  onCancelRestyle,
  initialActiveCategory = null,
}) {
  const insets = useSafeAreaInsets();
  const [homeScrollTick, setHomeScrollTick] = useState(0);
  const [categoryScrollTick, setCategoryScrollTick] = useState(0);
  const [activeCategory, setActiveCategory] = useState(initialActiveCategory);
  const styleList = Array.isArray(availableStyles) ? availableStyles : [];

  useEffect(() => {
    setActiveCategory(initialActiveCategory);
  }, [initialActiveCategory]);

  const browsingHome = !restyleMode && activeCategory === null;
  const activeCategoryMeta = BROWSE_CATEGORIES.find((cat) => cat.id === activeCategory);

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

  const onCategoryScroll = useCallback(() => {
    setCategoryScrollTick((tick) => tick + 1);
  }, []);

  const onHomeScroll = useCallback(() => {
    setHomeScrollTick((tick) => tick + 1);
  }, []);

  const categoryGridRows = useMemo(
    () => chunkStyles(categoryStyles),
    [categoryStyles],
  );

  const categoryGridKey = restyleMode ? 'restyle' : activeCategory || 'category';

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
        <RowFocusProvider scrollTick={homeScrollTick}>
          <ScrollView
            style={styles.styleScroll}
            contentContainerStyle={[
              styles.styleHomeContainer,
              { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={onHomeScroll}
            scrollEventThrottle={200}
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
        </RowFocusProvider>
      ) : (
        <RowFocusProvider key={categoryGridKey} scrollTick={categoryScrollTick}>
          <ScrollView
            style={styles.styleScroll}
            contentContainerStyle={[
              styles.styleContainer,
              { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) + 8 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={onCategoryScroll}
            scrollEventThrottle={200}
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
                {categoryGridRows.map((rowStyles, rowIndex) => (
                  <DiscoveryGridRow
                    key={`${categoryGridKey}-${rowIndex}`}
                    rowId={`${categoryGridKey}-${rowIndex}`}
                    rowIndex={rowIndex}
                    styleList={rowStyles}
                    selectedStyle={selectedStyle}
                    onSelect={onNext}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </RowFocusProvider>
      )}
    </View>
  );
}

function StylePickerTile({
  item,
  selectedStyle,
  onSelect,
}) {
  return (
    <PressScale
      onPress={() => onSelect(item)}
      style={styles.styleRowCard}
    >
      <MediaTile
        imageSource={getStyleImage(item)}
        isSelected={selectedStyle?.id === item.id}
        variant="grid"
        comparisonActive={false}
      />
    </PressScale>
  );
}

const StylePickerTileMemo = memo(StylePickerTile);

function DiscoveryGridRow({
  rowId,
  rowIndex,
  styleList,
  selectedStyle,
  onSelect,
}) {
  const { rowRef, onRowLayout } = useCategoryRowFocus(rowId, rowIndex);

  return (
    <View ref={rowRef} onLayout={onRowLayout} style={styles.discoveryGridRow}>
      {styleList.map((item) => (
        <View key={item.id} style={styles.discoveryCard}>
          <PressScale onPress={() => onSelect(item)} style={styles.styleCardOuter}>
            <MediaTile
              imageSource={getStyleImage(item)}
              isSelected={selectedStyle?.id === item.id}
              variant="grid"
              comparisonActive={false}
            />
          </PressScale>
        </View>
      ))}
    </View>
  );
}

function CategoryRow({
  category,
  styleList,
  selectedStyle,
  onSelect,
  onSeeAll,
  rowIndex,
}) {
  const hasOverflow = styleList.length > ROW_PREVIEW_COUNT;
  const visibleStyles = hasOverflow ? styleList.slice(0, ROW_PREVIEW_COUNT) : styleList;
  const showSeeAll = styleList.length > 0;
  const { rowRef, onRowLayout } = useCategoryRowFocus(category.id, rowIndex);

  return (
    <View ref={rowRef} onLayout={onRowLayout}>
      <Animated.View
        entering={
          rowIndex < MAX_ENTRANCE_ROWS
            ? FadeInDown.delay(rowIndex * ROW_ENTRANCE_STAGGER).duration(260)
            : undefined
        }
        style={styles.styleRowSection}
      >
        <View style={styles.styleRowHeader}>
          <Text style={styles.styleRowTitle}>{category.label}</Text>
          {showSeeAll ? (
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
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={false}
          renderItem={({ item }) => (
            <StylePickerTileMemo
              item={item}
              selectedStyle={selectedStyle}
              onSelect={onSelect}
            />
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
              </PressScale>
            ) : null
          }
        />
      </Animated.View>
    </View>
  );
}
