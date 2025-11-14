import { useCallback, useEffect, useRef } from 'react';
import type { AnyShape, DraftShape, HistoryState } from '../../types/drawing';

export interface UseHistoryDeps {
  shapes: AnyShape[];
  setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>;
  setDraft: React.Dispatch<React.SetStateAction<DraftShape>>;
  onHistoryChange?: (info: HistoryState) => void;
}

export function useHistory({ shapes, setShapes, setDraft, onHistoryChange }: UseHistoryDeps) {
  const redoStack = useRef<AnyShape[]>([]);

  const notifyHistory = useCallback(() => {
    const info: HistoryState = {
      canUndo: shapes.length > 0,
      canRedo: redoStack.current.length > 0,
    };
    onHistoryChange?.(info);
  }, [onHistoryChange, shapes.length]);

  useEffect(() => {
    notifyHistory();
  }, [notifyHistory]);

  const clear = useCallback(() => {
    setShapes([]);
    setDraft(null);
    redoStack.current = [];
    notifyHistory();
  }, [setShapes, setDraft, notifyHistory]);

  const undo = useCallback(() => {
    setShapes((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const popped = copy.pop()!;
      redoStack.current.push(popped);
      return copy;
    });
    notifyHistory();
  }, [setShapes, notifyHistory]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const last = redoStack.current.pop()!;
    setShapes((prev) => [...prev, last]);
    notifyHistory();
  }, [setShapes, notifyHistory]);

  const canUndo = shapes.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { clear, undo, redo, canUndo, canRedo, redoStack, notifyHistory };
}
