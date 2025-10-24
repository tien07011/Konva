import React from 'react';
import { Group, Line as KLine, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, ShapeModule, ThickArrowShape as ThickArrowShapeType, DrawContext } from './types';

function buildThickArrowPolygon(points: [number, number, number, number], shaftWidth: number, headLength: number, headWidth: number): number[] {
  const [x1, y1, x2, y2] = points;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const halfShaft = shaftWidth / 2;
  const halfHead = headWidth / 2;
  const shaftLen = Math.max(0, len - headLength);

  // Orthogonal vector (left normal)
  const nx = -uy;
  const ny = ux;

  // Key points along the center line
  const tailX = x1;
  const tailY = y1;
  const shaftEndX = x1 + ux * shaftLen;
  const shaftEndY = y1 + uy * shaftLen;
  const tipX = x2;
  const tipY = y2;

  // Polygon points clockwise starting at tail-left
  const p1x = tailX + nx * halfShaft; // tail-left
  const p1y = tailY + ny * halfShaft;

  const p2x = shaftEndX + nx * halfShaft; // shaft-left near head
  const p2y = shaftEndY + ny * halfShaft;

  const p3x = shaftEndX + nx * halfHead; // head-left base
  const p3y = shaftEndY + ny * halfHead;

  const p4x = tipX; // tip
  const p4y = tipY;

  const p5x = shaftEndX - nx * halfHead; // head-right base
  const p5y = shaftEndY - ny * halfHead;

  const p6x = shaftEndX - nx * halfShaft; // shaft-right near head
  const p6y = shaftEndY - ny * halfShaft;

  const p7x = tailX - nx * halfShaft; // tail-right
  const p7y = tailY - ny * halfShaft;

  return [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y, p7x, p7y];
}

