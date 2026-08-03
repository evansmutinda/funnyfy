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

const ELIGIBLE_RATIO = 0.22;
const PARTIAL_RATIO = 0.08;
const SCROLL_SETTLE_MS = 450;
const SCROLL_MEASURE_DEBOUNCE_MS = 120;

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

function pickActiveRowIds(measurements) {
  const eligible = measurements
    .filter((m) => m.ratio >= ELIGIBLE_RATIO)
    .sort(sortByScreenPosition);

  if (eligible.length > 0) {
    return eligible.map((m) => m.rowId);
  }

  const partial = measurements
    .filter((m) => m.ratio >= PARTIAL_RATIO)
    .sort((a, b) => b.ratio - a.ratio);

  return partial.length > 0 ? [partial[0].rowId] : [];
}

export function RowFocusProvider({ children, scrollTick, enabled = true }) {
  const registryRef = useRef(new Map());
  const [activeRowIds, setActiveRowIds] = useState(() => new Set());
  const measuringRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const setActiveRowsIfChanged = useCallback((nextRowIds) => {
    setActiveRowIds((prev) => {
      if (prev.size === nextRowIds.length && nextRowIds.every((id) => prev.has(id))) {
        return prev;
      }
      return new Set(nextRowIds);
    });
  }, []);

  const registerRow = useCallback((rowId, ref, rowIndex) => {
    registryRef.current.set(rowId, { ref, rowIndex });
    return () => registryRef.current.delete(rowId);
  }, []);

  const measureRows = useCallback(() => {
    if (!enabledRef.current) return;
    if (measuringRef.current) return;
    measuringRef.current = true;

    const entries = Array.from(registryRef.current.entries());
    if (entries.length === 0) {
      measuringRef.current = false;
      setActiveRowsIfChanged([]);
      return;
    }

    const { width: winW, height: winH } = Dimensions.get('window');
    const measurements = [];
    let pending = entries.length;

    const finish = () => {
      measuringRef.current = false;
      setActiveRowsIfChanged(pickActiveRowIds(measurements));
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
  }, [setActiveRowsIfChanged]);

  useEffect(() => {
    if (!enabled) {
      setActiveRowIds(new Set());
      return undefined;
    }
    const scrollMeasureTimer = setTimeout(() => {
      measureRows();
    }, SCROLL_MEASURE_DEBOUNCE_MS);

    return () => clearTimeout(scrollMeasureTimer);
  }, [scrollTick, measureRows, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const settleTimer = setTimeout(() => {
      measureRows();
    }, SCROLL_SETTLE_MS);

    return () => clearTimeout(settleTimer);
  }, [scrollTick, measureRows, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const mountTimer = setTimeout(() => measureRows(), 100);
    return () => clearTimeout(mountTimer);
  }, [measureRows, enabled]);

  const value = useMemo(
    () => ({ registerRow, activeRowIds, measureRows, enabled }),
    [registerRow, activeRowIds, measureRows, enabled],
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

  const isRowActive = ctx?.enabled && ctx?.activeRowIds?.has(rowId);

  const onRowLayout = useCallback(() => {
    if (!ctx?.enabled) return;
    if (layoutMeasureTimerRef.current != null) {
      clearTimeout(layoutMeasureTimerRef.current);
    }
    layoutMeasureTimerRef.current = setTimeout(() => {
      ctx.measureRows();
    }, 200);
  }, [ctx]);

  return { rowRef, isRowActive, onRowLayout };
}
