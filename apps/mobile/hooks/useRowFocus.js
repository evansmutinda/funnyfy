import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions } from 'react-native';
import { TILE_FADE_MS, TILE_HOLD_MS } from '../components/ComparisonFade';

const ELIGIBLE_RATIO = 0.22;
const PARTIAL_RATIO = 0.08;
const PRIMARY_EXCLUSIVE_RATIO = 0.52;
const BOTTOM_BAND_START = 0.58;
const SCROLL_SETTLE_MS = 450;
const SCROLL_MEASURE_DEBOUNCE_MS = 120;

/** One crossfade cycle: hold → fade → hold → fade */
const ROW_SEQUENCE_MS = (TILE_HOLD_MS + TILE_FADE_MS) * 2;

const RowFocusContext = createContext(null);

function visibilityRatio(x, y, w, h, winW, winH) {
  if (!w || !h) return 0;
  const visibleH = Math.min(y + h, winH) - Math.max(y, 0);
  const visibleW = Math.min(x + w, winW) - Math.max(x, 0);
  return (Math.max(0, visibleH) * Math.max(0, visibleW)) / (w * h);
}

function sortByScreenPosition(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  return a.rowIndex - b.rowIndex;
}

function pickPrimaryRow(measurements, winH) {
  const eligible = measurements.filter((m) => m.ratio >= ELIGIBLE_RATIO);
  if (eligible.length === 0) return null;

  const bottomEligible = eligible.filter(
    (m) => m.y + m.h * 0.5 >= winH * BOTTOM_BAND_START,
  );
  if (bottomEligible.length) {
    return bottomEligible.reduce((best, m) => {
      if (!best || m.y > best.y || (m.y === best.y && m.ratio > best.ratio)) return m;
      return best;
    }, null);
  }

  const centerY = winH / 2;
  let best = null;

  eligible.forEach((m) => {
    const centerDistance = Math.abs(m.y + m.h / 2 - centerY);
    if (
      !best
      || m.ratio > best.ratio
      || (m.ratio === best.ratio && centerDistance < best.centerDistance)
    ) {
      best = { ...m, centerDistance };
    }
  });

  return best;
}

function pickSequenceRows(eligible, winH) {
  if (eligible.length < 2) return eligible.map((m) => m.rowId);

  const bottomMost = eligible.reduce((best, m) => (!best || m.y > best.y ? m : best), null);
  const inLowerBand = bottomMost
    && bottomMost.y + bottomMost.h * 0.5 >= winH * BOTTOM_BAND_START;

  if (inLowerBand) {
    const partner = [...eligible]
      .filter((m) => m.rowId !== bottomMost.rowId)
      .sort((a, b) => b.ratio - a.ratio)[0];
    if (partner) {
      return [bottomMost, partner].sort(sortByScreenPosition).map((m) => m.rowId);
    }
  }

  return [...eligible]
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 2)
    .sort(sortByScreenPosition)
    .map((m) => m.rowId);
}

