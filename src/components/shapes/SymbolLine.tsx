import React from 'react';
import { Stage, Layer, Line as KonvaLine, Circle } from 'react-konva';
import type { LineShape } from '../../types/drawing';

// Renderer for a LineShape in the canvas
export const LineShapeNode: React.FC<{
  shape: LineShape;
  dashed?: boolean;
  draggable?: boolean;
  onDragEnd?: (payload: { id: string; points: number[] }) => void;
}>
  = ({ shape, dashed = false, draggable = false, onDragEnd }) => {
  return (
    <>
      <KonvaLine
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap="round"
        lineJoin="round"
        dash={dashed ? [8, 6] : undefined}
        draggable={!dashed && draggable}
        onMouseDown={(e: any) => {
          // avoid triggering Stage's onMouseDown (which starts drafting)
          e.cancelBubble = true;
        }}
        onTouchStart={(e: any) => {
          e.cancelBubble = true;
        }}
        onDragEnd={(e) => {
          if (!onDragEnd) return;
          const node = e.target as any; // Konva.Line
          const pos = node.position();
          // translate absolute points by node's drag offset
          const next: number[] = [];
          for (let i = 0; i < shape.points.length; i += 2) {
            next.push(shape.points[i] + pos.x, shape.points[i + 1] + pos.y);
          }
          // reset node offset to avoid visual double-transform; state update will re-render
          node.position({ x: 0, y: 0 });
          onDragEnd({ id: shape.id, points: next });
        }}
      />

      {/* Endpoint handles (only for non-draft shapes) */}
      {!dashed && (
        <>
          {/* start point handle */}
          <Circle
            x={shape.points[0]}
            y={shape.points[1]}
            radius={6}
            fill="#fff"
            stroke={shape.stroke}
            strokeWidth={2}
            draggable
            onMouseDown={(e: any) => {
              e.cancelBubble = true;
            }}
            onTouchStart={(e: any) => {
              e.cancelBubble = true;
            }}
            onDragEnd={(e: any) => {
              if (!onDragEnd) return;
              const node = e.target as any;
              const { x, y } = node.position();
              const next = [x, y, shape.points[2], shape.points[3]];
              onDragEnd({ id: shape.id, points: next });
            }}
          />
          {/* end point handle */}
          <Circle
            x={shape.points[2]}
            y={shape.points[3]}
            radius={6}
            fill="#fff"
            stroke={shape.stroke}
            strokeWidth={2}
            draggable
            onMouseDown={(e: any) => {
              e.cancelBubble = true;
            }}
            onTouchStart={(e: any) => {
              e.cancelBubble = true;
            }}
            onDragEnd={(e: any) => {
              if (!onDragEnd) return;
              const node = e.target as any;
              const { x, y } = node.position();
              const next = [shape.points[0], shape.points[1], x, y];
              onDragEnd({ id: shape.id, points: next });
            }}
          />
        </>
      )}
    </>
  );
};

// Small icon component to preview a line tool
export const SymbolLine: React.FC<{ size?: number; stroke?: string; strokeWidth?: number }>
  = ({ size = 36, stroke = '#111827', strokeWidth = 4 }) => {
  const padding = Math.max(3, Math.ceil(strokeWidth / 2) + 2);
  const points = [padding, size - padding, size - padding, padding];

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
      aria-label="Biểu tượng công cụ vẽ đường"
      title="Công cụ: Vẽ đường"
    >
      <Stage width={size} height={size} style={{ display: 'block', borderRadius: 6 }}>
        <Layer>
          <KonvaLine
            points={points}
            stroke={stroke}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        </Layer>
      </Stage>
    </div>
  );
};
