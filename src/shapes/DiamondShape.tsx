import React from 'react';
import { Line as KLine, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, DiamondShape as DiamondShapeType, ShapeModule, DrawContext } from './types';

// Diamond rendered as a closed line (polygon) with 4 points:
// points order (local): left -> top -> right -> bottom -> left
function diamondPoints(width: number, height: number): number[] {
  const w2 = width / 2;
  const h2 = height / 2;
  return [
    -w2, 0,
    0, -h2,
    w2, 0,
    0, h2,
    -w2, 0,
  ];
}

const DiamondShape: React.FC<EditableShapeProps<DiamondShapeType>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Line>(null);
  const trRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KLine
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation || 0}
        points={diamondPoints(shape.width, shape.height)}
        closed
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
            width: Math.max(5, shape.width * scaleX),
            height: Math.max(5, shape.height * scaleY),
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

export default DiamondShape;

export const DiamondModule: ShapeModule<DiamondShapeType> = {
  type: 'diamond',
  label: 'Diamond',
  Component: DiamondShape,
  create: (id, x, y, base) => ({
    id,
    type: 'diamond',
    x,
    y,
    width: 100,
    height: 100,
    rotation: 0,
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
  }),
  updateOnDraw: (shape: DiamondShapeType, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const nx = Math.min(ctx.start.x, ctx.current.x) + Math.abs(dx) / 2;
    const ny = Math.min(ctx.start.y, ctx.current.y) + Math.abs(dy) / 2;
    return { x: nx, y: ny, width: Math.abs(dx), height: Math.abs(dy) };
  },
  isValidAfterDraw: (s) => s.width >= 3 && s.height >= 3,
};
