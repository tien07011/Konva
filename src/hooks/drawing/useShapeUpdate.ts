import { useCallback } from 'react';
import type { AnyShape, CircleShape, LineShape, RectShape } from '../../types/drawing';

export function useShapeUpdate(setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>) {
  const onShapeUpdate = useCallback(
    (payload: { id: string; stroke?: string; strokeWidth?: number; rotation?: number; fill?: string }) => {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === payload.id
            ? {
                ...s,
                ...(payload.stroke !== undefined ? { stroke: payload.stroke } : {}),
                ...(payload.strokeWidth !== undefined ? { strokeWidth: payload.strokeWidth } : {}),
                ...(payload.rotation !== undefined ? { rotation: payload.rotation } : {}),
                ...(payload.fill !== undefined ? { fill: payload.fill } : {}),
              }
            : s,
        ),
      );
    },
    [setShapes],
  );
  return { onShapeUpdate };
}
