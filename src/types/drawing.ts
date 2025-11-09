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
  lineJoin?: 'miter' | 'round' | 'bevel'; // kiểu nối giữa các đoạn
}

export interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AnyShape = LineShape | RectShape; // | CircleShape | ...

// Group tree for layer panel
export interface ShapeGroup {
  id: string;
  name: string;
  // Children can be shapes or nested groups
  shapeIds: string[]; // maintain ordering of shapes
  groups: ShapeGroup[]; // nested groups
  // visibility / lock state
  visible: boolean;
  locked: boolean;
  // optional transform for the group (future)
  rotation?: number;
  translate?: { x: number; y: number };
  scale?: { x: number; y: number };
}

export interface DrawingTree {
  shapes: AnyShape[]; // flat store of all shapes
  groups: ShapeGroup[]; // top-level groups
}

export type DraftShape = AnyShape | null;

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}
