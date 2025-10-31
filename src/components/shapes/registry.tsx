import React from 'react';
import type { AnyShape, LineShape, RectShape } from '../../types/drawing';
import { LineShapeNode } from './SymbolLine';
import { RectShapeNode } from './SymbolRect';

interface ShapeNodeProps {
  shape: AnyShape;
  isDraft?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLineDragEnd?: (payload: { id: string; points: number[] }) => void;
  onLineChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
  onRectDragEnd?: (payload: { id: string; x: number; y: number }) => void;
  onRectChange?: (payload: { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void;
}

// Centralized shape renderer. Register new shapes here.
export const ShapeNode: React.FC<ShapeNodeProps> = ({ shape, isDraft = false, isSelected = false, onSelect, onLineDragEnd, onLineChange, onRectDragEnd, onRectChange }) => {
  if (shape.type === 'line') {
    return (
      <LineShapeNode
        shape={shape as LineShape}
        dashed={isDraft}
        draggable={!isDraft}
        isSelected={isSelected}
        onSelect={onSelect}
        onDragEnd={onLineDragEnd}
        onChange={onLineChange}
      />
    );
  }

  if (shape.type === 'rect') {
    return (
      <RectShapeNode
        shape={shape as RectShape}
        dashed={isDraft}
        draggable={!isDraft}
        isSelected={isSelected}
        onSelect={onSelect}
        onDragEnd={onRectDragEnd}
        onChange={onRectChange}
      />
    );
  }

  // TODO: add other shape renderers (e.g., PathShapeNode) as needed
  return null;
};
