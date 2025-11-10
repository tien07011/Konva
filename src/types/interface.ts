// Kiểu cho các lệnh vẽ custom (absolute). Đơn giản hoá theo chuẩn SVG:
export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'Q'; cx: number; cy: number; x: number; y: number }
  | { cmd: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { cmd: 'Z' };

// Dễ đọc hơn: tên đầy đủ thay vì ký tự M/L/Q/C/Z
export type VerboseCommand =
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'lineTo'; x: number; y: number }
  | { type: 'quadraticCurveTo'; cx: number; cy: number; x: number; y: number }
  | { type: 'cubicCurveTo'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'closePath' };

// Kiểu Shape với d là array các lệnh vẽ custom
export interface Shape {
  id: string;
  // type: 'line' | 'rectangle' | 'path' | ... (tự do hoá ở layer trên)
  commands?: PathCommand[]; // Custom path commands
  ops?: VerboseCommand[]; // Bản dễ đọc hơn (ưu tiên sử dụng)
  d?: string; // Back-compat: chuỗi SVG nếu cần
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
