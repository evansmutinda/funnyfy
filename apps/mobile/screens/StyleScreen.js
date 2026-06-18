import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MediaTile from '../components/MediaTile';
import { BOTTOM_INSET_MIN, STYLE_90S_CARTOON, getStyleImage } from '../constants';
import {
  STYLE_CATEGORIES,
  getStyleCategory,
  pickHeroStyle,
} from '../utils/styleCategories';
import styles from '../styles';

export default function StyleScreen({
  selectedStyle,
  availableStyles,
  onNext,
  onOpenMenu,
  restyleMode = false,
  onCancelRestyle,
}) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('all');
  const styleList = Array.isArray(availableStyles) && availableStyles.length > 0
    ? availableStyles
    : [STYLE_90S_CARTOON];

  const heroStyle = useMemo(() => pickHeroStyle(styleList), [styleList]);

  const filteredStyles = useMemo(() => {
    let list = styleList;
    if (category !== 'all') {
      list = list.filter((s) => getStyleCategory(s.id) === category);
    }
    if (category === 'all' && heroStyle) {
      list = list.filter((s) => s.id !== heroStyle.id);
    }
    return list;
  }, [styleList, category, heroStyle]);

  const showHero = category === 'all' && heroStyle && !restyleMode;

  const handleCancel = () => {
    if (onCancelRestyle) onCancelRestyle();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={{ height: insets.top, backgroundColor: '#F3F4F6' }} />

      <View style={styles.styleScreenHeader}>
        <View style={styles.headerBar}>
          {restyleMode ? (
            <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
              <Text style={styles.iconButtonIcon}>‹</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.wordmark}>FunnyFy</Text>
          )}
          {restyleMode ? (
            <Text style={styles.restyleHeaderTitle} numberOfLines={1}>
              Same photo
            </Text>
          ) : null}
          {restyleMode ? (
            <View style={{ width: 36 }} />
          ) : (
            <TouchableOpacity onPress={onOpenMenu} style={styles.iconButton}>
              <Text style={styles.iconButtonIcon}>☰</Text>
            </TouchableOpacity>
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
        contentContainerStyle={styles.styleContainer}
        style={styles.styleScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.styleCategoryRow}>
          {STYLE_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.styleCategoryChip, active && styles.styleCategoryChipActive]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.styleCategoryChipText,
                    active && styles.styleCategoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showHero ? (
          <TouchableOpacity
            style={styles.styleHeroCard}
            activeOpacity={0.92}
            onPress={() => onNext(heroStyle)}
          >
            <MediaTile
              imageSource={getStyleImage(heroStyle)}
              label={heroStyle.label}
              isSelected={selectedStyle?.id === heroStyle.id}
              variant="hero"
              badge="Popular"
            />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.styleGrid, { paddingBottom: Math.max(insets.bottom, BOTTOM_INSET_MIN) }]}>
          {filteredStyles.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.card, styles.styleCard]}
              activeOpacity={0.92}
              onPress={() => onNext(s)}
            >
              <MediaTile
                imageSource={getStyleImage(s)}
                label={s.label}
                isSelected={selectedStyle?.id === s.id}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
