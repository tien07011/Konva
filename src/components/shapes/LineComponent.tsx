import React, { useEffect } from 'react';
import { Line } from 'react-konva';
import type { LineShape } from '../../types/drawing';
import { polylineLength } from '../../utils/geometry';

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
  useEffect(() => {
    // Demo: compute polyline length in WASM when points change (no UI change)
    if (shape.points && shape.points.length >= 4) {
      polylineLength(shape.points).then((len) => {
        console.log(`[WASM] polyline length for ${shape.id}:`, len.toFixed(2));
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug(`[WASM] polyline length for ${shape.id}:`, len.toFixed(2));
        }
      });
    }
  }, [shape.id, shape.points]);
  return (
    <Line
      id={shape.id}
      points={shape.points}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      lineCap={shape.lineCap || 'round'}
      lineJoin={shape.lineJoin || 'round'}
      dash={shape.dash}
      closed={!!shape.closed}
      tension={shape.tension ?? 0}
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
