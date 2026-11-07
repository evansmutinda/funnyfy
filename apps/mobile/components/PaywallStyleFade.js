import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import OnboardingCollageWall from './OnboardingCollageWall';

const HOLD_BEFORE_MS = 1100;
const SWEEP_MS = 1400;
const HOLD_AFTER_MS = 1800;
const VEIL_MS = 520;
const DARK_BG = '#0B0F19';

/** Gentler than quadratic ease-in-out — soft start/stop on the wipe. */
const smootherstep = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

function isCollageSlide(slide) {
  return Array.isArray(slide?.collage) && slide.collage.length > 0;
}

/**
 * Paywall / onboarding hero: automated before → after wipe per style, then next.
 * Also supports a collage slide: `{ id, collage: [imageSources] }`.
 * mix = 1 full before, mix = 0 full after.
 * Before is the base layer so style changes never flash the after first.
 *
 * @param {boolean} [loop=true] When false, stop on the last slide (onboarding).
 * @param {number} [introDelayMs=0] Extra settle time before the first wipe only.
 * @param {boolean} [softTransitions=false] Dark veil between slides (not on first paint).
 */
export default function PaywallStyleFade({
  pairs,
  images,
  style,
  imageStyle,
  holdBeforeMs = HOLD_BEFORE_MS,
  sweepMs = SWEEP_MS,
  holdAfterMs = HOLD_AFTER_MS,
  introDelayMs = 0,
  softTransitions = false,
  loop = true,
  onActiveChange,
}) {
  const pairList = useMemo(() => {
    if (Array.isArray(pairs) && pairs.length > 0) {
      return pairs.filter(
        (p) => (p?.before && p?.after) || isCollageSlide(p),
      );
    }
    const sources = Array.isArray(images) ? images.filter(Boolean) : [];
    return sources.map((after) => ({ before: after, after }));
  }, [pairs, images]);

  const count = pairList.length;
  const [index, setIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [mix, setMix] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [veil, setVeil] = useState(0);
  const [veilKey, setVeilKey] = useState(0);
  const firstCycle = useRef(true);
  /** First paint must not veil — that blinks the opening before image. */
  const skipVeilOnce = useRef(true);

  useEffect(() => {
    setIndex(0);
    setCycleKey(0);
    setMix(1);
    setVeil(0);
    firstCycle.current = true;
    skipVeilOnce.current = true;
  }, [count]);

  useEffect(() => {
    if (!onActiveChange || count === 0) return;
    const active = pairList[index % count];
    onActiveChange({
      index,
      id: active?.id || null,
      pair: active || null,
    });
  }, [index, count, pairList, onActiveChange]);

  // Reset before paint so the new style never mounts with mix=0 (after flash).
  useLayoutEffect(() => {
    setMix(1);
    if (!softTransitions) return;

    if (skipVeilOnce.current) {
      skipVeilOnce.current = false;
      setVeil(0);
      return;
    }

    setVeil(1);
    setVeilKey((k) => k + 1);
  }, [index, cycleKey, softTransitions]);

  // Soft veil between slides only — cover the cut, then ease clear.
  useEffect(() => {
    if (!softTransitions || veilKey === 0) return undefined;

    let frameId = null;
    let cancelled = false;
    const start = Date.now();

    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (Date.now() - start) / VEIL_MS);
      setVeil(1 - smootherstep(t));
      if (t < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [veilKey, softTransitions]);

  useEffect(() => {
    if (count === 0) return undefined;

    const active = pairList[index % count];
    const isLast = index >= count - 1;

    // Collage (or any last slide with loop off): stay put.
    if (isCollageSlide(active) || (!loop && isLast)) {
      return undefined;
    }

    const leadIn =
      firstCycle.current && index === 0 ? Math.max(0, introDelayMs) : 0;
    firstCycle.current = false;

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
        setMix(1 - smootherstep(elapsed / sweepMs));
        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);
    }, holdBeforeMs + leadIn);

    const advanceId = setTimeout(() => {
      if (cancelled) return;
      setMix(1);
      if (count <= 1) {
        if (loop) setCycleKey((k) => k + 1);
        return;
      }
      setIndex((prev) => {
        if (!loop && prev >= count - 1) return prev;
        return (prev + 1) % count;
      });
    }, holdBeforeMs + leadIn + sweepMs + holdAfterMs);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(advanceId);
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [
    index,
    cycleKey,
    count,
    pairList,
    holdBeforeMs,
    sweepMs,
    holdAfterMs,
    introDelayMs,
    loop,
  ]);

  if (count === 0) return null;

  const active = pairList[index % count];
  const collage = isCollageSlide(active);
  const afterReveal = 1 - mix;
  const showAfter = !collage && afterReveal > 0.02;

  return (
    <View
      style={[styles.root, style]}
      onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
      pointerEvents={collage ? 'auto' : 'none'}
    >
      {collage ? (
        <OnboardingCollageWall
          key={`collage-${active.id || index}-${cycleKey}`}
          images={active.collage}
        />
      ) : (
        <>
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
        </>
      )}

      {softTransitions && veil > 0.01 ? (
        <View
          pointerEvents="none"
          style={[styles.veil, { opacity: veil }]}
        />
      ) : null}

      {count > 1 && !collage ? (
        <View style={styles.dotsRow} pointerEvents="none">
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
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DARK_BG,
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
