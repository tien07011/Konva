import React from 'react';
import { Line as KLine, Circle, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, PolygonShape as PolygonShapeType, ShapeModule, DrawContext } from './types';

const PolygonShape: React.FC<EditableShapeProps<PolygonShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const groupRef = React.useRef<Konva.Group>(null);
  const trRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
    onChange({ points: next } as Partial<PolygonShapeType>);
  };

  const insertVertexAt = (idxAfter: number, x: number, y: number) => {
    const arrIdx = idxAfter * 2 + 2;
    const next = points.slice();
    next.splice(arrIdx, 0, x, y);
    onChange({ points: next } as Partial<PolygonShapeType>);
  };

  const removeVertex = (pointIndex: number) => {
    if (points.length <= 6) return; // keep at least triangle
    const arrIdx = pointIndex * 2;
    const next = points.slice();
    next.splice(arrIdx, 2);
    onChange({ points: next } as Partial<PolygonShapeType>);
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
        closed
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineJoin="round"
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
              stroke="#16a34a"
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
          {/* midpoints for insertion (between consecutive vertices; close last->first) */}
          {vertices.map((a, idx) => {
            const b = vertices[(idx + 1) % vertices.length];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <Circle
                key={`m-${idx}`}
                x={mx}
                y={my}
                radius={5}
                fill="#ecfdf5"
                stroke="#86efac"
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
          <Transformer
            ref={trRef}
            rotateEnabled
            enabledAnchors={[]}
            onTransformEnd={() => {
              const g = groupRef.current!;
              onChange({ x: g.x(), y: g.y(), rotation: g.rotation() } as Partial<PolygonShapeType>);
            }}
          />
        </>
      )}
    </Group>
  );
};

export default PolygonShape;

export const PolygonModule: ShapeModule<PolygonShapeType> = {
  type: 'polygon',
  label: 'Polygon',
  Component: PolygonShape,
  create: (id, x, y, base) => ({
    id,
    type: 'polygon',
    x,
    y,
    rotation: 0,
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
    // Default to a simple triangle
    points: [0, -40, 35, 20, -35, 20],
  }),
  updateOnDraw: (shape: PolygonShapeType, ctx: DrawContext) => {
    // For drawing, create a rectangle-like polygon from drag box
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const x0 = 0, y0 = 0;
    const x1 = dx, y1 = 0;
    const x2 = dx, y2 = dy;
    const x3 = 0, y3 = dy;
    return { x: ctx.start.x, y: ctx.start.y, points: [x0, y0, x1, y1, x2, y2, x3, y3] };
  },
  isValidAfterDraw: (s) => s.points.length >= 6,
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'polygon-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    let pts: number[] = [];
    if (Array.isArray(raw.points)) {
      pts = raw.points.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n));
    }
    if (pts.length < 6 || pts.length % 2 !== 0) {
      pts = [0, -40, 35, 20, -35, 20];
    }
    return {
      id,
      type: 'polygon',
      x,
      y,
      rotation,
      points: pts,
      fill: typeof raw.fill === 'string' ? raw.fill : base.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    } as PolygonShapeType;
  },
};
