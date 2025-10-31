import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { AnyShape, DraftShape, HistoryState, LineShape, RectShape, ToolType } from '../types/drawing';

export interface UseDrawingOptions {
  tool?: ToolType; // default 'line'
  stroke: string;
  strokeWidth: number;
  onHistoryChange?: (info: HistoryState) => void;
}

export interface UseDrawingResult {
  shapes: AnyShape[];
  draft: DraftShape;
  canUndo: boolean;
  canRedo: boolean;
  // history actions
  clear: () => void;
  undo: () => void;
  redo: () => void;
  // pointer handlers: pass the Konva event directly
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: (e: any) => void;
  // shape interactions
  onLineDragEnd: (payload: { id: string; points: number[] }) => void;
  onLineChange: (payload: { id: string; points?: number[]; rotation?: number }) => void;
  onShapeUpdate: (payload: { id: string; stroke?: string; strokeWidth?: number; rotation?: number }) => void;
  onRectDragEnd: (payload: { id: string; x: number; y: number }) => void;
  onRectChange: (payload: { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void;
}

let uid = 0;
const nextId = () => `shape_${++uid}`;

export function useDrawing({ tool = 'line', stroke, strokeWidth, onHistoryChange }: UseDrawingOptions): UseDrawingResult {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [draft, setDraft] = useState<DraftShape>(null);
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

  const startDraft = useCallback((x: number, y: number) => {
    if (tool === 'none') return;
    if (tool === 'line') {
      const d: LineShape = {
        id: nextId(),
        type: 'line',
        stroke,
        strokeWidth,
        points: [x, y, x, y],
      };
      setDraft(d);
    } else if (tool === 'rect') {
      const d: RectShape = {
        id: nextId(),
        type: 'rect',
        stroke,
        strokeWidth,
        x,
        y,
        width: 0,
        height: 0,
      };
      setDraft(d);
    }
  }, [stroke, strokeWidth, tool]);

  const updateDraft = useCallback((x: number, y: number) => {
    if (!draft) return;
    if (draft.type === 'line') {
      setDraft({ ...draft, points: [draft.points[0], draft.points[1], x, y] });
    } else if (draft.type === 'rect') {
      const x0 = (draft as RectShape).x;
      const y0 = (draft as RectShape).y;
      const nx = Math.min(x0, x);
      const ny = Math.min(y0, y);
      const w = Math.abs(x - x0);
      const h = Math.abs(y - y0);
      setDraft({ ...(draft as RectShape), x: nx, y: ny, width: w, height: h });
    }
  }, [draft]);

  const commitDraft = useCallback(() => {
    if (!draft) return;
    setShapes((prev) => [...prev, draft as AnyShape]);
    setDraft(null);
    redoStack.current = [];
    notifyHistory();
  }, [draft, notifyHistory]);

  const onLineDragEnd = useCallback((payload: { id: string; points: number[] }) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === payload.id && s.type === 'line' ? { ...s, points: payload.points } : s))
    );
    // dragging is a new action; clear redo stack
    redoStack.current = [];
    notifyHistory();
  }, [notifyHistory]);

  const onLineChange = useCallback((payload: { id: string; points?: number[]; rotation?: number }) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === payload.id && s.type === 'line'
          ? { ...s, ...(payload.points ? { points: payload.points } : {}), ...(payload.rotation != null ? { rotation: payload.rotation } : {}) }
          : s
      )
    );
  }, []);

  const onRectDragEnd = useCallback((payload: { id: string; x: number; y: number }) => {
    setShapes((prev) => prev.map((s) => (s.id === payload.id && s.type === 'rect' ? { ...(s as RectShape), x: payload.x, y: payload.y } : s)));
    redoStack.current = [];
    notifyHistory();
  }, [notifyHistory]);

  const onRectChange = useCallback((payload: { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => {
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
          : s
      )
    );
  }, []);

  const onShapeUpdate = useCallback((payload: { id: string; stroke?: string; strokeWidth?: number; rotation?: number }) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === payload.id
          ? {
              ...s,
              ...(payload.stroke !== undefined ? { stroke: payload.stroke } : {}),
              ...(payload.strokeWidth !== undefined ? { strokeWidth: payload.strokeWidth } : {}),
              ...(payload.rotation !== undefined ? { rotation: payload.rotation } : {}),
            }
          : s
      )
    );
  }, []);

  const onMouseDown = useCallback((e: any) => {
    // Only start drawing when clicking on empty stage, not on existing shapes
    const stage = e.target.getStage?.();
    if (!stage) return;
    if (e.target !== stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    startDraft(pos.x, pos.y);
  }, [startDraft]);

  const onMouseMove = useCallback((e: any) => {
    if (!draft) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    updateDraft(pos.x, pos.y);
  }, [draft, updateDraft]);

  const onMouseUp = useCallback(() => {
    commitDraft();
  }, [commitDraft]);

  const clear = useCallback(() => {
    setShapes([]);
    setDraft(null);
    redoStack.current = [];
    notifyHistory();
  }, [notifyHistory]);

  const undo = useCallback(() => {
    setShapes((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const popped = copy.pop()!;
      redoStack.current.push(popped);
      return copy;
    });
    notifyHistory();
  }, [notifyHistory]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const last = redoStack.current.pop()!;
    setShapes((prev) => [...prev, last]);
    notifyHistory();
  }, [notifyHistory]);

  const canUndo = shapes.length > 0;
  const canRedo = redoStack.current.length > 0;

  return useMemo(() => ({
    shapes,
    draft,
    canUndo,
    canRedo,
    clear,
    undo,
    redo,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onLineDragEnd,
    onLineChange,
    onShapeUpdate,
    onRectDragEnd,
    onRectChange,
  }), [shapes, draft, canUndo, canRedo, clear, undo, redo, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd, onLineChange, onShapeUpdate, onRectDragEnd, onRectChange]);
}
