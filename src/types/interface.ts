// Mô hình tối giản để lưu path SVG theo dạng cấu trúc, KHÔNG lưu chuỗi 'd'

// 1) Path: dùng các đoạn lệnh đơn giản với mảng số liệu
// Chuẩn hoá về lệnh: chỉ dùng M, L, C, Q, A, Z (đủ cover hầu hết path)
// - M x y
// - L x y
// - C x1 y1 x2 y2 x y
// - Q x1 y1 x y
// - A rx ry xAxisRotation largeArcFlag sweepFlag x y
// - Z
export type PathCmd = 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
export interface PathSegment {
	cmd: PathCmd;
	data: number[]; // dữ liệu theo thứ tự như chú thích ở trên
}
export type PathData = PathSegment[];

// 2) Thuộc tính tối giản dùng chung
export interface MinimalNodeProps {
	id: string;
	name?: string;
	visible?: boolean; // mặc định true
	opacity?: number; // 0..1
	x?: number;
	y?: number;
	rotation?: number; // độ
	scaleX?: number; // mặc định 1
	scaleY?: number; // mặc định 1
	z?: number; // trật tự vẽ
}

export interface MinimalPaint {
	fill?: string; // ví dụ '#ff0000'
	stroke?: string; // ví dụ '#333'
	strokeWidth?: number; // px
}

// 3) Shape và Group tối giản
export interface PathShape extends MinimalNodeProps, MinimalPaint {
	type: 'path';
	path: PathData; // dữ liệu path dạng cấu trúc
}

export interface Group extends MinimalNodeProps {
	type: 'group';
	children: string[]; // id của nodes (shape hoặc group)
}

export type Node = PathShape | Group;

// 4) Scene tối giản: một map nodes và id root
export interface Scene {
	rootId: string;
	nodes: Record<string, Node>;
}


