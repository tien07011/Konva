import React from 'react';
import { Rect } from 'react-konva';
import type { RectShape } from '../../types/drawing';

interface RectComponentProps {
  shape: RectShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const RectComponent: React.FC<RectComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
}) => {
  return (
    <Rect
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      fill={shape.fill}
      rotation={shape.rotation || 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      shadowColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : undefined}
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.8 : 0}
      shadowOffset={isSelected ? { x: 0, y: 0 } : undefined}
    />
  );
};
