import { useCallback, useMemo, useState } from 'react';
import { useLineHandlers } from './drawing/useLineHandlers';
import { useRectHandlers } from './drawing/useRectHandlers';
import { useCircleHandlers } from './drawing/useCircleHandlers';
import { useGrouping } from './drawing/useGrouping';
import { useHistory } from './drawing/useHistory';
import { useDraft } from './drawing/useDraft';
import { useShapeUpdate } from './drawing/useShapeUpdate';
import type {
  AnyShape,
  DraftShape,
  HistoryState,
  ToolType,
  ShapeGroup,
} from '../types/drawing';

export interface UseDrawingOptions {
  tool?: ToolType; // default 'line'
  stroke: string;
  strokeWidth: number;
  fill?: string; // màu fill mặc định cho các shape kín
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
  // extended style change including lineCap
  onLineStyleChange: (payload: {
    id: string;
    lineJoin?: 'miter' | 'round' | 'bevel';
    lineCap?: 'butt' | 'round' | 'square';
  }) => void;
  onShapeUpdate: (payload: {
    id: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number;
    fill?: string;
  }) => void;
  onRectDragEnd: (payload: { id: string; x: number; y: number }) => void;
  onRectChange: (payload: {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
  }) => void;
  onCircleDragEnd: (payload: { id: string; cx: number; cy: number }) => void;
  onCircleChange: (payload: {
    id: string;
    cx?: number;
    cy?: number;
    r?: number;
    rotation?: number;
  }) => void;
  // grouping
  groupShapes: (ids: string[], name?: string) => string | null; // returns new group id
  ungroupGroup: (groupId: string) => void;
  groupDragEnd: (payload: { id: string; x: number; y: number }) => void;
  groupChange: (payload: {
    id: string;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }) => void;
}

let uid = 0;
const nextId = () => `shape_${++uid}`;

export function useDrawing({
  tool = 'line',
  stroke,
  strokeWidth,
  fill = 'transparent',
  onHistoryChange,
}: UseDrawingOptions): UseDrawingResult {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [groups, setGroups] = useState<ShapeGroup[]>([]);

  // history hook encapsulates redoStack & notify
  const { clear, undo, redo, canUndo, canRedo, redoStack, notifyHistory } = useHistory({
    shapes,
    setShapes,
    setDraft: () => {}, // replaced by useDraft's internal state; placeholder will be overwritten below
    onHistoryChange,
  });

  // draft hook manages draft state (override setDraft in history usage not needed)
  const { draft, startDraft, updateDraft, commitDraft } = useDraft({
    tool,
    stroke,
    strokeWidth,
    fill,
    nextId,
    setShapes,
    redoStack,
    notifyHistory,
  });

  // shape style/update hook
  const { onShapeUpdate } = useShapeUpdate(setShapes);

  // Extracted handlers
  const { onLineDragEnd, onLineChange, onLineStyleChange } = useLineHandlers({
    setShapes,
    notifyHistory,
    redoStack,
  });
  const { onRectDragEnd, onRectChange } = useRectHandlers({
    setShapes,
    notifyHistory,
    redoStack,
  });
  const { onCircleDragEnd, onCircleChange } = useCircleHandlers({
    setShapes,
    notifyHistory,
    redoStack,
  });

  // (removed inline onShapeUpdate; now from hook)

  const { groupShapes, ungroupGroup, groupDragEnd, groupChange } = useGrouping({
    shapes,
    groups,
    setGroups,
    nextId,
  });

  const onMouseDown = useCallback(
    (e: any) => {
      // Only start drawing when clicking on empty stage, not on existing shapes
      const stage = e.target.getStage?.();
      if (!stage) return;
      if (e.target !== stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      startDraft(pos.x, pos.y);
    },
    [startDraft],
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (!draft) return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      updateDraft(pos.x, pos.y);
    },
    [draft, updateDraft],
  );

  const onMouseUp = useCallback(() => {
    commitDraft();
  }, [commitDraft]);

  // (history now provided by useHistory)

  return useMemo(
    () => ({
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
      onCircleDragEnd,
      onCircleChange,
      groupShapes,
      ungroupGroup,
      groupDragEnd,
      groupChange,
    }),
    [
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
      onShapeUpdate,
      onRectDragEnd,
      onRectChange,
      onCircleDragEnd,
      onCircleChange,
      groupShapes,
      ungroupGroup,
      groupDragEnd,
      groupChange,
    ],
  );
}
