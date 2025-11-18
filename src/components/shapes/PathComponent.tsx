import React from 'react';
import type { PathShape } from '../../types/drawing';

interface PathComponentProps {
  shape: PathShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const PathComponent: React.FC<PathComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  // TODO: Implement path rendering with react-konva
  return null;
};
