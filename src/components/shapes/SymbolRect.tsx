import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect as KonvaRect, Transformer } from 'react-konva';
import type { RectShape } from '../../types/drawing';

// Renderer for a RectShape in the canvas
export const RectShapeNode: React.FC<{
  shape: RectShape;
  dashed?: boolean;
  draggable?: boolean;
  onDragEnd?: (payload: { id: string; x: number; y: number }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (payload: {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
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
  const rectRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (!trRef.current || !rectRef.current) return;
    if (isSelected && !dashed) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, dashed]);

  return (
    <>
      <KonvaRect
        ref={rectRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
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
          const node = e.target as any; // Konva.Rect
          const nx = node.x();
          const ny = node.y();
          onDragEnd({ id: shape.id, x: nx, y: ny });
        }}
        onTransformEnd={() => {
          if (!onChange || !rectRef.current) return;
          const node = rectRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          let x = node.x();
          let y = node.y();
          let width = node.width() * scaleX;
          let height = node.height() * scaleY;
          // Normalize negative scales (flips)
          if (scaleX < 0) {
            x = x - width;
            width = Math.abs(width);
          }
          if (scaleY < 0) {
            y = y - height;
            height = Math.abs(height);
          }
          width = Math.max(1, width);
          height = Math.max(1, height);
          // reset scaling so future transforms are relative to new size
          node.scaleX(1);
          node.scaleY(1);
          onChange({ id: shape.id, x, y, width, height, rotation: node.rotation() });
        }}
      />
      {!dashed && isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          resizeEnabled
          keepRatio={false}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'top-center',
            'bottom-center',
            'middle-left',
            'middle-right',
          ]}
          boundBoxFunc={(oldBox: any, newBox: any) => {
            if (newBox.width < 1 || newBox.height < 1) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Small icon component to preview a rectangle tool
export const SymbolRect: React.FC<{ size?: number; stroke?: string; strokeWidth?: number }> = ({
  size = 36,
  stroke = '#111827',
  strokeWidth = 4,
}) => {
  const StageAny = Stage as unknown as React.ComponentType<any>;
  const pad = Math.max(3, Math.ceil(strokeWidth / 2) + 3);
  const s = size - pad * 2;
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
      aria-label="Biểu tượng công cụ vẽ hình chữ nhật"
      title="Công cụ: Hình chữ nhật"
    >
          <StageAny width={size} height={size} style={{ display: 'block', borderRadius: 6 }}>
        <Layer>
          <KonvaRect
            x={pad}
            y={pad}
            width={s}
            height={s}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Layer>
          </StageAny>
    </div>
  );
};
