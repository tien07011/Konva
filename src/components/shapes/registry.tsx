import React from 'react';
import type { AnyShape, LineShape } from '../../types/drawing';
import { LineShapeNode } from './SymbolLine';

interface ShapeNodeProps {
  shape: AnyShape;
  isDraft?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLineDragEnd?: (payload: { id: string; points: number[] }) => void;
  onLineChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
}

// Centralized shape renderer. Register new shapes here.
export const ShapeNode: React.FC<ShapeNodeProps> = ({ shape, isDraft = false, isSelected = false, onSelect, onLineDragEnd, onLineChange }) => {
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

  // TODO: add other shape renderers (e.g., PathShapeNode) as needed
  return null;
};
