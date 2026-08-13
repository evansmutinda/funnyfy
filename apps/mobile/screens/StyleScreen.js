import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
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
  getTileComparisonPair,
  hasCuratedComparisonPair,
  usesComparisonPreview,
} from '../data/comparisonPairs';
import {
  STYLE_CATEGORIES,
  getStyleCategory,
} from '../utils/styleCategories';
import {
  canBuildStickerPack,
  isStickerStyle,
} from '../utils/stickerPack';
import { RowFocusProvider, useCategoryRowFocus } from '../hooks/useRowFocus';
import StyleLoadingEmptyState from '../components/StyleLoadingEmptyState';
import styles from '../styles';

const HORIZONTAL_VIEWABILITY = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 0,
};

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
  stylesLoading = false,
  onNext,
  onOpenMenu,
  restyleMode = false,
  onCancelRestyle,
  interactionPaused = false,
  initialActiveCategory = null,
  selectedStickerIds = [],
  onToggleSticker,
  onCreateStickerPack,
  onClearStickerPack,
}) {
  const insets = useSafeAreaInsets();
  const [homeScrollTick, setHomeScrollTick] = useState(0);
  const [categoryScrollTick, setCategoryScrollTick] = useState(0);
  const [activeCategory, setActiveCategory] = useState(initialActiveCategory);
  const [packSelectMode, setPackSelectMode] = useState(
    Array.isArray(selectedStickerIds) && selectedStickerIds.length > 0,
  );
  const styleList = Array.isArray(availableStyles) ? availableStyles : [];

  useEffect(() => {
    setActiveCategory(initialActiveCategory);
  }, [initialActiveCategory]);

  const browsingHome = activeCategory === null;
  const activeCategoryMeta = BROWSE_CATEGORIES.find((cat) => cat.id === activeCategory);
  const selectedStickerCount = Array.isArray(selectedStickerIds) ? selectedStickerIds.length : 0;
  const inStickerPackMode = packSelectMode && activeCategory === 'stickers';
  const stickerPackReady = canBuildStickerPack(selectedStickerCount);
  const selectedStickerStyles = useMemo(() => {
    if (!inStickerPackMode || !selectedStickerCount) return [];
    const byId = new Map(styleList.map((item) => [item.id, item]));
    return selectedStickerIds.map((id) => byId.get(id)).filter(Boolean);
  }, [inStickerPackMode, selectedStickerCount, selectedStickerIds, styleList]);

  const exitPackSelectMode = () => {
    setPackSelectMode(false);
    if (onClearStickerPack) onClearStickerPack();
  };

  const handleStylePress = (item) => {
    if (packSelectMode && isStickerStyle(item) && onToggleSticker) {
      onToggleSticker(item);
      return;
    }
    onNext(item);
  };

  useEffect(() => {
    if (restyleMode) setActiveCategory(null);
  }, [restyleMode]);

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
    return styleList.filter((s) => resolveStyleCategory(s) === activeCategory);
  }, [activeCategory, browsingHome, styleList]);

  const onCategoryScroll = useCallback(() => {
    setCategoryScrollTick((tick) => tick + 1);
  }, []);

  const onCategoryScrollEnd = useCallback(() => {
    setCategoryScrollTick((tick) => tick + 1);
  }, []);

  const onHomeScroll = useCallback(() => {
    setHomeScrollTick((tick) => tick + 1);
  }, []);

  const categoryGridRows = useMemo(
    () => chunkStyles(categoryStyles),
    [categoryStyles],
  );

  const categoryGridKey = activeCategory || 'category';

  useEffect(() => {
    if (browsingHome) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (packSelectMode) {
        exitPackSelectMode();
        return true;
      }
      setActiveCategory(null);
      return true;
    });
    return () => sub.remove();
  }, [browsingHome, packSelectMode]);

  const handleCancel = () => {
    if (onCancelRestyle) onCancelRestyle();
  };

  const handleBack = () => {
    if (packSelectMode) {
      exitPackSelectMode();
      return;
    }
    if (!browsingHome) {
      setActiveCategory(null);
      return;
    }
    if (restyleMode) handleCancel();
  };

  return (
    <View
      style={styles.styleScreenSafe}
      pointerEvents={interactionPaused ? 'none' : 'auto'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={[styles.styleScreenHeader, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerBar}>
          {browsingHome && !restyleMode ? (
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
                {browsingHome && restyleMode
                  ? 'Same photo'
                  : inStickerPackMode && activeCategory === 'stickers'
                    ? 'Sticker pack'
                    : activeCategoryMeta?.label || 'Styles'}
              </Text>
              <View style={{ width: 40 }} />
            </>
          )}
        </View>
      </View>

      {restyleMode && browsingHome ? (
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
        <RowFocusProvider scrollTick={homeScrollTick} enabled={!interactionPaused}>
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
              stylesLoading && styleList.length === 0 ? (
                <StyleLoadingEmptyState />
              ) : (
                <View style={styles.styleEmptyState}>
                  <Text style={styles.styleEmptyStateTitle}>Coming soon</Text>
                  <Text style={styles.styleEmptyStateText}>
                    New styles are on the way. Pull down to refresh in a moment.
                  </Text>
                </View>
              )
            ) : (
              categoryRows.map((row, rowIndex) => (
                <CategoryRow
                  key={row.id}
                  category={row}
                  styleList={row.styles}
                  selectedStyle={selectedStyle}
                  onSelect={handleStylePress}
                  onSeeAll={() => setActiveCategory(row.id)}
                  rowIndex={rowIndex}
                  interactionPaused={interactionPaused}
                  stickerPackMode={inStickerPackMode}
                  selectedStickerIds={selectedStickerIds}
                />
              ))
            )}
          </ScrollView>
        </RowFocusProvider>
      ) : (
        <RowFocusProvider key={categoryGridKey} scrollTick={categoryScrollTick} enabled={!interactionPaused}>
          <ScrollView
            style={styles.styleScroll}
            contentContainerStyle={[
              styles.styleContainer,
              {
                paddingBottom:
                  Math.max(insets.bottom, BOTTOM_INSET_MIN) +
                  (activeCategory === 'stickers'
                    ? packSelectMode && selectedStickerCount > 0
                      ? 176
                      : 108
                    : 8),
              },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={onCategoryScroll}
            onScrollEndDrag={onCategoryScrollEnd}
            onMomentumScrollEnd={onCategoryScrollEnd}
            scrollEventThrottle={200}
          >
            {categoryStyles.length === 0 ? (
              stylesLoading && styleList.length === 0 ? (
                <StyleLoadingEmptyState />
              ) : (
                <View style={styles.styleEmptyState}>
                  <Text style={styles.styleEmptyStateTitle}>Coming soon</Text>
                  <Text style={styles.styleEmptyStateText}>
                    New styles for this category are on the way.
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.discoveryGrid}>
                {categoryGridRows.map((rowStyles, rowIndex) => (
                  <DiscoveryGridRow
                    key={`${categoryGridKey}-${rowIndex}`}
                    rowId={`${categoryGridKey}-${rowIndex}`}
                    rowIndex={rowIndex}
                    styleList={rowStyles}
                    selectedStyle={selectedStyle}
                    onSelect={handleStylePress}
                    interactionPaused={interactionPaused}
                    stickerPackMode={inStickerPackMode}
                    selectedStickerIds={selectedStickerIds}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </RowFocusProvider>
      )}

      {activeCategory === 'stickers' ? (
        <View style={[styles.stickerPackBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {packSelectMode ? (
            <>
              {selectedStickerStyles.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stickerSelectedStrip}
                >
                  {selectedStickerStyles.map((item) => (
                    <PressScale
                      key={item.id}
                      onPress={() => onToggleSticker(item)}
                      style={styles.stickerSelectedChip}
                    >
                      <Image
                        source={getStyleImage(item)}
                        style={styles.stickerSelectedChipImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.stickerSelectedChipLabel} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Feather name="x" size={12} color="rgba(255,255,255,0.7)" />
                    </PressScale>
                  ))}
                </ScrollView>
              ) : null}
              <Text style={styles.stickerPackBarText}>
                {selectedStickerCount === 0
                  ? 'Select 4 or 9 expressions'
                  : `${selectedStickerCount} selected · pick 4 or 9`}
              </Text>
              <View style={styles.stickerPackBarActions}>
                <PressScale onPress={exitPackSelectMode} style={[styles.stickerPackBarGhost, { flex: 1 }]}>
                  <Text style={styles.stickerPackBarGhostText}>Cancel</Text>
                </PressScale>
                <PressScale
                  onPress={onCreateStickerPack}
                  style={[
                    styles.stickerPackBarButton,
                    { flex: 1.4 },
                    !stickerPackReady && styles.buttonDisabled,
                  ]}
                  disabled={!stickerPackReady}
                >
                  <Feather name="layers" size={16} color="#0F172A" />
                  <Text style={styles.stickerPackBarButtonText}>Create pack</Text>
                </PressScale>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.stickerPackBarText}>
                Tap a style to generate one sticker, or make a pack
              </Text>
              <PressScale
                onPress={() => setPackSelectMode(true)}
                style={styles.stickerPackBarButton}
              >
                <Feather name="layers" size={16} color="#0F172A" />
                <Text style={styles.stickerPackBarButtonText}>Create pack</Text>
              </PressScale>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function StylePickerTile({
  item,
  selectedStyle,
  onSelect,
  comparisonActive,
  interactionPaused,
  stickerPackMode = false,
  selectedStickerIds = [],
}) {
  const hasPair = usesComparisonPreview(item) && hasCuratedComparisonPair(item);
  const isSelected = stickerPackMode
    ? selectedStickerIds.includes(item.id)
    : selectedStyle?.id === item.id;
  return (
    <PressScale
      onPress={() => onSelect(item)}
      style={styles.styleRowCard}
    >
      <MediaTile
        imageSource={getStyleImage(item)}
        comparisonPair={hasPair ? getTileComparisonPair(item) : null}
        label={item.label}
        isSelected={isSelected}
        selectionMode={stickerPackMode}
        variant="discoveryRow"
        comparisonActive={comparisonActive}
        interactionPaused={interactionPaused}
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
  interactionPaused,
  stickerPackMode = false,
  selectedStickerIds = [],
}) {
  const { rowRef, isRowActive, onRowLayout } = useCategoryRowFocus(rowId, rowIndex);

  return (
    <View ref={rowRef} onLayout={onRowLayout} style={styles.discoveryGridRow}>
      {styleList.map((item) => {
        const hasPair = usesComparisonPreview(item) && hasCuratedComparisonPair(item);
        const isSelected = stickerPackMode
          ? selectedStickerIds.includes(item.id)
          : selectedStyle?.id === item.id;
        return (
          <View key={item.id} style={styles.discoveryCard}>
            <PressScale onPress={() => onSelect(item)} style={styles.styleCardOuter}>
              <MediaTile
                imageSource={getStyleImage(item)}
                comparisonPair={hasPair ? getTileComparisonPair(item) : null}
                label={item.label}
                isSelected={isSelected}
                selectionMode={stickerPackMode}
                variant="discovery"
                comparisonActive={isRowActive}
                interactionPaused={interactionPaused}
              />
            </PressScale>
          </View>
        );
      })}
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
  interactionPaused = false,
  stickerPackMode = false,
  selectedStickerIds = [],
}) {
  const hasOverflow = styleList.length > ROW_PREVIEW_COUNT;
  const visibleStyles = hasOverflow ? styleList.slice(0, ROW_PREVIEW_COUNT) : styleList;
  const showSeeAll = styleList.length > 0;
  const { rowRef, isRowActive, onRowLayout } = useCategoryRowFocus(category.id, rowIndex);
  const [viewableIds, setViewableIds] = useState(null);

  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    setViewableIds(new Set(viewableItems.map((token) => token.item.id)));
  });

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: HORIZONTAL_VIEWABILITY,
      onViewableItemsChanged: (info) => onViewableItemsChangedRef.current(info),
    },
  ]).current;

  const isTileActive = (styleId, index) => {
    if (!isRowActive) return false;
    if (!usesComparisonPreview({ id: styleId, categoryId: getStyleCategory(styleId) })) {
      return false;
    }
    if (!hasCuratedComparisonPair({ id: styleId })) return false;
    if (!viewableIds) return index < 3;
    return viewableIds.has(styleId);
  };

  const listExtraData = `${isRowActive}:${viewableIds ? [...viewableIds].join(',') : 'pending'}`;

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
          extraData={listExtraData}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.styleRowList}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={false}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          renderItem={({ item, index }) => (
            <StylePickerTileMemo
              item={item}
              selectedStyle={selectedStyle}
              onSelect={onSelect}
              comparisonActive={isTileActive(item.id, index)}
              interactionPaused={interactionPaused}
              stickerPackMode={stickerPackMode}
              selectedStickerIds={selectedStickerIds}
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
