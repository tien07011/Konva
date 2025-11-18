import React from 'react';
import type { RectShape } from '../../types/drawing';

interface RectComponentProps {
  shape: RectShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const RectComponent: React.FC<RectComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  // TODO: Implement rectangle rendering with react-konva
  return null;
};
