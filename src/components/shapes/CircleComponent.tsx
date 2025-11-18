import React from 'react';
import type { CircleShape } from '../../types/drawing';

interface CircleComponentProps {
  shape: CircleShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const CircleComponent: React.FC<CircleComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  // TODO: Implement circle rendering with react-konva
  return null;
};
