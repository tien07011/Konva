import React from 'react';
import { AnyShape, ShapeModule, ShapeType } from './types';
import { RectangleModule } from './RectangleShape';
import { EllipseModule } from './EllipseShape';
import { LineModule } from './LineShape';
import { ArrowModule } from './ArrowShape';
import { DiamondModule } from './DiamondShape';
import { ThickArrowModule } from './ThickArrowShape';
import { PolygonModule } from './PolygonShape';
import { CurveModule } from './CurveShape';
import { SvgModule } from './SvgShape';
import { PathModule } from './PathShape';

const modules: Array<ShapeModule<AnyShape>> = [
  RectangleModule as unknown as ShapeModule<AnyShape>,
  EllipseModule as unknown as ShapeModule<AnyShape>,
  LineModule as unknown as ShapeModule<AnyShape>,
  ArrowModule as unknown as ShapeModule<AnyShape>,
  DiamondModule as unknown as ShapeModule<AnyShape>,
  ThickArrowModule as unknown as ShapeModule<AnyShape>,
  PolygonModule as unknown as ShapeModule<AnyShape>,
  CurveModule as unknown as ShapeModule<AnyShape>,
  PathModule as unknown as ShapeModule<AnyShape>,
  SvgModule as unknown as ShapeModule<AnyShape>,
];

type RenderableShapeType = Exclude<ShapeType, 'group'>;

export const shapeRegistry: Record<RenderableShapeType, ShapeModule<AnyShape>> = modules.reduce((acc, m) => {
  return { ...acc, [m.type as RenderableShapeType]: m };
}, {} as Record<RenderableShapeType, ShapeModule<AnyShape>>);

export function renderShape(
  shape: AnyShape,
  isSelected: boolean,
  onSelect: (e: any) => void,
  onChange: (attrs: any) => void
) {
  const mod = shapeRegistry[shape.type as RenderableShapeType];
  const Cmp = mod.Component as React.FC<any>;
  return <Cmp key={shape.id} shape={shape as any} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />;
}

export function createShape(type: RenderableShapeType, id: string, x: number, y: number, base: { fill: string; stroke: string; strokeWidth: number }) {
  return shapeRegistry[type].create(id, x, y, base) as AnyShape;
}

export function updateOnDraw(shape: AnyShape, ctx: { start: { x: number; y: number }; current: { x: number; y: number }; shift?: boolean }) {
  const mod = shapeRegistry[shape.type as RenderableShapeType];
  return mod.updateOnDraw(shape as any, ctx);
}

export function isValidAfterDraw(shape: AnyShape) {
  const mod = shapeRegistry[shape.type as RenderableShapeType];
  return mod.isValidAfterDraw ? mod.isValidAfterDraw(shape as any) : true;
}

export function normalizeShape(raw: any, base: { fill: string; stroke: string; strokeWidth: number }): AnyShape | null {
  if (!raw || typeof raw !== 'object') return null;
  let t: any = raw.type;
  // legacy mapping
  if (t === 'circle') t = 'ellipse';
  if (!t || !(t in shapeRegistry)) return null;
  const mod = shapeRegistry[t as RenderableShapeType];
  if (mod.normalize) {
    return mod.normalize(raw, base) as AnyShape;
  }
  return null;
}