const ThickArrow: React.FC<EditableShapeProps<ThickArrowShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const groupRef = React.useRef<Konva.Group>(null);

  const polyPoints = React.useMemo(() => buildThickArrowPolygon(shape.points, shape.shaftWidth, shape.headLength, shape.headWidth), [shape.points, shape.shaftWidth, shape.headLength, shape.headWidth]);
  const [x1, y1, x2, y2] = shape.points;

  // Geometry helpers
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy; // left normal
  const ny = ux;
  const shaftLen = Math.max(0, len - shape.headLength);
  const baseX = x1 + ux * shaftLen; // head base (shaft end)
  const baseY = y1 + uy * shaftLen;
  const midX = x1 + ux * (shaftLen / 2);
  const midY = y1 + uy * (shaftLen / 2);

  // Use polygon indices to access head corners
  // poly: [p1,p2,p3,tip,p5,p6,p7]
  const poly = polyPoints;
  const p3x = poly[4], p3y = poly[5]; // head-left base corner
  const tipX = poly[6], tipY = poly[7];
  const p5x = poly[8], p5y = poly[9]; // head-right base corner
  const baseCenterX = baseX; // head base center (shaft end)
  const baseCenterY = baseY;

  return (
    <Group
      ref={groupRef}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation || 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: any) => onChange({ x: e.target.x(), y: e.target.y() })}
    >
      <KLine
        points={polyPoints}
        closed
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineJoin="miter"
        lineCap="round"
      />
      {isSelected && (
        <>
          {/* tail anchor */}
          <Circle
            x={x1}
            y={y1}
            radius={6}
            fill="#ffffff"
            stroke="#06b6d4"
            strokeWidth={2}
            draggable
            onMouseDown={(ev: any) => (ev.cancelBubble = true)}
            onTouchStart={(ev: any) => (ev.cancelBubble = true)}
            onDragMove={(e: any) => {
              const g = groupRef.current; if (!g) return;
              const local = g.getRelativePointerPosition(); if (!local) return;
              onChange({ points: [local.x, local.y, x2, y2] });
            }}
            onDragEnd={(e: any) => { e.cancelBubble = true; }}
          />
          {/* head anchor */}
          <Circle
            x={x2}
            y={y2}
            radius={6}
            fill="#ffffff"
            stroke="#06b6d4"
            strokeWidth={2}
            draggable
            onMouseDown={(ev: any) => (ev.cancelBubble = true)}
            onTouchStart={(ev: any) => (ev.cancelBubble = true)}
            onDragMove={(e: any) => {
              const g = groupRef.current; if (!g) return;
              const local = g.getRelativePointerPosition(); if (!local) return;
              onChange({ points: [x1, y1, local.x, local.y] });
            }}
            onDragEnd={(e: any) => { e.cancelBubble = true; }}
          />

          {/* shaft width handle (center of shaft) */}
          <Circle
            x={midX}
            y={midY}
            radius={5}
            fill="#ecfeff"
            stroke="#06b6d4"
            strokeWidth={2}
            draggable
            onMouseDown={(ev: any) => (ev.cancelBubble = true)}
            onTouchStart={(ev: any) => (ev.cancelBubble = true)}
            onDragMove={(e: any) => {
              const g = groupRef.current; if (!g) return;
              const local = g.getRelativePointerPosition(); if (!local) return;
              const vx = local.x - midX;
              const vy = local.y - midY;
              const off = vx * nx + vy * ny; // signed distance along normal
              const newWidth = Math.max(1, Math.abs(off) * 2);
              onChange({ shaftWidth: newWidth } as Partial<ThickArrowShapeType>);
            }}
            onDragEnd={(e: any) => { e.cancelBubble = true; }}
          />

          {/* head handles at base corners (squares): drag adjusts width & length */}
          <Rect
            x={p3x - 4}
            y={p3y - 4}
            width={8}
            height={8}
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth={1.5}
            cornerRadius={1}
            draggable
            onMouseDown={(ev: any) => (ev.cancelBubble = true)}
            onTouchStart={(ev: any) => (ev.cancelBubble = true)}
            onDragMove={(e: any) => {
              const g = groupRef.current; if (!g) return;
              const local = g.getRelativePointerPosition(); if (!local) return;
              const vx = local.x - baseCenterX;
              const vy = local.y - baseCenterY;
              const offN = vx * nx + vy * ny; // adjust only width (perpendicular)
              const minHeadWidth = Math.max(2, shape.shaftWidth);
              const newWidth = Math.max(minHeadWidth, Math.abs(offN) * 2);
              onChange({ headWidth: newWidth } as Partial<ThickArrowShapeType>);
            }}
            onDragEnd={(e: any) => { e.cancelBubble = true; }}
          />
          <Rect
            x={p5x - 4}
            y={p5y - 4}
            width={8}
            height={8}
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth={1.5}
            cornerRadius={1}
            draggable
            onMouseDown={(ev: any) => (ev.cancelBubble = true)}
            onTouchStart={(ev: any) => (ev.cancelBubble = true)}
            onDragMove={(e: any) => {
              const g = groupRef.current; if (!g) return;
              const local = g.getRelativePointerPosition(); if (!local) return;
              const vx = local.x - baseCenterX;
              const vy = local.y - baseCenterY;
              const offN = vx * nx + vy * ny; // adjust only width (perpendicular)
              const minHeadWidth = Math.max(2, shape.shaftWidth);
              const newWidth = Math.max(minHeadWidth, Math.abs(offN) * 2);
              onChange({ headWidth: newWidth } as Partial<ThickArrowShapeType>);
            }}
            onDragEnd={(e: any) => { e.cancelBubble = true; }}
          />

          {/* dedicated head-length handle at base center: drag along axis to change head length */}
          <Circle
            x={baseCenterX}
            y={baseCenterY}
            radius={5}
            fill="#e0f2fe"
            stroke="#0284c7"
            strokeWidth={2}
            draggable
            onMouseDown={(ev: any) => (ev.cancelBubble = true)}
            onTouchStart={(ev: any) => (ev.cancelBubble = true)}
            onDragMove={(e: any) => {
              const g = groupRef.current; if (!g) return;
              const local = g.getRelativePointerPosition(); if (!local) return;
              // project pointer onto the centerline to compute new base position along axis
              const vx = local.x - x1;
              const vy = local.y - y1;
              let t = vx * ux + vy * uy; // distance from tail along axis
              const MIN_HEAD_LEN = 4;
              // clamp t so that head length stays within [MIN_HEAD_LEN, len]
              t = Math.max(0, Math.min(len - MIN_HEAD_LEN, t));
              const newHeadLength = len - t;
              onChange({ headLength: newHeadLength } as Partial<ThickArrowShapeType>);
            }}
            onDragEnd={(e: any) => { e.cancelBubble = true; }}
          />
        </>
      )}
    </Group>
  );
};

export default ThickArrow;

export const ThickArrowModule: ShapeModule<ThickArrowShapeType> = {
  type: 'thick-arrow',
  label: 'Thick Arrow',
  Component: ThickArrow,
  create: (id, x, y, base) => ({
    id,
    type: 'thick-arrow',
    x,
    y,
    rotation: 0,
    fill: '#ffffff',
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
    points: [0, 0, 120, 0],
    shaftWidth: 16,
    headLength: 30,
    headWidth: 34,
  }),
  updateOnDraw: (shape: ThickArrowShapeType, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    return { x: ctx.start.x, y: ctx.start.y, points: [0, 0, dx, dy] };
  },
  isValidAfterDraw: (s) => {
    const [x1, y1, x2, y2] = s.points;
    return Math.hypot(x2 - x1, y2 - y1) >= 3;
  },
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'thick-arrow-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    let pts: any = Array.isArray(raw.points) ? raw.points.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n)) : [];
    if (pts.length !== 4) {
      const dx = Number(raw.dx) || 120;
      const dy = Number(raw.dy) || 0;
      pts = [0, 0, dx, dy];
    }
    const shaftWidth = raw.shaftWidth != null ? Number(raw.shaftWidth) : 16;
    const headLength = raw.headLength != null ? Number(raw.headLength) : 30;
    const headWidth = raw.headWidth != null ? Number(raw.headWidth) : 34;
    return {
      id,
      type: 'thick-arrow',
      x,
      y,
      rotation,
      points: pts as [number, number, number, number],
      shaftWidth,
      headLength,
      headWidth,
      fill: typeof raw.fill === 'string' ? raw.fill : '#ffffff',
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    } as ThickArrowShapeType;
  },
};
