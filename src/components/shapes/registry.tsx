import React from 'react';
import type { AnyShape, LineShape } from '../../types/drawing';
import { LineShapeNode } from './SymbolLine';

interface ShapeNodeProps {
  shape: AnyShape;
  isDraft?: boolean;
  onLineDragEnd?: (payload: { id: string; points: number[] }) => void;
}

// Centralized shape renderer. Register new shapes here.
export const ShapeNode: React.FC<ShapeNodeProps> = ({ shape, isDraft = false, onLineDragEnd }) => {
  if (shape.type === 'line') {
    return (
      <LineShapeNode
        shape={shape as LineShape}
        dashed={isDraft}
        draggable={!isDraft}
        onDragEnd={onLineDragEnd}
      />
    );
  }

  // TODO: add other shape renderers (e.g., PathShapeNode) as needed
  return null;
};
