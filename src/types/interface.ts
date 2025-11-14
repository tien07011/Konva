export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'Q'; cx: number; cy: number; x: number; y: number }
  | { cmd: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { cmd: 'Z' };

export type VerboseCommand =
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'lineTo'; x: number; y: number }
  | { type: 'quadraticCurveTo'; cx: number; cy: number; x: number; y: number }
  | { type: 'cubicCurveTo'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'closePath' };

export interface Shape {
  id: string;
  commands?: PathCommand[];
  ops?: VerboseCommand[];
  d?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  rotation?: number;
  scale?: number;
  translate?: { x: number; y: number };
}

// Hỗ trợ group lồng nhau và trộn lẫn shape/group theo thứ tự bất kỳ
export type GroupChild = Shape | Group;

export interface Group {
  id: string;
  name?: string;
  children?: GroupChild[];
  stroke?: string;
  fill?: string;
  rotation?: number;
  scale?: number;
  translate?: { x: number; y: number };
}

export interface Screen {
  id: string;
  name?: string;
  children?: GroupChild[];
  background?: string;
}
