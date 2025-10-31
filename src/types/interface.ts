// Kiểu cho các lệnh vẽ custom (trừu tượng)
// type PathCommand =
//   | { type: 'moveTo'; x: number; y: number }
//   | { type: 'lineTo'; x: number; y: number }
//   | { type: 'arc'; rx: number; ry: number; xAxisRotation: number; largeArc: boolean; sweep: boolean; x: number; y: number }
//   | { type: 'closePath' };

// Kiểu Shape với d là array các lệnh vẽ custom
export interface Shape {
  id: string;
  // type: 'line' | 'circle' | 'rectangle' | 'polygon' | 'custom';
  // d: PathCommand[];           // Custom path commands, không phải string SVG
  d: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  rotation?: number;
  scale?: number;
  translate?: { x: number; y: number };
}

// Group vẫn giữ nguyên
export interface Group {
  id: string;
  shapes?: Shape[];
  groups?: Group[];
  stroke?: string;
  fill?: string;
  rotation?: number;
  scale?: number;
  translate?: { x: number; y: number };
}

// Màn hình chứa các shapes/groups
export interface Screen {
  id: string;
  name?: string;
  shapes?: Shape[];
  groups?: Group[];
  background?: string;
}
