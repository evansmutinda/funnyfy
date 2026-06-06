import React from 'react';
import { TouchableOpacity, View, Image, Text } from 'react-native';
import styles from '../styles';

// Static preview assets mapping
const STYLE_CARD_IMAGE_DEFAULT = require('../assets/toon.jpg');
const STYLE_CARD_IMAGE_CHIBI = require('../assets/chibi.jpg');
const STYLE_CARD_IMAGE_NEON = require('../assets/neon.png');
const STYLE_CARD_IMAGE_ANIME = require('../assets/anime.jpg');
const STYLE_CARD_IMAGE_CUSTOM1 = require('../assets/custom1.jpg');
const STYLE_CARD_IMAGE_CUSTOM2 = require('../assets/custom2.jpg');
const STYLE_CARD_IMAGE_NEANDC = require('../assets/neandc.jpeg');
const STYLE_CARD_IMAGE_NEAND3D = require('../assets/neand3d.jpeg');
const STYLE_CARD_IMAGE_HANDD = require('../assets/handd.jpeg');
const STYLE_CARD_IMAGE_SUPERHERO = require('../assets/superhero.jpeg');
const STYLE_CARD_IMAGE_VILLIAN = require('../assets/villian.jpeg');
const STYLE_CARD_IMAGE_CYBORG = require('../assets/cyborg.jpeg');
const STYLE_CARD_IMAGE_3DCLAY = require('../assets/3dclay.jpg');
const STYLE_CARD_IMAGE_OILPAINT = require('../assets/oilpaint.jpg');
const STYLE_CARD_IMAGE_LOWPOLY = require('../assets/lowpoly.jpg');
const STYLE_CARD_IMAGE_WC = require('../assets/wc.jpg');
const STYLE_CARD_IMAGE_PXL = require('../assets/pxl.jpg');
const STYLE_CARD_IMAGE_FUNKO = require('../assets/funko.jpg');

export function getStyleImage(style) {
  if (!style) return STYLE_CARD_IMAGE_DEFAULT;
  const label = (style.label || '').toLowerCase();
  const id = (style.id || '').toLowerCase();

  if (id === 'chibi' || label.includes('chibi')) return STYLE_CARD_IMAGE_CHIBI;
  if (id === 'neon' || label.includes('neon')) return STYLE_CARD_IMAGE_NEON;
  if (id === 'anime' || label.includes('anime')) return STYLE_CARD_IMAGE_ANIME;
  if (id === 'custom1' || label.includes('custom1')) return STYLE_CARD_IMAGE_CUSTOM1;
  if (id === 'custom2' || label.includes('custom2')) return STYLE_CARD_IMAGE_CUSTOM2;
  if (id === 'neandc' || (label.includes('neanderthal') && !label.includes('3d'))) return STYLE_CARD_IMAGE_NEANDC;
  if (id === 'neand3d' || label.includes('neanderthal 3d') || label.includes('neand3d')) return STYLE_CARD_IMAGE_NEAND3D;
  if (id === 'handd' || label.includes('hand-drawn') || label.includes('handd')) return STYLE_CARD_IMAGE_HANDD;
  if (id === 'superhero' || label.includes('superhero')) return STYLE_CARD_IMAGE_SUPERHERO;
  if (id === 'villian' || label.includes('villain') || label.includes('villian')) return STYLE_CARD_IMAGE_VILLIAN;
  if (id === 'cyborg' || label.includes('cyborg')) return STYLE_CARD_IMAGE_CYBORG;
  if (id === '3dclay' || label.includes('3dclay') || label.includes('3d clay')) return STYLE_CARD_IMAGE_3DCLAY;
  if (id === 'oil-paint' || label.includes('oil paint') || label.includes('oilpaint')) return STYLE_CARD_IMAGE_OILPAINT;
  if (id === 'low-poly' || label.includes('low-poly') || label.includes('lowpoly')) return STYLE_CARD_IMAGE_LOWPOLY;
  if (id === 'water-color' || label.includes('water color') || label.includes('watercolor')) return STYLE_CARD_IMAGE_WC;
  if (id === 'pixar-like' || label.includes('pixar-like') || label.includes('pixar')) return STYLE_CARD_IMAGE_PXL;
  if (id === 'funko-pop' || label.includes('funko pop') || label.includes('funko')) return STYLE_CARD_IMAGE_FUNKO;

  return STYLE_CARD_IMAGE_DEFAULT;
}

export default function StyleCard({ style, isSelected, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.styleCard,
        isSelected && styles.styleCardSelected
      ]}
      activeOpacity={0.9}
      onPress={() => onPress(style)}
    >
      <View style={styles.styleImageWrapper}>
        <Image source={getStyleImage(style)} style={styles.styleImage} />
      </View>
      <View style={styles.styleCardLabel}>
        <Text style={styles.styleCardName} numberOfLines={1}>
          {style.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
