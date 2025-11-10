// Common drawing types for shapes and tools

export type ToolType = 'none' | 'line' | 'rect' | 'circle' | 'qcurve' | 'ccurve' | 'path'; // thêm custom path

export interface BaseShape {
  id: string;
  type: ToolType;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  fill?: string; // màu bên trong (áp dụng cho các shape kín như rect, circle)
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[]; // [x1, y1, x2, y2]
  lineJoin?: 'miter' | 'round' | 'bevel'; // kiểu nối giữa các đoạn
}

// Quadratic Bézier curve: [x0, y0, cx, cy, x1, y1]
export interface QuadraticCurveShape extends BaseShape {
  type: 'qcurve';
  points: number[]; // phải có length = 6
}

// Cubic Bézier curve: [x0, y0, cx1, cy1, cx2, cy2, x1, y1]
export interface CubicCurveShape extends BaseShape {
  type: 'ccurve';
  points: number[]; // phải có length = 8
}

export interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

// Custom Path
export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'Q'; cx: number; cy: number; x: number; y: number }
  | { cmd: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { cmd: 'Z' };

export interface PathShape extends BaseShape {
  type: 'path';
  commands: PathCommand[];
}

export type AnyShape =
  | LineShape
  | RectShape
  | CircleShape
  | QuadraticCurveShape
  | CubicCurveShape
  | PathShape; // mở rộng thêm các dạng cong

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
