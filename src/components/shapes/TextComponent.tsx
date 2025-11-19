import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Group, Text as KText, Transformer } from 'react-konva';
import type { TextShape } from '../../types/drawing';

interface TextComponentProps {
  shape: TextShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
  onChange?: (next: TextShape) => void;
  interactive?: boolean;
}

export const TextComponent: React.FC<TextComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
  onChange,
  interactive = true,
}) => {
  const textRef = useRef<any>(null);
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
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(() => {
    if (!onChange || !textRef.current) return;
    const node = textRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const nextWidth = Math.max(1, (shape.width ?? node.width()) * scaleX);
    const nextHeight = Math.max(1, (shape.height ?? node.height()) * scaleY);
    const nextRotation = node.rotation();
    const nextX = node.x();
    const nextY = node.y();

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
  }, [onChange, shape]);

  const rotationSnaps = useMemo(
    () => (shiftPressed ? [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345] : []),
    [shiftPressed],
  );

  const boundBoxFunc = useCallback((oldBox: any, newBox: any) => {
    const minSize = 4;
    const bw = Math.max(minSize, newBox.width);
    const bh = Math.max(minSize, newBox.height);
    return { ...newBox, width: bw, height: bh };
  }, []);

  return (
    <Group>
      <KText
        ref={textRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily}
        align={shape.align}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
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
