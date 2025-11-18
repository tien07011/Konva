import React from 'react';
import { Circle } from 'react-konva';
import type { CircleShape } from '../../types/drawing';

interface CircleComponentProps {
  shape: CircleShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const CircleComponent: React.FC<CircleComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
}) => {
  return (
    <Circle
      id={shape.id}
      x={shape.cx}
      y={shape.cy}
      radius={shape.r}
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
