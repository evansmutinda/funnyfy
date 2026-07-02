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
  const sequenceRowIdsRef = useRef([]);

  const clearSequenceTimer = useCallback(() => {
    if (sequenceTimerRef.current != null) {
      clearInterval(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  const startSequence = useCallback((rowIds) => {
    clearSequenceTimer();
    if (rowIds.length < 2) return;

    sequenceRowIdsRef.current = rowIds;
    sequenceIndexRef.current = 0;
    setActiveRowId(rowIds[0]);

    sequenceTimerRef.current = setInterval(() => {
      sequenceIndexRef.current = (sequenceIndexRef.current + 1) % rowIds.length;
      setActiveRowId(rowIds[sequenceIndexRef.current]);
    }, ROW_SEQUENCE_MS);
  }, [clearSequenceTimer]);

  const registerRow = useCallback((rowId, ref, rowIndex) => {
    registryRef.current.set(rowId, { ref, rowIndex });
    return () => registryRef.current.delete(rowId);
  }, []);

  const measureRows = useCallback((enableSequence) => {
    const entries = Array.from(registryRef.current.entries());
    if (entries.length === 0) {
      setActiveRowId(null);
      clearSequenceTimer();
      return;
    }

    const { width: winW, height: winH } = Dimensions.get('window');
    const measurements = [];
    let pending = entries.length;

    const finish = () => {
      const eligible = measurements
        .filter((m) => m.ratio >= ELIGIBLE_RATIO)
        .sort(sortByScreenPosition);

      if (eligible.length === 0) {
        setActiveRowId(null);
        clearSequenceTimer();
        return;
      }

      const dominant = measurements
        .filter((m) => m.ratio >= PRIMARY_EXCLUSIVE_RATIO)
        .sort((a, b) => b.ratio - a.ratio)[0];

      if (dominant && !enableSequence) {
        clearSequenceTimer();
        setActiveRowId(dominant.rowId);
        return;
      }

      if (enableSequence && eligible.length >= 2) {
        const orderedIds = eligible.map((m) => m.rowId);
        startSequence(orderedIds);
        return;
      }

      const primary = pickPrimaryRow(measurements, winH);
      clearSequenceTimer();
      setActiveRowId(primary?.rowId ?? eligible[0].rowId);
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
  }, [clearSequenceTimer, startSequence]);

  useEffect(() => {
    clearSequenceTimer();
    measureRows(false);
  }, [scrollTick, measureRows, clearSequenceTimer]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      measureRows(true);
    }, SCROLL_SETTLE_MS);

    return () => clearTimeout(timeoutId);
  }, [scrollTick, measureRows]);

  useEffect(() => {
    const soon = setTimeout(() => measureRows(false), 80);
    const afterEnter = setTimeout(() => measureRows(false), 420);
    return () => {
      clearSequenceTimer();
      clearTimeout(soon);
      clearTimeout(afterEnter);
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
    // Entrance animations fire many layout events — debounce to avoid row-focus churn.
    layoutMeasureTimerRef.current = setTimeout(() => {
      ctx.measureRows(false);
    }, 150);
  }, [ctx]);

  return { rowRef, isRowActive, onRowLayout };
}
