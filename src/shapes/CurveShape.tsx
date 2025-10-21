import React from 'react';
import { Line as KLine, Circle, Group } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, CurveShape as CurveShapeType, ShapeModule, DrawContext } from './types';

const CurveShape: React.FC<EditableShapeProps<CurveShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const groupRef = React.useRef<Konva.Group>(null);

  const points = shape.points;
  const vertices = React.useMemo(() => {
    const arr: Array<{ x: number; y: number; i: number }> = [];
    for (let i = 0; i < points.length; i += 2) arr.push({ x: points[i], y: points[i + 1], i });
    return arr;
  }, [points]);

  const updateVertex = (pointIndex: number, x: number, y: number) => {
    const next = points.slice();
    next[pointIndex * 2] = x;
    next[pointIndex * 2 + 1] = y;
    onChange({ points: next } as Partial<CurveShapeType>);
  };

  const insertVertexAt = (idxAfter: number, x: number, y: number) => {
    const arrIdx = idxAfter * 2 + 2;
    const next = points.slice();
    next.splice(arrIdx, 0, x, y);
    onChange({ points: next } as Partial<CurveShapeType>);
  };

  const removeVertex = (pointIndex: number) => {
    if (points.length <= 4) return; // keep at least two points
    const arrIdx = pointIndex * 2;
    const next = points.slice();
    next.splice(arrIdx, 2);
    onChange({ points: next } as Partial<CurveShapeType>);
  };

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
        points={points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={shape.tension}
      />
      {isSelected && (
        <>
          {vertices.map((v, idx) => (
            <Circle
              key={`v-${idx}`}
              x={v.x}
              y={v.y}
              radius={6}
              fill="#ffffff"
              stroke="#7c3aed"
              strokeWidth={2}
              draggable
              onMouseDown={(ev: any) => (ev.cancelBubble = true)}
              onTouchStart={(ev: any) => (ev.cancelBubble = true)}
              onDblClick={() => removeVertex(idx)}
              onDragMove={(e: any) => {
                const g = groupRef.current; if (!g) return;
                const local = g.getRelativePointerPosition(); if (!local) return;
                updateVertex(idx, local.x, local.y);
              }}
              onDragEnd={(e: any) => { e.cancelBubble = true; }}
            />
          ))}
          {/* midpoints for insertion */}
          {vertices.slice(0, -1).map((a, idx) => {
            const b = vertices[idx + 1];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <Circle
                key={`m-${idx}`}
                x={mx}
                y={my}
                radius={5}
                fill="#f5f3ff"
                stroke="#c4b5fd"
                strokeWidth={2}
                draggable
                onMouseDown={(ev: any) => (ev.cancelBubble = true)}
                onTouchStart={(ev: any) => (ev.cancelBubble = true)}
                onDragEnd={(e: any) => {
                  const g = groupRef.current; if (!g) return;
                  const local = g.getRelativePointerPosition(); if (!local) return;
                  insertVertexAt(idx, local.x, local.y);
                  e.cancelBubble = true;
                }}
                onClick={(e: any) => {
                  insertVertexAt(idx, mx, my);
                  e.cancelBubble = true;
                }}
              />
            );
          })}
        </>
      )}
    </Group>
  );
};

export default CurveShape;

export const CurveModule: ShapeModule<CurveShapeType> = {
  type: 'curve',
  label: 'Curve',
  Component: CurveShape,
  create: (id, x, y, base) => ({
    id,
    type: 'curve',
    x,
    y,
    rotation: 0,
    fill: 'transparent',
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
    points: [0, 0, 60, 0, 120, 0],
    tension: 0.5,
  }),
  updateOnDraw: (shape: CurveShapeType, ctx: DrawContext) => {
    // During initial draw: create a 3-point polyline from drag start to current with a midpoint
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const midx = dx / 2;
    const midy = 0; // keep simple; could curve upwards with shift
    return { x: ctx.start.x, y: ctx.start.y, points: [0, 0, midx, midy, dx, dy] };
  },
  isValidAfterDraw: (s) => (s.points?.length ?? 0) >= 4,
};
