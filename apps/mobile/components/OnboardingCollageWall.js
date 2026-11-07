import React, { useEffect, useMemo, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

/** Fewer, larger tiles — curated wall, not infinite feed. */
const COLS = 3;
const CARD_GAP = 10;
const SIDE_PAD = 14;
const AUTO_SCROLL_PX = 0.22;
const AUTO_SCROLL_RESUME_MS = 2400;
/** Let the finale land before motion starts. */
const HOLD_BEFORE_SCROLL_MS = 1600;

/**
 * Upright style wall used as finale scenery.
 * Holds still first, then soft-scrolls and reverses at each end
 * (no jump-to-top blank flash).
 */
export default function OnboardingCollageWall({ images = [] }) {
  const { width: screenW } = useWindowDimensions();
  const scrollRef = useRef(null);
  const offsetY = useRef(0);
  const contentH = useRef(0);
  const viewH = useRef(0);
  const pausedUntil = useRef(Date.now() + HOLD_BEFORE_SCROLL_MS);
  const dragging = useRef(false);
  const direction = useRef(1);

  const wallWidth = screenW - SIDE_PAD * 2;
  const cardWidth = Math.max(
    96,
    Math.floor((wallWidth - CARD_GAP * (COLS - 1)) / COLS),
  );
  const cardHeight = Math.round(cardWidth * 1.35);

  const columns = useMemo(() => {
    const cols = Array.from({ length: COLS }, () => []);
    images.forEach((source, i) => {
      if (source) cols[i % COLS].push(source);
    });
    return cols;
  }, [images]);

  const scrollToY = (y) => {
    offsetY.current = y;
    scrollRef.current?.scrollTo({ y, animated: false });
  };

  useEffect(() => {
    pausedUntil.current = Date.now() + HOLD_BEFORE_SCROLL_MS;
    direction.current = 1;
    let frameId = null;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      frameId = requestAnimationFrame(tick);

      if (dragging.current || Date.now() < pausedUntil.current) return;
      const maxY = Math.max(0, contentH.current - viewH.current);
      if (maxY < 48 || !scrollRef.current) return;

      let next = offsetY.current + AUTO_SCROLL_PX * direction.current;
      if (next >= maxY) {
        next = maxY;
        direction.current = -1;
      } else if (next <= 0) {
        next = 0;
        direction.current = 1;
      }
      scrollToY(next);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, []);

  if (!images.length) {
    return <View style={styles.root} />;
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
      onLayout={(e) => {
        viewH.current = e.nativeEvent.layout.height;
      }}
      onContentSizeChange={(_w, h) => {
        contentH.current = h;
      }}
      onScrollBeginDrag={() => {
        dragging.current = true;
      }}
      onScrollEndDrag={(e) => {
        dragging.current = false;
        offsetY.current = e.nativeEvent.contentOffset.y;
        pausedUntil.current = Date.now() + AUTO_SCROLL_RESUME_MS;
      }}
      onMomentumScrollEnd={(e) => {
        offsetY.current = e.nativeEvent.contentOffset.y;
        pausedUntil.current = Date.now() + AUTO_SCROLL_RESUME_MS;
      }}
      onScroll={(e) => {
        if (dragging.current) {
          offsetY.current = e.nativeEvent.contentOffset.y;
        }
      }}
      scrollEventThrottle={16}
    >
      <View style={[styles.wall, { width: wallWidth, gap: CARD_GAP }]} collapsable={false}>
        {columns.map((col, colIndex) => (
          <View
            key={`col-${colIndex}`}
            style={[
              styles.column,
              {
                width: cardWidth,
                marginTop: (colIndex % 2) * Math.round(cardHeight * 0.22),
                gap: CARD_GAP,
              },
            ]}
          >
            {col.map((source, rowIndex) => (
              <View
                key={`card-${colIndex}-${rowIndex}`}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    borderRadius: Math.round(cardWidth * 0.12),
                  },
                ]}
              >
                <Image source={source} style={styles.cardImage} resizeMode="cover" />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    paddingTop: 28,
    // Light bottom pad so last row clears the CTA scrim without a blank dump.
    paddingBottom: 120,
    paddingHorizontal: SIDE_PAD,
    alignItems: 'center',
  },
  wall: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flexDirection: 'column',
  },
  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});
