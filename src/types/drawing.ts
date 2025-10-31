// Common drawing types for shapes and tools

export type ToolType = 'none' | 'line' | 'rect'; // extend: 'ellipse' | 'arrow' | 'pen' | ...

export interface BaseShape {
  id: string;
  type: ToolType;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[]; // [x1, y1, x2, y2]
}

export interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AnyShape = LineShape | RectShape; // | CircleShape | ...

export type DraftShape = AnyShape | null;

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}
