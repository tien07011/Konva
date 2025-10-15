import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, LineShape as LineShapeType, ShapeModule, DrawContext } from './types';

const LineShape: React.FC<EditableShapeProps<LineShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Line>(null);
  const groupRef = React.useRef<Konva.Group>(null);

  const points = shape.points;
  const anchors = React.useMemo(() => {
    const arr: Array<{ x: number; y: number; i: number }> = [];
    for (let i = 0; i < points.length; i += 2) {
      arr.push({ x: points[i], y: points[i + 1], i });
    }
    return arr;
  }, [points]);

  const updatePoint = (index: number, x: number, y: number) => {
    const next = points.slice();
    next[index] = x;
    next[index + 1] = y;
    onChange({ points: next } as Partial<LineShapeType>);
  };

  const insertPointAt = (idxAfter: number, x: number, y: number) => {
    // insert after point at idxAfter (point index, not array index)
    const arrIdx = idxAfter * 2 + 2; // between p(idxAfter) and p(idxAfter+1)
    const next = points.slice();
    next.splice(arrIdx, 0, x, y);
    onChange({ points: next } as Partial<LineShapeType>);
  };

  const removePoint = (pointIndex: number) => {
    // Keep at least two points
    if (points.length <= 4) return;
    const arrIdx = pointIndex * 2;
    const next = points.slice();
    next.splice(arrIdx, 2);
    onChange({ points: next } as Partial<LineShapeType>);
  };

  const handleMidpointDrag = (betweenIndex: number, e: any) => {
    const g = groupRef.current;
    if (!g) return;
    const local = g.getRelativePointerPosition();
    if (!local) return;
    // live preview by inserting (if not inserted yet) or moving temporary point
    // Simplify: just update cursor of a temp state not stored; we will insert on dragEnd
  };

  return (
    <>
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
        <Line
          ref={shapeRef}
          points={points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
        />
        {isSelected && (
          <>
            {anchors.map((a, idx) => (
              <Circle
                key={`v-${idx}`}
                x={a.x}
                y={a.y}
                radius={6}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={2}
                draggable
                onMouseDown={(ev: any) => (ev.cancelBubble = true)}
                onTouchStart={(ev: any) => (ev.cancelBubble = true)}
                onDblClick={() => removePoint(idx)}
                onDragMove={(e: any) => {
                  const g = groupRef.current;
                  if (!g) return;
                  const local = g.getRelativePointerPosition();
                  if (!local) return;
                  updatePoint(idx * 2, local.x, local.y);
                }}
                onDragEnd={(e: any) => { e.cancelBubble = true; }}
              />
            ))}
            {/* midpoints for insertion */}
            {anchors.slice(0, -1).map((a, idx) => {
              const b = anchors[idx + 1];
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              return (
                <Circle
                  key={`m-${idx}`}
                  x={mx}
                  y={my}
                  radius={5}
                  fill="#eff6ff"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  draggable
                  onMouseDown={(ev: any) => (ev.cancelBubble = true)}
                  onTouchStart={(ev: any) => (ev.cancelBubble = true)}
                  onDragMove={(e: any) => handleMidpointDrag(idx, e)}
                  onDragEnd={(e: any) => {
                    const g = groupRef.current; if (!g) return;
                    const local = g.getRelativePointerPosition(); if (!local) return;
                    insertPointAt(idx, local.x, local.y);
                    e.cancelBubble = true;
                  }}
                  onClick={(e: any) => {
                    // single click to insert at midpoint
                    insertPointAt(idx, mx, my);
                    e.cancelBubble = true;
                  }}
                />
              );
            })}
          </>
        )}
      </Group>
    </>
  );
};

export default LineShape;

export const LineModule: ShapeModule<LineShapeType> = {
  type: 'line',
  label: 'Line',
  Component: LineShape,
  create: (id, x, y, base) => ({
    id,
    type: 'line',
    x,
    y,
    rotation: 0,
    fill: 'transparent',
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
    points: [0, 0, 1, 1],
  }),
  updateOnDraw: (shape: LineShapeType, ctx: DrawContext) => {
    // During initial drag (legacy), keep a simple two-point line
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    return { x: ctx.start.x, y: ctx.start.y, points: [0, 0, dx, dy] };
  },
  isValidAfterDraw: (s) => {
    if (s.points.length < 4) return false;
    // if two points, check length
    if (s.points.length === 4) {
      const dx = s.points[2] - s.points[0];
      const dy = s.points[3] - s.points[1];
      return Math.hypot(dx, dy) >= 3;
    }
    return true;
  },
};
