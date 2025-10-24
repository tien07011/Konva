import React from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, RectShape, ShapeModule, DrawContext } from './types';

const RectangleShape: React.FC<EditableShapeProps<RectShape>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Rect>(null);
  const trRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
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
        onTransformEnd={(/* e: any */) => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          // reset scale to 1 after applying
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {/* No custom center handle to match requirement: 8 resize points + 1 rotate only */}
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

export default RectangleShape;

export const RectangleModule: ShapeModule<RectShape> = {
  type: 'rectangle',
  label: 'Rectangle',
  Component: RectangleShape,
  create: (id, x, y, base) => ({
    id,
    type: 'rectangle',
    x,
    y,
    width: 100,
    height: 60,
    rotation: 0,
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
  }),
  updateOnDraw: (shape: RectShape, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const nx = Math.min(ctx.start.x, ctx.current.x);
    const ny = Math.min(ctx.start.y, ctx.current.y);
    return { x: nx, y: ny, width: absDx, height: absDy };
  },
  isValidAfterDraw: (s) => s.width >= 3 && s.height >= 3,
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'rect-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    const width = Number(raw.width) || 0;
    const height = Number(raw.height) || 0;
    if (width <= 0 || height <= 0) return null;
    return {
      id,
      type: 'rectangle',
      x,
      y,
      rotation,
      width,
      height,
      fill: typeof raw.fill === 'string' ? raw.fill : base.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    };
  },
};
