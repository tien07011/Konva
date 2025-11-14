export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'Q'; cx: number; cy: number; x: number; y: number }
  | { cmd: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | {
      cmd: 'A';
      rx: number; // radius x
      ry: number; // radius y
      xAxisRotation: number; // rotation in degrees
      largeArcFlag: 0 | 1; // 1 if arc >= 180°
      sweepFlag: 0 | 1; // 1 if arc is drawn positive-angle direction
      x: number; // end point x
      y: number; // end point y
    }
  | { cmd: 'Z' };

export type VerboseCommand =
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'lineTo'; x: number; y: number }
  | { type: 'quadraticCurveTo'; cx: number; cy: number; x: number; y: number }
  | { type: 'cubicCurveTo'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | {
      type: 'arcTo';
      rx: number;
      ry: number;
      xAxisRotation: number;
      largeArcFlag: 0 | 1;
      sweepFlag: 0 | 1;
      x: number;
      y: number;
    }
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
  // Circle-specific (optional): if present, shape represents a circle center + radius
  cx?: number;
  cy?: number;
  r?: number;
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
