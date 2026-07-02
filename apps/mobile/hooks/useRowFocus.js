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

const ELIGIBLE_RATIO = 0.35;
const PRIMARY_EXCLUSIVE_RATIO = 0.52;
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
  const centerY = winH / 2;
  let best = null;

  measurements.forEach((m) => {
    if (m.ratio < ELIGIBLE_RATIO) return;
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

export function RowFocusProvider({ children, scrollTick }) {
  const registryRef = useRef(new Map());
  const [activeRowId, setActiveRowId] = useState(null);
  const sequenceIndexRef = useRef(0);
  const sequenceTimerRef = useRef(null);
  const measuringRef = useRef(false);

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
        const topTwo = [...eligible]
          .sort((a, b) => b.ratio - a.ratio)
          .slice(0, 2)
          .sort(sortByScreenPosition)
          .map((m) => m.rowId);
        startSequence(topTwo);
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
    const scrollMeasureTimer = setTimeout(() => {
      measureRows(false);
    }, SCROLL_MEASURE_DEBOUNCE_MS);

    return () => clearTimeout(scrollMeasureTimer);
  }, [scrollTick, measureRows]);

  useEffect(() => {
    const settleTimer = setTimeout(() => {
      measureRows(true);
    }, SCROLL_SETTLE_MS);

    return () => clearTimeout(settleTimer);
  }, [scrollTick, measureRows]);

  useEffect(() => {
    const mountTimer = setTimeout(() => measureRows(false), 100);
    return () => {
      clearSequenceTimer();
      clearTimeout(mountTimer);
    };
  }, [measureRows, clearSequenceTimer]);

  const value = useMemo(
    () => ({ registerRow, activeRowId, measureRows }),
    [registerRow, activeRowId, measureRows],
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

  const isRowActive = ctx?.activeRowId === rowId;

  const onRowLayout = useCallback(() => {
    if (!ctx) return;
    if (layoutMeasureTimerRef.current != null) {
      clearTimeout(layoutMeasureTimerRef.current);
    }
    layoutMeasureTimerRef.current = setTimeout(() => {
      ctx.measureRows(false);
    }, 200);
  }, [ctx]);

  return { rowRef, isRowActive, onRowLayout };
}
