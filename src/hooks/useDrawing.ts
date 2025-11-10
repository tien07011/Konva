import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { AnyShape, DraftShape, HistoryState, LineShape, RectShape, ToolType, ShapeGroup, QuadraticCurveShape, CubicCurveShape } from '../types/drawing';

export interface UseDrawingOptions {
  tool?: ToolType; // default 'line'
  stroke: string;
  strokeWidth: number;
  onHistoryChange?: (info: HistoryState) => void;
}

export interface UseDrawingResult {
  shapes: AnyShape[];
  groups: ShapeGroup[];
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
  onLineStyleChange: (payload: { id: string; lineJoin?: 'miter' | 'round' | 'bevel' }) => void;
  onShapeUpdate: (payload: { id: string; stroke?: string; strokeWidth?: number; rotation?: number }) => void;
  onRectDragEnd: (payload: { id: string; x: number; y: number }) => void;
  onRectChange: (payload: { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void;
  // grouping
  groupShapes: (ids: string[], name?: string) => string | null; // returns new group id
  ungroupGroup: (groupId: string) => void;
  groupDragEnd: (payload: { id: string; x: number; y: number }) => void;
  groupChange: (payload: { id: string; x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) => void;
}

let uid = 0;
const nextId = () => `shape_${++uid}`;

export function useDrawing({ tool = 'line', stroke, strokeWidth, onHistoryChange }: UseDrawingOptions): UseDrawingResult {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [groups, setGroups] = useState<ShapeGroup[]>([]);
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
        lineJoin: 'miter',
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
    } else if (tool === 'qcurve') {
      const d: QuadraticCurveShape = {
        id: nextId(),
        type: 'qcurve',
        stroke,
        strokeWidth,
        points: [x, y, x, y, x, y], // start, control, end (initially overlapping)
      };
      setDraft(d);
    } else if (tool === 'ccurve') {
      const d: CubicCurveShape = {
        id: nextId(),
        type: 'ccurve',
        stroke,
        strokeWidth,
        points: [x, y, x, y, x, y, x, y], // start, c1, c2, end (initially overlapping)
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
    } else if (draft.type === 'qcurve') {
      // keep start fixed, update end, derive control as midpoint
      const p0x = draft.points[0];
      const p0y = draft.points[1];
      const cx = (p0x + x) / 2;
      const cy = (p0y + y) / 2;
      setDraft({ ...draft, points: [p0x, p0y, cx, cy, x, y] });
    } else if (draft.type === 'ccurve') {
      // derive control points at 1/3 & 2/3 along straight line initial
      const p0x = draft.points[0];
      const p0y = draft.points[1];
      const cx1 = p0x + (x - p0x) / 3;
      const cy1 = p0y + (y - p0y) / 3;
      const cx2 = p0x + 2 * (x - p0x) / 3;
      const cy2 = p0y + 2 * (y - p0y) / 3;
      setDraft({ ...draft, points: [p0x, p0y, cx1, cy1, cx2, cy2, x, y] });
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
      prev.map((s) => (
        s.id === payload.id && (s.type === 'line' || s.type === 'qcurve' || s.type === 'ccurve')
          ? { ...s, points: payload.points }
          : s
      ))
    );
    // dragging is a new action; clear redo stack
    redoStack.current = [];
    notifyHistory();
  }, [notifyHistory]);

  const onLineChange = useCallback((payload: { id: string; points?: number[]; rotation?: number }) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === payload.id && (s.type === 'line' || s.type === 'qcurve' || s.type === 'ccurve')
          ? { ...s, ...(payload.points ? { points: payload.points } : {}), ...(payload.rotation != null ? { rotation: payload.rotation } : {}) }
          : s
      )
    );
  }, []);

  const onLineStyleChange = useCallback((payload: { id: string; lineJoin?: 'miter' | 'round' | 'bevel' }) => {
    setShapes((prev) =>
      prev.map((s) => (
        s.id === payload.id && s.type === 'line'
          ? { ...s, ...(payload.lineJoin ? { lineJoin: payload.lineJoin } : {}) }
          : s
      ))
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

  // Group helpers
  const isInAnyGroup = useCallback((id: string, groupsList: ShapeGroup[]): boolean => {
    for (const g of groupsList) {
      if (g.shapeIds.includes(id)) return true;
      if (isInAnyGroup(id, g.groups)) return true;
    }
    return false;
  }, []);

  const groupShapes = useCallback((ids: string[], name = 'Group'): string | null => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length < 2) return null; // need at least two shapes to group
    // ensure all ids exist
    const allExist = unique.every((id) => shapes.some((s) => s.id === id));
    if (!allExist) return null;
    // remove ids already grouped (top-level only for now)
    const topLevelIds = unique.filter((id) => !isInAnyGroup(id, groups));
    if (topLevelIds.length < 2) return null;
    const newGroup: ShapeGroup = {
      id: nextId(),
      name,
      shapeIds: topLevelIds,
      groups: [],
      visible: true,
      locked: false,
    };
    setGroups((prev) => [newGroup, ...prev]);
    return newGroup.id;
  }, [groups, isInAnyGroup, shapes]);

  const ungroupGroup = useCallback((groupId: string) => {
    const removeRec = (list: ShapeGroup[]): ShapeGroup[] =>
      list
        .filter((g) => g.id !== groupId)
        .map((g) => ({ ...g, groups: removeRec(g.groups) }));
    setGroups((prev) => removeRec(prev));
  }, []);

  const groupDragEnd = useCallback((payload: { id: string; x: number; y: number }) => {
    setGroups((prev) => prev.map((g) => g.id === payload.id ? { ...g, translate: { x: payload.x, y: payload.y } } : g));
  }, []);

  const groupChange = useCallback((payload: { id: string; x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== payload.id) return g;
      const next: ShapeGroup = { ...g };
      if (payload.x != null || payload.y != null) {
        const tx = payload.x != null ? payload.x : g.translate?.x || 0;
        const ty = payload.y != null ? payload.y : g.translate?.y || 0;
        next.translate = { x: tx, y: ty };
      }
      if (payload.rotation != null) next.rotation = payload.rotation;
      if (payload.scaleX != null || payload.scaleY != null) {
        const sx = payload.scaleX != null ? payload.scaleX : g.scale?.x || 1;
        const sy = payload.scaleY != null ? payload.scaleY : g.scale?.y || 1;
        next.scale = { x: sx, y: sy };
      }
      return next;
    }));
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
    groups,
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
  onLineStyleChange,
    onShapeUpdate,
    onRectDragEnd,
    onRectChange,
    groupShapes,
    ungroupGroup,
    groupDragEnd,
    groupChange,
  }), [shapes, groups, draft, canUndo, canRedo, clear, undo, redo, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd, onLineChange, onShapeUpdate, onRectDragEnd, onRectChange, groupShapes, ungroupGroup, groupDragEnd, groupChange]);
}
