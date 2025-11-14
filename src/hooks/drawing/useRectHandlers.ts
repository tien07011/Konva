import { useCallback } from 'react';
import type { AnyShape, RectShape } from '../../types/drawing';

export interface UseRectHandlersDeps {
  setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>;
  notifyHistory: () => void;
  redoStack: React.MutableRefObject<AnyShape[]>;
}

export function useRectHandlers({ setShapes, notifyHistory, redoStack }: UseRectHandlersDeps) {
  const onRectDragEnd = useCallback(
    (payload: { id: string; x: number; y: number }) => {
      setShapes((prev) =>
        prev.map((s) => (s.id === payload.id && s.type === 'rect' ? { ...(s as RectShape), x: payload.x, y: payload.y } : s)),
      );
      redoStack.current = [];
      notifyHistory();
    },
    [notifyHistory, redoStack, setShapes],
  );

  const onRectChange = useCallback(
    (payload: { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === payload.id && s.type === 'rect'
            ? {
                ...(s as RectShape),
                ...(payload.x !== undefined ? { x: payload.x } : {}),
                ...(payload.y !== undefined ? { y: payload.y } : {}),
                ...(payload.width !== undefined ? { width: payload.width } : {}),
                ...(payload.height !== undefined ? { height: payload.height } : {}),
                ...(payload.rotation !== undefined ? { rotation: payload.rotation } : {}),
              }
            : s,
        ),
      );
    },
    [setShapes],
  );

  return { onRectDragEnd, onRectChange };
}
