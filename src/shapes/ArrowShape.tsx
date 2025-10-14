import React from 'react';
import { Arrow as KArrow, Circle, Group } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, ArrowShape as ArrowShapeType, ShapeModule, DrawContext } from './types';

const ArrowShape: React.FC<EditableShapeProps<ArrowShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Arrow>(null);
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
        <KArrow
          ref={shapeRef}
          points={[x1, y1, x2, y2]}
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
            {/* Handle for tail (start) - local */}
            <Circle
              x={x1}
              y={y1}
              radius={6}
              fill="#ffffff"
              stroke="#dc2626"
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
            {/* Handle for head (end) - local */}
            <Circle
              x={x2}
              y={y2}
              radius={6}
              fill="#ffffff"
              stroke="#dc2626"
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
    points: [0, 0, 1, 1],
  }),
  updateOnDraw: (shape: ArrowShapeType, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    return { x: ctx.start.x, y: ctx.start.y, points: [0, 0, dx, dy] };
  },
  isValidAfterDraw: (s) => {
    const [ , , dx, dy ] = s.points;
    return Math.hypot(dx, dy) >= 3;
  },
};
