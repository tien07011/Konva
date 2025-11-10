import React from 'react';
import { Stage, Layer, Line as KonvaLine, Circle } from 'react-konva';
import type { LineShape } from '../../types/drawing';

// Renderer for a LineShape in the canvas
export const LineShapeNode: React.FC<{
  shape: LineShape;
  dashed?: boolean;
  draggable?: boolean;
  onDragEnd?: (payload: { id: string; points: number[] }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
}>
  = ({ shape, dashed = false, draggable = false, onDragEnd, isSelected = false, onSelect, onChange }) => {
  const points = shape.points;
  const anchors: Array<{ x: number; y: number; idx: number }> = [];
  for (let i = 0; i < points.length; i += 2) {
    anchors.push({ x: points[i], y: points[i + 1], idx: i });
  }
  return (
    <>
      <KonvaLine
        points={points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap="round"
        lineJoin={shape.lineJoin || 'miter'}
        dash={dashed ? [8, 6] : undefined}
        draggable={!dashed && draggable}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        onMouseDown={(e: any) => {
          // avoid triggering Stage's onMouseDown (which starts drafting)
          e.cancelBubble = true;
        }}
        onTouchStart={(e: any) => {
          e.cancelBubble = true;
        }}
        onClick={() => onSelect?.(shape.id)}
        onTap={() => onSelect?.(shape.id)}
  onDragEnd={(e: any) => {
          if (!onDragEnd) return;
          const node = e.target as any; // Konva.Line
          const pos = node.position();
          // translate absolute points by node's drag offset
          const next: number[] = [];
          for (let i = 0; i < points.length; i += 2) {
            next.push(points[i] + pos.x, points[i + 1] + pos.y);
          }
          // reset node offset to avoid visual double-transform; state update will re-render
          node.position({ x: 0, y: 0 });
          onDragEnd({ id: shape.id, points: next });
        }}
      />

      {/* Handles and midpoints: only when selected and not draft */}
      {!dashed && isSelected && (
        <>
          {anchors.map((a, i) => (
            <Circle
              key={`anchor-${shape.id}-${i}`}
              x={a.x}
              y={a.y}
              radius={6}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={2}
              draggable
              perfectDrawEnabled={false}
              shadowForStrokeEnabled={false}
              onMouseDown={(e: any) => { e.cancelBubble = true; }}
              onTouchStart={(e: any) => { e.cancelBubble = true; }}
              onDblClick={() => {
                if (!onChange) return;
                if (points.length <= 4) return; // keep at least 2 points
                const next = points.slice();
                next.splice(a.idx, 2);
                onChange({ id: shape.id, points: next });
              }}
              onDragMove={(e: any) => {
                if (!onChange) return;
                const stage = e.target.getStage();
                if (!stage) return;
                const pos = stage.getPointerPosition();
                if (!pos) return;
                const next = points.slice();
                next[a.idx] = pos.x;
                next[a.idx + 1] = pos.y;
                onChange({ id: shape.id, points: next });
              }}
              onDragEnd={(e: any) => { e.cancelBubble = true; }}
            />
          ))}
          {/* Midpoints for insertion */}
          {anchors.slice(0, -1).map((a, idx) => {
            const b = anchors[idx + 1];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <Circle
                key={`mid-${shape.id}-${idx}`}
                x={mx}
                y={my}
                radius={5}
                fill="#eff6ff"
                stroke="#93c5fd"
                strokeWidth={2}
                draggable
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                onMouseDown={(e: any) => { e.cancelBubble = true; }}
                onTouchStart={(e: any) => { e.cancelBubble = true; }}
                onDragEnd={(e: any) => {
                  if (!onChange) return;
                  const stage = e.target.getStage();
                  if (!stage) return;
                  const pos = stage.getPointerPosition();
                  if (!pos) return;
                  const insertAt = a.idx + 2; // after point a
                  const next = points.slice();
                  next.splice(insertAt, 0, pos.x, pos.y);
                  onChange({ id: shape.id, points: next });
                  e.cancelBubble = true;
                }}
                onClick={(e: any) => {
                  if (!onChange) return;
                  const insertAt = a.idx + 2;
                  const next = points.slice();
                  next.splice(insertAt, 0, mx, my);
                  onChange({ id: shape.id, points: next });
                  e.cancelBubble = true;
                }}
              />
            );
          })}
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
  {/* @ts-ignore: Stage children typing issue */}
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
