import React from 'react';
import { Stage, Layer, Shape as KonvaShape, Circle, Group as KonvaGroup } from 'react-konva';
import type { CubicCurveShape } from '../../types/drawing';

// Renderer for a Cubic Bézier curve
export const CubicCurveShapeNode: React.FC<{
  shape: CubicCurveShape;
  dashed?: boolean;
  draggable?: boolean;
  onDragEnd?: (payload: { id: string; points: number[] }) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
}> = ({
  shape,
  dashed = false,
  draggable = false,
  onDragEnd,
  isSelected = false,
  onSelect,
  onChange,
}) => {
  const pts = shape.points; // [x0,y0,cx1,cy1,cx2,cy2,x1,y1]
  const anchors = [
    { x: pts[0], y: pts[1], idx: 0, role: 'start' },
    { x: pts[2], y: pts[3], idx: 2, role: 'control1' },
    { x: pts[4], y: pts[5], idx: 4, role: 'control2' },
    { x: pts[6], y: pts[7], idx: 6, role: 'end' },
  ];
  return (
    <KonvaGroup
      draggable={!dashed && draggable}
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
        const node = e.target as any;
        const pos = node.position();
        const next: number[] = [];
        for (let i = 0; i < pts.length; i += 2) next.push(pts[i] + pos.x, pts[i + 1] + pos.y);
        node.position({ x: 0, y: 0 });
        onDragEnd({ id: shape.id, points: next });
      }}
      onMouseEnter={(e: any) => {
        const st = e.target.getStage();
        if (st) st.container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e: any) => {
        const st = e.target.getStage();
        if (st) st.container().style.cursor = 'default';
      }}
    >
      <KonvaShape
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        hitStrokeWidth={Math.max(8, shape.strokeWidth * 2)}
        dash={dashed ? [8, 6] : undefined}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        sceneFunc={(ctx: any, node: any) => {
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
          ctx.fillStrokeShape(node);
        }}
      />
      {/* Helper guides: start->c1 and end->c2 */}
      {!dashed && isSelected && (
        <KonvaShape
          stroke="#f59e0b"
          strokeWidth={1}
          dash={[4, 4]}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          sceneFunc={(ctx: any, node: any) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            ctx.lineTo(pts[2], pts[3]);
            ctx.moveTo(pts[6], pts[7]);
            ctx.lineTo(pts[4], pts[5]);
            ctx.fillStrokeShape(node);
          }}
        />
      )}
      {!dashed &&
        isSelected &&
        anchors.map((a, i) => (
          <Circle
            key={`cb-anchor-${shape.id}-${i}`}
            x={a.x}
            y={a.y}
            radius={a.role.startsWith('control') ? 5 : 6}
            fill={a.role.startsWith('control') ? '#fef3c7' : '#ffffff'}
            stroke={a.role.startsWith('control') ? '#d97706' : '#2563eb'}
            strokeWidth={2}
            draggable
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            onMouseDown={(e: any) => {
              e.cancelBubble = true;
            }}
            onTouchStart={(e: any) => {
              e.cancelBubble = true;
            }}
            onDragMove={(e: any) => {
              if (!onChange) return;
              const stage = e.target.getStage();
              if (!stage) return;
              const pos = stage.getPointerPosition();
              if (!pos) return;
              const next = pts.slice();
              next[a.idx] = pos.x;
              next[a.idx + 1] = pos.y;
              onChange({ id: shape.id, points: next });
            }}
            onDragEnd={(e: any) => {
              e.cancelBubble = true;
            }}
          />
        ))}
    </KonvaGroup>
  );
};

// Icon preview for cubic curve tool
export const SymbolCubic: React.FC<{ size?: number; stroke?: string; strokeWidth?: number }> = ({
  size = 28,
  stroke = '#111827',
  strokeWidth = 4,
}) => {
  const StageAny = Stage as unknown as React.ComponentType<any>;
  const pad = Math.max(3, Math.ceil(strokeWidth / 2) + 2);
  const x0 = pad;
  const y0 = size - pad;
  const x1 = size - pad;
  const y1 = pad;
  const c1x = x0 + (x1 - x0) / 3;
  const c1y = y0;
  const c2x = x0 + (2 * (x1 - x0)) / 3;
  const c2y = y1;
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
      aria-label="Biểu tượng công cụ: Đường cong bậc 3"
      title="Công cụ: Đường cong bậc 3"
    >
      <StageAny width={size} height={size} style={{ display: 'block', borderRadius: 6 }}>
        <Layer>
          <KonvaShape
            stroke={stroke}
            strokeWidth={strokeWidth}
            sceneFunc={(ctx: any, node: any) => {
              ctx.beginPath();
              ctx.moveTo(x0, y0);
              ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x1, y1);
              ctx.fillStrokeShape(node);
            }}
          />
        </Layer>
      </StageAny>
    </div>
  );
};
