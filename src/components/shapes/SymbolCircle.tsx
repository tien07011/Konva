import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Circle as KonvaCircle, Transformer } from 'react-konva';
import type { CircleShape } from '../../types/drawing';

// Renderer for a CircleShape in the canvas
export const CircleShapeNode: React.FC<{
  shape: CircleShape;
  dashed?: boolean;
  draggable?: boolean;
  onDragEnd?: (payload: { id: string; cx: number; cy: number }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (payload: {
    id: string;
    cx?: number;
    cy?: number;
    r?: number;
    rotation?: number;
  }) => void;
}> = ({
  shape,
  dashed = false,
  draggable = false,
  onDragEnd,
  isSelected = false,
  onSelect,
  onChange,
}) => {
  const circleRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (!trRef.current || !circleRef.current) return;
    if (isSelected && !dashed) {
      trRef.current.nodes([circleRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, dashed]);

  return (
    <>
      <KonvaCircle
        ref={circleRef}
        x={shape.cx}
        y={shape.cy}
        radius={shape.r}
        rotation={shape.rotation || 0}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        dash={dashed ? [8, 6] : undefined}
        draggable={!dashed && draggable}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        onMouseDown={(e: any) => {
          e.cancelBubble = true;
        }}
        onTouchStart={(e: any) => {
          e.cancelBubble = true;
        }}
        onClick={() => onSelect?.(shape.id)}
        onTap={() => onSelect?.(shape.id)}
        onDragEnd={(e: any) => {
          if (!onDragEnd) return;
          const node = e.target as any; // Konva.Circle
          const nx = node.x();
          const ny = node.y();
          onDragEnd({ id: shape.id, cx: nx, cy: ny });
        }}
        onTransformEnd={() => {
          if (!onChange || !circleRef.current) return;
          const node = circleRef.current;
          const scaleX = node.scaleX();
          // assume uniform scaling -> radius scales by scaleX
          let r = node.radius() * scaleX;
          if (scaleX < 0) r = Math.abs(r);
          r = Math.max(1, r);
          node.scaleX(1);
          node.scaleY(1);
          onChange({ id: shape.id, r, rotation: node.rotation() });
        }}
      />
      {!dashed && isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          resizeEnabled
          keepRatio
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox: any, newBox: any) => {
            if (newBox.width < 2 || newBox.height < 2) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Icon preview for circle tool
export const SymbolCircle: React.FC<{ size?: number; stroke?: string; strokeWidth?: number }> = ({
  size = 36,
  stroke = '#111827',
  strokeWidth = 4,
}) => {
  const StageAny = Stage as unknown as React.ComponentType<any>;
  const pad = Math.max(4, Math.ceil(strokeWidth / 2) + 4);
  const r = (size - pad * 2) / 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        background: '#ffffff',
      }}
      aria-label="Biểu tượng công cụ: Hình tròn"
      title="Công cụ: Hình tròn"
    >
      <StageAny width={size} height={size} style={{ display: 'block', borderRadius: 6 }}>
        <Layer>
          <KonvaCircle
            x={size / 2}
            y={size / 2}
            radius={r}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Layer>
      </StageAny>
    </div>
  );
};
