import React from 'react';
import { Path } from 'react-konva';
import type { QuadraticCurveShape, CubicCurveShape } from '../../types/drawing';

interface CurveComponentProps {
  shape: QuadraticCurveShape | CubicCurveShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
}

export const CurveComponent: React.FC<CurveComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
}) => {
  let d = '';

  if (shape.type === 'qcurve') {
    const [x0, y0, cx, cy, x1, y1] = shape.points;
    d = `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;
  } else if (shape.type === 'ccurve') {
    const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = shape.points;
    d = `M ${x0} ${y0} C ${cx1} ${cy1} ${cx2} ${cy2} ${x1} ${y1}`;
  }

  return (
    <Path
      data={d}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      fill={shape.fill}
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
