import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Group, Transformer } from 'react-konva';
import type { CircleShape } from '../../types/drawing';

interface CircleComponentProps {
  shape: CircleShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
  onChange?: (next: CircleShape) => void;
  interactive?: boolean;
}

export const CircleComponent: React.FC<CircleComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
  onChange,
  interactive = true,
}) => {
  const nodeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [altPressed, setAltPressed] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltPressed(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltPressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(() => {
    if (!onChange || !nodeRef.current) return;
    const node = nodeRef.current;
    const scaleX = Math.abs(node.scaleX());
    const scaleY = Math.abs(node.scaleY());
    const nextR = Math.max(1, shape.r * Math.max(scaleX, scaleY));
    const nextX = node.x();
    const nextY = node.y();
    node.scaleX(1);
    node.scaleY(1);
    onChange({ ...shape, cx: nextX, cy: nextY, r: nextR });
  }, [onChange, shape]);

  return (
    <Group>
      <Circle
        ref={nodeRef}
        id={shape.id}
        x={shape.cx}
        y={shape.cy}
        radius={shape.r}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.fill}
        rotation={shape.rotation || 0}
        draggable={interactive}
        listening={interactive}
        onClick={interactive ? onSelect : undefined}
        onTap={interactive ? onSelect : undefined}
        onDragEnd={onDragEnd}
        shadowColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
        shadowOffset={isSelected ? { x: 0, y: 0 } : undefined}
        onTransformEnd={handleTransformEnd}
      />
      {interactive && isSelected ? (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio
          centeredScaling={altPressed}
          enabledAnchors={['top-left','top-right','bottom-right','bottom-left','top-center','bottom-center','middle-left','middle-right']}
          anchorFill="#fff"
          anchorStroke="#3b82f6"
          anchorStrokeWidth={2}
          borderStroke="#60a5fa"
          borderStrokeWidth={1.5}
        />
      ) : null}
    </Group>
  );
};
