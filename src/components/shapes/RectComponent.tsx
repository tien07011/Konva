import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Rect, Transformer, Group } from 'react-konva';
import type { RectShape } from '../../types/drawing';

interface RectComponentProps {
  shape: RectShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
  onChange?: (next: RectShape) => void;
  interactive?: boolean;
}

export const RectComponent: React.FC<RectComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
  onChange,
  interactive = true,
}) => {
  const rectRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(true);
      if (e.key === 'Alt') setAltPressed(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(false);
      if (e.key === 'Alt') setAltPressed(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(
    (e: any) => {
      if (!onChange || !rectRef.current) return;
      const node = rectRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const nextWidth = Math.max(1, node.width() * scaleX);
      const nextHeight = Math.max(1, node.height() * scaleY);
      const nextRotation = node.rotation();
      const nextX = node.x();
      const nextY = node.y();
      // reset scale after applying
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        ...shape,
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
        rotation: nextRotation,
      });
    },
    [onChange, shape],
  );

  const rotationSnaps = useMemo(() => (shiftPressed ? [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345] : []), [shiftPressed]);

  const boundBoxFunc = useCallback((oldBox: any, newBox: any) => {
    const minSize = 4;
    const bw = Math.max(minSize, newBox.width);
    const bh = Math.max(minSize, newBox.height);
    return { ...newBox, width: bw, height: bh };
  }, []);

  return (
    <Group>
      <Rect
        ref={rectRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.fill}
        rotation={shape.rotation || 0}
        draggable={interactive}
        listening={true}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={handleTransformEnd}
        shadowColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
        shadowOffset={isSelected ? { x: 0, y: 0 } : undefined}
      />
      {interactive && isSelected ? (
        <Transformer
          ref={trRef}
          rotateEnabled
          rotationSnaps={rotationSnaps}
          keepRatio={shiftPressed}
          centeredScaling={altPressed}
          enabledAnchors={['top-left','top-center','top-right','middle-right','bottom-right','bottom-center','bottom-left','middle-left']}
          anchorFill="#fff"
          anchorStroke="#3b82f6"
          anchorStrokeWidth={2}
          rotateAnchorOffset={24}
          borderStroke="#60a5fa"
          borderStrokeWidth={1.5}
          boundBoxFunc={boundBoxFunc}
        />
      ) : null}
    </Group>
  );
};
