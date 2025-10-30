import React from 'react';
import { Group, Path as KPath, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, PathSvgShape, ShapeModule, DrawContext } from './types';

const PathShape: React.FC<EditableShapeProps<PathSvgShape>> = ({ shape, isSelected, onSelect, onChange }) => {
  const groupRef = React.useRef<Konva.Group>(null);
  const pathRef = React.useRef<Konva.Path>(null);
  const trRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
        <KPath
          ref={pathRef}
          data={shape.d}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            rotateEnabled
            enabledAnchors={[]}
            onTransformEnd={() => {
              const g = groupRef.current!;
              onChange({ x: g.x(), y: g.y(), rotation: g.rotation() });
            }}
          />
        )}
      </Group>
    </>
  );
};

export default PathShape;

export const PathModule: ShapeModule<PathSvgShape> = {
  type: 'path',
  label: 'Path',
  Component: PathShape,
  create: (id, x, y, base) => ({
    id,
    type: 'path',
    x,
    y,
    rotation: 0,
    // default: simple square 100x100 from origin
    d: 'M0 0 L100 0 L100 100 L0 100 Z',
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
  }),
  updateOnDraw: (shape: PathSvgShape, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const nx = Math.min(ctx.start.x, ctx.current.x);
    const ny = Math.min(ctx.start.y, ctx.current.y);
    const w = Math.abs(dx);
    const h = Math.abs(dy);
    const d = `M0 0 L${w} 0 L${w} ${h} L0 ${h} Z`;
    return { x: nx, y: ny, d };
  },
  isValidAfterDraw: (s) => !!s.d && s.d.trim().length > 0,
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'path-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    const d = typeof raw.d === 'string' ? raw.d : '';
    if (!d.trim()) return null;
    return {
      id,
      type: 'path',
      x,
      y,
      rotation,
      d,
      fill: typeof raw.fill === 'string' ? raw.fill : base.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    } as PathSvgShape;
  },
};
