import React from 'react';
import type { QuadraticCurveShape, CubicCurveShape } from '../../types/drawing';

interface CurveComponentProps {
  shape: QuadraticCurveShape | CubicCurveShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const CurveComponent: React.FC<CurveComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
}) => {
  // TODO: Implement curve rendering with react-konva
  return null;
};
