import React from 'react';
import { Line } from 'react-konva';
import type { LineShape } from '../../types/drawing';

interface LineComponentProps {
  shape: LineShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const LineComponent: React.FC<LineComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
}) => {
  return (
    <Line
      id={shape.id}
      points={shape.points}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      lineCap={shape.lineCap || 'round'}
      lineJoin={shape.lineJoin || 'round'}
      dash={shape.dash}
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
