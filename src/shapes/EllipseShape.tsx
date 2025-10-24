import React from 'react';
import { Ellipse as KEllipse, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, EllipseShape as EllipseShapeType, ShapeModule, DrawContext } from './types';

const EllipseShape: React.FC<EditableShapeProps<EllipseShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Ellipse>(null);
  const trRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KEllipse
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        radiusX={shape.radiusX}
        radiusY={shape.radiusY}
        rotation={shape.rotation || 0}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e: any) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            radiusX: Math.max(2, node.radiusX() * scaleX),
            radiusY: Math.max(2, node.radiusY() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-left',
            'middle-right',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]}
        />
      )}
    </>
  );
};

export default EllipseShape;

export const EllipseModule: ShapeModule<EllipseShapeType> = {
  type: 'ellipse',
  label: 'Ellipse',
  Component: EllipseShape,
  create: (id, x, y, base) => ({
    id,
    type: 'ellipse',
    x,
    y,
    radiusX: 40,
    radiusY: 30,
    rotation: 0,
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
  }),
  updateOnDraw: (shape: EllipseShapeType, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const cx = ctx.start.x + dx / 2;
    const cy = ctx.start.y + dy / 2;
    const rx = Math.abs(dx) / 2;
    const ry = Math.abs(dy) / 2;
    return { x: cx, y: cy, radiusX: Math.max(1, rx), radiusY: Math.max(1, ry) };
  },
  isValidAfterDraw: (s) => s.radiusX >= 3 && s.radiusY >= 3,
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'ellipse-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    // support legacy 'radius' or explicit radiusX/Y
    const rX = raw.radiusX != null ? Number(raw.radiusX) : Number(raw.radius) || 0;
    const rY = raw.radiusY != null ? Number(raw.radiusY) : Number(raw.radius) || 0;
    if (rX <= 0 || rY <= 0) return null;
    return {
      id,
      type: 'ellipse',
      x,
      y,
      rotation,
      radiusX: rX,
      radiusY: rY,
      fill: typeof raw.fill === 'string' ? raw.fill : base.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    };
  },
};
