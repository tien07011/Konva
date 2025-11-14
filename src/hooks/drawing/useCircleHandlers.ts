import { useCallback } from 'react';
import type { AnyShape, CircleShape } from '../../types/drawing';

export interface UseCircleHandlersDeps {
  setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>;
  notifyHistory: () => void;
  redoStack: React.MutableRefObject<AnyShape[]>;
}

export function useCircleHandlers({ setShapes, notifyHistory, redoStack }: UseCircleHandlersDeps) {
  const onCircleDragEnd = useCallback(
    (payload: { id: string; cx: number; cy: number }) => {
      setShapes((prev) =>
        prev.map((s) => (s.id === payload.id && s.type === 'circle' ? { ...(s as CircleShape), cx: payload.cx, cy: payload.cy } : s)),
      );
      redoStack.current = [];
      notifyHistory();
    },
    [notifyHistory, redoStack, setShapes],
  );

  const onCircleChange = useCallback(
    (payload: { id: string; cx?: number; cy?: number; r?: number; rotation?: number }) => {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === payload.id && s.type === 'circle'
            ? {
                ...(s as CircleShape),
                ...(payload.cx !== undefined ? { cx: payload.cx } : {}),
                ...(payload.cy !== undefined ? { cy: payload.cy } : {}),
                ...(payload.r !== undefined ? { r: Math.max(1, payload.r) } : {}),
                ...(payload.rotation !== undefined ? { rotation: payload.rotation } : {}),
              }
            : s,
        ),
      );
    },
    [setShapes],
  );

  return { onCircleDragEnd, onCircleChange };
}