export function RowFocusProvider({ children, scrollTick, enabled = true }) {
  const registryRef = useRef(new Map());
  const [activeRowId, setActiveRowId] = useState(null);
  const sequenceIndexRef = useRef(0);
  const sequenceTimerRef = useRef(null);
  const measuringRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clearSequenceTimer = useCallback(() => {
    if (sequenceTimerRef.current != null) {
      clearInterval(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  const setActiveRowIfChanged = useCallback((nextRowId) => {
    setActiveRowId((prev) => (prev === nextRowId ? prev : nextRowId));
  }, []);

  const startSequence = useCallback((rowIds) => {
    clearSequenceTimer();
    if (rowIds.length < 2) return;

    sequenceIndexRef.current = 0;
    setActiveRowIfChanged(rowIds[0]);

    sequenceTimerRef.current = setInterval(() => {
      sequenceIndexRef.current = (sequenceIndexRef.current + 1) % rowIds.length;
      setActiveRowIfChanged(rowIds[sequenceIndexRef.current]);
    }, ROW_SEQUENCE_MS);
  }, [clearSequenceTimer, setActiveRowIfChanged]);

  const registerRow = useCallback((rowId, ref, rowIndex) => {
    registryRef.current.set(rowId, { ref, rowIndex });
    return () => registryRef.current.delete(rowId);
  }, []);

  const measureRows = useCallback((enableSequence) => {
    if (!enabledRef.current) return;
    if (measuringRef.current) return;
    measuringRef.current = true;

    const entries = Array.from(registryRef.current.entries());
    if (entries.length === 0) {
      measuringRef.current = false;
      setActiveRowIfChanged(null);
      clearSequenceTimer();
      return;
    }

    const { width: winW, height: winH } = Dimensions.get('window');
    const measurements = [];
    let pending = entries.length;

    const finish = () => {
      measuringRef.current = false;

      const eligible = measurements
        .filter((m) => m.ratio >= ELIGIBLE_RATIO)
        .sort(sortByScreenPosition);

      if (eligible.length === 0) {
        const partial = measurements
          .filter((m) => m.ratio >= PARTIAL_RATIO)
          .sort((a, b) => b.ratio - a.ratio);
        if (partial.length > 0) {
          clearSequenceTimer();
          setActiveRowIfChanged(partial[0].rowId);
          return;
        }
        setActiveRowIfChanged(null);
        clearSequenceTimer();
        return;
      }

      const dominant = measurements
        .filter((m) => m.ratio >= PRIMARY_EXCLUSIVE_RATIO)
        .sort((a, b) => b.ratio - a.ratio)[0];

      if (dominant && !enableSequence) {
        clearSequenceTimer();
        setActiveRowIfChanged(dominant.rowId);
        return;
      }

      if (enableSequence && eligible.length >= 2) {
        startSequence(pickSequenceRows(eligible, winH));
        return;
      }

      const primary = pickPrimaryRow(measurements, winH);
      clearSequenceTimer();
      setActiveRowIfChanged(primary?.rowId ?? eligible[0].rowId);
    };

    entries.forEach(([rowId, { ref, rowIndex }]) => {
      if (!ref.current) {
        measurements.push({ rowId, rowIndex, ratio: 0, y: 0, h: 0 });
        pending -= 1;
        if (pending === 0) finish();
        return;
      }

      ref.current.measureInWindow((x, y, w, h) => {
        measurements.push({
          rowId,
          rowIndex,
          ratio: visibilityRatio(x, y, w, h, winW, winH),
          y,
          h,
        });
        pending -= 1;
        if (pending === 0) finish();
      });
    });
  }, [clearSequenceTimer, setActiveRowIfChanged, startSequence]);

  useEffect(() => {
    if (!enabled) {
      setActiveRowId(null);
      clearSequenceTimer();
      return undefined;
    }
    const scrollMeasureTimer = setTimeout(() => {
      measureRows(false);
    }, SCROLL_MEASURE_DEBOUNCE_MS);

    return () => clearTimeout(scrollMeasureTimer);
  }, [scrollTick, measureRows, enabled, clearSequenceTimer]);

  useEffect(() => {
    if (!enabled) return undefined;
    const settleTimer = setTimeout(() => {
      measureRows(true);
    }, SCROLL_SETTLE_MS);

    return () => clearTimeout(settleTimer);
  }, [scrollTick, measureRows, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const mountTimer = setTimeout(() => measureRows(false), 100);
    return () => {
      clearSequenceTimer();
      clearTimeout(mountTimer);
    };
  }, [measureRows, clearSequenceTimer, enabled]);

  const value = useMemo(
    () => ({ registerRow, activeRowId, measureRows, enabled }),
    [registerRow, activeRowId, measureRows, enabled],
  );

  return (
    <RowFocusContext.Provider value={value}>
      {children}
    </RowFocusContext.Provider>
  );
}

export function useCategoryRowFocus(rowId, rowIndex) {
  const ctx = useContext(RowFocusContext);
  const rowRef = useRef(null);
  const layoutMeasureTimerRef = useRef(null);

  useEffect(() => {
    if (!ctx) return undefined;
    return ctx.registerRow(rowId, rowRef, rowIndex);
  }, [ctx, rowId, rowIndex]);

  useEffect(() => () => {
    if (layoutMeasureTimerRef.current != null) {
      clearTimeout(layoutMeasureTimerRef.current);
    }
  }, []);

  const isRowActive = ctx?.enabled && ctx?.activeRowId === rowId;

  const onRowLayout = useCallback(() => {
    if (!ctx?.enabled) return;
    if (layoutMeasureTimerRef.current != null) {
      clearTimeout(layoutMeasureTimerRef.current);
    }
    layoutMeasureTimerRef.current = setTimeout(() => {
      ctx.measureRows(false);
    }, 200);
  }, [ctx]);

  return { rowRef, isRowActive, onRowLayout };
}
