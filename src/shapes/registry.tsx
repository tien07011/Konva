import React from 'react';
import { AnyShape, ShapeModule, ShapeType } from './types';
import { RectangleModule } from './RectangleShape';
import { EllipseModule } from './EllipseShape';
import { LineModule } from './LineShape';
import { ArrowModule } from './ArrowShape';
import { DiamondModule } from './DiamondShape';
import { ThickArrowModule } from './ThickArrowShape';

const modules: Array<ShapeModule<AnyShape>> = [
  RectangleModule as unknown as ShapeModule<AnyShape>,
  EllipseModule as unknown as ShapeModule<AnyShape>,
  LineModule as unknown as ShapeModule<AnyShape>,
  ArrowModule as unknown as ShapeModule<AnyShape>,
  DiamondModule as unknown as ShapeModule<AnyShape>,
  ThickArrowModule as unknown as ShapeModule<AnyShape>,
];

export const shapeRegistry: Record<ShapeType, ShapeModule<AnyShape>> = modules.reduce((acc, m) => {
  return { ...acc, [m.type]: m };
}, {} as Record<ShapeType, ShapeModule<AnyShape>>);

export function renderShape(
  shape: AnyShape,
  isSelected: boolean,
  onSelect: () => void,
  onChange: (attrs: any) => void
) {
  const mod = shapeRegistry[shape.type];
  const Cmp = mod.Component as React.FC<any>;
  return <Cmp key={shape.id} shape={shape as any} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />;
}

export function createShape(type: ShapeType, id: string, x: number, y: number, base: { fill: string; stroke: string; strokeWidth: number }) {
  return shapeRegistry[type].create(id, x, y, base) as AnyShape;
}

export function updateOnDraw(shape: AnyShape, ctx: { start: { x: number; y: number }; current: { x: number; y: number }; shift?: boolean }) {
  const mod = shapeRegistry[shape.type];
  return mod.updateOnDraw(shape as any, ctx);
}

export function isValidAfterDraw(shape: AnyShape) {
  const mod = shapeRegistry[shape.type];
  return mod.isValidAfterDraw ? mod.isValidAfterDraw(shape as any) : true;
}
