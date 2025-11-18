import { useCallback } from 'react';
import type { AnyShape, LineShape, QuadraticCurveShape, CubicCurveShape } from '../../types/drawing';

export interface UseLineHandlersDeps {
  setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>;
  notifyHistory: () => void;
  redoStack: React.MutableRefObject<AnyShape[]>;
}

export function useLineHandlers({ setShapes, notifyHistory, redoStack }: UseLineHandlersDeps) {
  // Targeted updater: clones only the changed shape; returns original array if unchanged
  const replaceShape = useCallback(
    (id: string, updater: (shape: AnyShape) => AnyShape | null, opts?: { trackHistory?: boolean }) => {
      const trackHistory = !!opts?.trackHistory;
      setShapes((prev) => {
        const index = prev.findIndex((s) => s.id === id);
        if (index === -1) return prev;
        const current = prev[index];
        const nextShape = updater(current);
        if (!nextShape || nextShape === current) return prev;
        const next = prev.slice();
        next[index] = nextShape;
        if (trackHistory) {
          redoStack.current = [];
          notifyHistory();
        }
        return next;
      });
    },
    [notifyHistory, redoStack, setShapes],
  );

  const isLineLike = (s: AnyShape): s is LineShape | QuadraticCurveShape | CubicCurveShape =>
    s.type === 'line' || s.type === 'qcurve' || s.type === 'ccurve';

  const onLineDragEnd = useCallback(
    (payload: { id: string; points: number[] }) => {
      replaceShape(payload.id, (s) => (isLineLike(s) ? { ...s, points: payload.points } : null), {
        trackHistory: true,
      });
    },
    [replaceShape],
  );

  const onLineChange = useCallback(
    (payload: { id: string; points?: number[]; rotation?: number }) => {
      replaceShape(payload.id, (s) => {
        if (!isLineLike(s)) return null;
        const line = s as LineShape | QuadraticCurveShape | CubicCurveShape;
        let changed = false;
        const next: AnyShape = { ...line };
        if (payload.points) {
          // shallow compare points to skip unnecessary updates
          const sameLength = line.points.length === payload.points.length;
          let same = sameLength;
            if (sameLength) {
              for (let i = 0; i < line.points.length; i++) {
                if (line.points[i] !== payload.points[i]) {
                  same = false;
                  break;
                }
              }
            }
          if (!same) {
            (next as LineShape | QuadraticCurveShape | CubicCurveShape).points = payload.points;
            changed = true;
          }
        }
        if (payload.rotation != null && line.rotation !== payload.rotation) {
          next.rotation = payload.rotation;
          changed = true;
        }
        return changed ? next : null;
      });
    },
    [replaceShape],
  );

  const onLineStyleChange = useCallback(
    (payload: { id: string; lineJoin?: 'miter' | 'round' | 'bevel'; lineCap?: 'butt' | 'round' | 'square' }) => {
      replaceShape(payload.id, (s) => {
        if (s.type !== 'line') return null;
        let changed = false;
        const next: LineShape = { ...s } as LineShape;
        if (payload.lineJoin && s.lineJoin !== payload.lineJoin) {
          next.lineJoin = payload.lineJoin;
          changed = true;
        }
        if (payload.lineCap && s.lineCap !== payload.lineCap) {
          next.lineCap = payload.lineCap;
          changed = true;
        }
        return changed ? next : null;
      });
    },
    [replaceShape],
  );

  return { onLineDragEnd, onLineChange, onLineStyleChange };
}
