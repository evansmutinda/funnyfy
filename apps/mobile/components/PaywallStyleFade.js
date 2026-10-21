import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const HOLD_BEFORE_MS = 1100;
const SWEEP_MS = 1400;
const HOLD_AFTER_MS = 1800;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

/**
 * Paywall hero: automated before → after wipe per style, then next style.
 * mix = 1 full before, mix = 0 full after.
 * Before is the base layer so style changes never flash the after first.
 */
export default function PaywallStyleFade({
  pairs,
  images,
  style,
  imageStyle,
  holdBeforeMs = HOLD_BEFORE_MS,
  sweepMs = SWEEP_MS,
  holdAfterMs = HOLD_AFTER_MS,
}) {
  const pairList = useMemo(() => {
    if (Array.isArray(pairs) && pairs.length > 0) {
      return pairs.filter((p) => p?.before && p?.after);
    }
    const sources = Array.isArray(images) ? images.filter(Boolean) : [];
    return sources.map((after) => ({ before: after, after }));
  }, [pairs, images]);

  const count = pairList.length;
  const [index, setIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [mix, setMix] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    setIndex(0);
    setCycleKey(0);
    setMix(1);
  }, [count]);

  // Reset before paint so the new style never mounts with mix=0 (after flash).
  useLayoutEffect(() => {
    setMix(1);
  }, [index, cycleKey]);

  useEffect(() => {
    if (count === 0) return undefined;

    let frameId = null;
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      const start = Date.now();

      const tick = () => {
        if (cancelled) return;
        const elapsed = Date.now() - start;

        if (elapsed >= sweepMs) {
          setMix(0);
          return;
        }

        // Sweep from before (1) → after (0)
        setMix(1 - easeInOut(elapsed / sweepMs));
        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);
    }, holdBeforeMs);

    const advanceId = setTimeout(() => {
      if (cancelled) return;
      // Keep mix at before in the same update as the style change.
      setMix(1);
      if (count <= 1) {
        setCycleKey((k) => k + 1);
        return;
      }
      setIndex((prev) => (prev + 1) % count);
    }, holdBeforeMs + sweepMs + holdAfterMs);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(advanceId);
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [index, cycleKey, count, holdBeforeMs, sweepMs, holdAfterMs]);

  if (count === 0) return null;

  const active = pairList[index % count];
  const afterReveal = 1 - mix; // 0 = hidden, 1 = full after
  const showAfter = afterReveal > 0.02;

  return (
    <View
      style={[styles.root, style]}
      onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
      pointerEvents="none"
    >
      <Image
        key={`before-${active.id || index}-${cycleKey}`}
        source={active.before}
        style={[StyleSheet.absoluteFill, imageStyle]}
        resizeMode="cover"
      />

      {showAfter ? (
        <View
          style={[
            styles.afterMask,
            {
              left: canvasWidth > 0 ? canvasWidth * mix : `${mix * 100}%`,
              right: 0,
            },
          ]}
        >
          <Image
            key={`after-${active.id || index}-${cycleKey}`}
            source={active.after}
            style={[
              styles.afterImage,
              imageStyle,
              canvasWidth > 0 && {
                width: canvasWidth,
                left: canvasWidth > 0 ? -canvasWidth * mix : 0,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {canvasWidth > 0 ? (
        <View style={styles.sliderHandleContainer}>
          <View style={[styles.sliderLine, { left: canvasWidth * mix - 1 }]} />
          <View style={[styles.sliderKnob, { left: canvasWidth * mix - 18 }]}>
            <View style={styles.sliderKnobIconRow}>
              <Feather name="chevron-left" size={14} color="#0F172A" />
              <Feather name="chevron-right" size={14} color="#0F172A" />
            </View>
          </View>
        </View>
      ) : null}

      {count > 1 ? (
        <View style={styles.dotsRow}>
          {pairList.map((pair, i) => (
            <View
              key={pair.id || i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  afterMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  afterImage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
  },
  sliderHandleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderKnob: {
    position: 'absolute',
    top: '42%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sliderKnobIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
});
