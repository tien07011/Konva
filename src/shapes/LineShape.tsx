import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, LineShape as LineShapeType, ShapeModule, DrawContext } from './types';

const LineShape: React.FC<EditableShapeProps<LineShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Line>(null);
  const groupRef = React.useRef<Konva.Group>(null);

  const [x1, y1, x2, y2] = shape.points;

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
          points={[x1, y1, x2, y2]}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
        />
        {isSelected && (
          <>
            {/* Handle for start point (local coordinates) */}
            <Circle
              x={x1}
              y={y1}
              radius={6}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={2}
              draggable
              onMouseDown={(ev: any) => (ev.cancelBubble = true)}
              onTouchStart={(ev: any) => (ev.cancelBubble = true)}
              onDragMove={(e: any) => {
                const g = groupRef.current;
                if (!g) return;
                const local = g.getRelativePointerPosition();
                if (!local) return;
                onChange({ points: [local.x, local.y, x2, y2] });
              }}
              onDragEnd={(e: any) => { e.cancelBubble = true; }}
            />
            {/* Handle for end point (local coordinates) */}
            <Circle
              x={x2}
              y={y2}
              radius={6}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={2}
              draggable
              onMouseDown={(ev: any) => (ev.cancelBubble = true)}
              onTouchStart={(ev: any) => (ev.cancelBubble = true)}
              onDragMove={(e: any) => {
                const g = groupRef.current;
                if (!g) return;
                const local = g.getRelativePointerPosition();
                if (!local) return;
                onChange({ points: [x1, y1, local.x, local.y] });
              }}
              onDragEnd={(e: any) => { e.cancelBubble = true; }}
            />
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
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    // keep origin at start point
    return { x: ctx.start.x, y: ctx.start.y, points: [0, 0, dx, dy] };
  },
  isValidAfterDraw: (s) => {
    const [ , , dx, dy ] = s.points;
    return Math.hypot(dx, dy) >= 3;
  },
};
