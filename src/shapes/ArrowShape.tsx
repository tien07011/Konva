import React from 'react';
import { Arrow as KArrow, Circle, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, ArrowShape as ArrowShapeType, ShapeModule, DrawContext } from './types';

const ArrowShape: React.FC<EditableShapeProps<ArrowShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Arrow>(null);
  const groupRef = React.useRef<Konva.Group>(null);
  const trRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const points = shape.points;
  const anchors = React.useMemo(() => {
    const arr: Array<{ x: number; y: number; i: number }> = [];
    for (let i = 0; i < points.length; i += 2) {
      arr.push({ x: points[i], y: points[i + 1], i });
    }
    return arr;
  }, [points]);

  const updatePoint = (pointIndex: number, x: number, y: number) => {
    const next = points.slice();
    const arrIdx = pointIndex * 2;
    next[arrIdx] = x;
    next[arrIdx + 1] = y;
    onChange({ points: next } as Partial<ArrowShapeType>);
  };

  const insertPointAt = (idxAfter: number, x: number, y: number) => {
    // insert after point at idxAfter (point index, not array index)
    const arrIdx = idxAfter * 2 + 2; // between p(idxAfter) and p(idxAfter+1)
    const next = points.slice();
    next.splice(arrIdx, 0, x, y);
    onChange({ points: next } as Partial<ArrowShapeType>);
  };

  const removePoint = (pointIndex: number) => {
    // Keep at least two points
    if (points.length <= 4) return;
    const arrIdx = pointIndex * 2;
    const next = points.slice();
    next.splice(arrIdx, 2);
    onChange({ points: next } as Partial<ArrowShapeType>);
  };

  const handleMidpointDrag = (betweenIndex: number, e: any) => {
    const g = groupRef.current;
    if (!g) return;
    const local = g.getRelativePointerPosition();
    if (!local) return;
    // live preview could be added; keep simple and insert on end
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
        <KArrow
          ref={shapeRef}
          points={points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill}
          pointerLength={shape.pointerLength}
          pointerWidth={shape.pointerWidth}
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
                stroke="#dc2626"
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
                  updatePoint(idx, local.x, local.y);
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
                  fill="#fff7ed"
                  stroke="#fdba74"
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
                    insertPointAt(idx, mx, my);
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
                onChange({ x: g.x(), y: g.y(), rotation: g.rotation() } as Partial<ArrowShapeType>);
              }}
            />
          </>
        )}
      </Group>
    </>
  );
};

export default ArrowShape;

export const ArrowModule: ShapeModule<ArrowShapeType> = {
  type: 'arrow',
  label: 'Arrow',
  Component: ArrowShape,
  create: (id, x, y, base) => ({
    id,
    type: 'arrow',
    x,
    y,
    rotation: 0,
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
    pointerLength: 14,
    pointerWidth: 12,
    points: [0, 0, 120, 0],
  }),
  updateOnDraw: (shape: ArrowShapeType, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    return { x: ctx.start.x, y: ctx.start.y, points: [0, 0, dx, dy] };
  },
  isValidAfterDraw: (s) => {
    if (s.points.length < 4) return false;
    if (s.points.length === 4) {
      const dx = s.points[2] - s.points[0];
      const dy = s.points[3] - s.points[1];
      return Math.hypot(dx, dy) >= 3;
    }
    return true;
  },
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'arrow-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    let pts: number[] = [];
    if (Array.isArray(raw.points)) {
      pts = raw.points.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n));
    } else if (raw.dx != null || raw.dy != null) {
      pts = [0, 0, Number(raw.dx) || 0, Number(raw.dy) || 0];
    }
    if (pts.length < 4 || pts.length % 2 !== 0) {
      pts = [0, 0, 120, 0];
    }
    const pointerLength = raw.pointerLength != null ? Number(raw.pointerLength) : 14;
    const pointerWidth = raw.pointerWidth != null ? Number(raw.pointerWidth) : 12;
    return {
      id,
      type: 'arrow',
      x,
      y,
      rotation,
      points: pts,
      pointerLength,
      pointerWidth,
      fill: typeof raw.fill === 'string' ? raw.fill : base.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    } as ArrowShapeType;
  },
};
