import { useCallback } from 'react';
import type { AnyShape, LineShape, QuadraticCurveShape, CubicCurveShape } from '../../types/drawing';

export interface UseLineHandlersDeps {
  setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>;
  notifyHistory: () => void;
  redoStack: React.MutableRefObject<AnyShape[]>;
}

export function useLineHandlers({ setShapes, notifyHistory, redoStack }: UseLineHandlersDeps) {
  const onLineDragEnd = useCallback(
    (payload: { id: string; points: number[] }) => {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === payload.id && (s.type === 'line' || s.type === 'qcurve' || s.type === 'ccurve')
            ? { ...s, points: payload.points }
            : s,
        ),
      );
      redoStack.current = [];
      notifyHistory();
    },
    [notifyHistory, redoStack, setShapes],
  );

  const onLineChange = useCallback(
    (payload: { id: string; points?: number[]; rotation?: number }) => {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === payload.id && (s.type === 'line' || s.type === 'qcurve' || s.type === 'ccurve')
            ? {
                ...s,
                ...(payload.points ? { points: payload.points } : {}),
                ...(payload.rotation != null ? { rotation: payload.rotation } : {}),
              }
            : s,
        ),
      );
    },
    [setShapes],
  );

  const onLineStyleChange = useCallback(
    (payload: {
      id: string;
      lineJoin?: 'miter' | 'round' | 'bevel';
      lineCap?: 'butt' | 'round' | 'square';
    }) => {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === payload.id && s.type === 'line'
            ? {
                ...s,
                ...(payload.lineJoin ? { lineJoin: payload.lineJoin } : {}),
                ...(payload.lineCap ? { lineCap: payload.lineCap } : {}),
              }
            : s,
        ),
      );
    },
    [setShapes],
  );

  return { onLineDragEnd, onLineChange, onLineStyleChange };
}
