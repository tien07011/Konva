import React from 'react';

export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'diamond' | 'thick-arrow' | 'text';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface RectShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
}

export interface DiamondShape extends BaseShape {
  type: 'diamond';
  width: number; // tip-to-tip horizontal distance
  height: number; // tip-to-tip vertical distance
}

export interface LineShape extends BaseShape {
  type: 'line';
  // Polyline points in local coordinates relative to (x, y)
  // Must be an even-length array: [x0, y0, x1, y1, ..., xn, yn]
  points: number[];
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  // Polyline points in local coordinates relative to (x, y)
  // Must be an even-length array: [x0, y0, x1, y1, ..., xn, yn]
  points: number[];
  pointerLength: number;
  pointerWidth: number;
}

export interface ThickArrowShape extends BaseShape {
  type: 'thick-arrow';
  // start and end in local coordinates relative to (x, y)
  points: [number, number, number, number];
  shaftWidth: number;     // visual shaft thickness
  headLength: number;     // length of the arrow head along direction
  headWidth: number;      // total width of the arrow head at its base
}

export type AnyShape = RectShape | EllipseShape | LineShape | ArrowShape | DiamondShape | ThickArrowShape;

export interface EditableShapeProps<T extends AnyShape> {
  shape: T;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<T>) => void;
}

export type DrawContext = {
  start: { x: number; y: number };
  current: { x: number; y: number };
  shift?: boolean;
};

export interface ShapeModule<T extends AnyShape> {
  type: T['type'];
  label: string;
  Component: React.FC<EditableShapeProps<T>>;
  // Create an initial shape at point (x, y)
  create: (
    id: string,
    x: number,
    y: number,
    base: Pick<BaseShape, 'fill' | 'stroke' | 'strokeWidth'>
  ) => T;
  // Given pointer drag, return a patch to apply to the shape during drawing
  updateOnDraw: (shape: T, ctx: DrawContext) => Partial<T>;
  // Optional validator to accept very small shapes after draw
  isValidAfterDraw?: (shape: T) => boolean;
}
