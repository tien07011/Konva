import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Group, Path, Circle, Line as KLine } from 'react-konva';
import type { QuadraticCurveShape, CubicCurveShape } from '../../types/drawing';
import { snapVector45 } from '../../utils/geometry';

interface CurveComponentProps {
  shape: QuadraticCurveShape | CubicCurveShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
  onChange?: (next: QuadraticCurveShape | CubicCurveShape) => void;
  interactive?: boolean;
}

export const CurveComponent: React.FC<CurveComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
  onChange,
  interactive = true,
}) => {
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [activeHandle, setActiveHandle] = useState<number | null>(null); // stores x-index in points
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setDraftPoints(null);
    setActiveHandle(null);
  }, [shape.id, isSelected]);

  // Ensure points array has the correct length for the curve type
  const points = useMemo(() => {
    const src = draftPoints ?? shape.points ?? [];
    if (shape.type === 'qcurve') {
      if (src.length === 6 && src.every((v) => Number.isFinite(v))) return src;
      const [x0 = 0, y0 = 0, cx = src[2] ?? x0, cy = src[3] ?? y0, x1 = src[4] ?? x0, y1 = src[5] ?? y0] = src;
      // If control/end missing, fall back to midpoint-based defaults
      const defX1 = Number.isFinite(x1) ? x1 : x0 + 1;
      const defY1 = Number.isFinite(y1) ? y1 : y0 + 1;
      const mcx = Number.isFinite(cx) ? cx : (x0 + defX1) / 2;
      const mcy = Number.isFinite(cy) ? cy : (y0 + defY1) / 2;
      return [x0, y0, mcx, mcy, defX1, defY1];
    }
    // ccurve
    if (src.length === 8 && src.every((v) => Number.isFinite(v))) return src;
    const [x0 = 0, y0 = 0, c1x = src[2] ?? x0, c1y = src[3] ?? y0, c2x = src[4] ?? x0, c2y = src[5] ?? y0, x1 = src[6] ?? x0, y1 = src[7] ?? y0] = src;
    const defX1 = Number.isFinite(x1) ? x1 : x0 + 1;
    const defY1 = Number.isFinite(y1) ? y1 : y0 + 1;
    const dc1x = Number.isFinite(c1x) ? c1x : (x0 * 2 + defX1) / 3;
    const dc1y = Number.isFinite(c1y) ? c1y : (y0 * 2 + defY1) / 3;
    const dc2x = Number.isFinite(c2x) ? c2x : (x0 + defX1 * 2) / 3;
    const dc2y = Number.isFinite(c2y) ? c2y : (y0 + defY1 * 2) / 3;
    return [x0, y0, dc1x, dc1y, dc2x, dc2y, defX1, defY1];
  }, [draftPoints, shape.points, shape.type]);

  const d = useMemo(() => {
    if (shape.type === 'qcurve') {
      const [x0, y0, cx, cy, x1, y1] = points;
      return `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;
    }
    const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = points;
    return `M ${x0} ${y0} C ${cx1} ${cy1} ${cx2} ${cy2} ${x1} ${y1}`;
  }, [points, shape.type]);

  const setPointAt = useCallback(
    (idx: number, x: number, y: number, commit = false) => {
      const base = (commit ? draftPoints ?? points : points).slice();
      base[idx] = x;
      base[idx + 1] = y;
      if (commit) {
        setDraftPoints(null);
        setActiveHandle(null);
        if (onChange) onChange({ ...shape, points: base } as typeof shape);
      } else {
        setDraftPoints(base);
      }
    },
    [draftPoints, points, onChange, shape],
  );

  const handleDragMove = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      const pos = typeof node.getAbsolutePosition === 'function' ? node.getAbsolutePosition() : { x: node.x(), y: node.y() };
      setPointAt(idx, pos.x, pos.y, false);
    },
    [setPointAt],
  );

  // Snap relative to the most relevant counterpart endpoint
  const handleDragMoveSnapped = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      const pos = typeof node.getAbsolutePosition === 'function' ? node.getAbsolutePosition() : { x: node.x(), y: node.y() };
      let refX = points[0];
      let refY = points[1];
      if (shape.type === 'qcurve') {
        const endX = points[4], endY = points[5];
        if (idx === 0) { refX = endX; refY = endY; }
        else if (idx === 4) { refX = points[0]; refY = points[1]; }
        else {
          // control: snap relative to closer endpoint
          const d0 = Math.hypot(points[0] - pos.x, points[1] - pos.y);
          const d1 = Math.hypot(endX - pos.x, endY - pos.y);
          if (d1 < d0) { refX = endX; refY = endY; }
        }
      } else {
        const endX = points[6], endY = points[7];
        if (idx === 0) { refX = endX; refY = endY; }
        else if (idx === 6) { refX = points[0]; refY = points[1]; }
        else if (idx === 2) { refX = points[0]; refY = points[1]; }
        else if (idx === 4) { refX = endX; refY = endY; }
      }
      const { dx, dy } = snapVector45(pos.x - refX, pos.y - refY);
      setPointAt(idx, refX + dx, refY + dy, false);
    },
    [points, setPointAt, shape.type],
  );

  const handleDragEndPoint = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      const pos = typeof node.getAbsolutePosition === 'function' ? node.getAbsolutePosition() : { x: node.x(), y: node.y() };
      setPointAt(idx, pos.x, pos.y, true);
    },
    [setPointAt],
  );

  const makeOnPointDragMove = useCallback(
    (idx: number) => (e: any) => {
      if (e.evt?.shiftKey) return handleDragMoveSnapped(idx)(e);
      return handleDragMove(idx)(e);
    },
    [handleDragMove, handleDragMoveSnapped],
  );

  const anchors = useMemo(() => {
    const els: React.ReactNode[] = [];
    if (shape.type === 'qcurve') {
      const [x0, y0, cx, cy, x1, y1] = points;
      const ox = dragOffset.x;
      const oy = dragOffset.y;
      // helper lines
      els.push(
        <KLine key="hl-0" points={[x0+ox, y0+oy, cx+ox, cy+oy]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
        <KLine key="hl-1" points={[cx+ox, cy+oy, x1+ox, y1+oy]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
      );
      // endpoints
      els.push(
        <Circle
          key="p-0"
          x={x0 + ox}
          y={y0 + oy}
          radius={6}
          stroke={'#3b82f6'}
          fill={'#fff'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(0)}
          onDragMove={makeOnPointDragMove(0)}
          onDragEnd={handleDragEndPoint(0)}
        />,
        <Circle
          key="p-4"
          x={x1 + ox}
          y={y1 + oy}
          radius={6}
          stroke={'#3b82f6'}
          fill={'#fff'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(4)}
          onDragMove={makeOnPointDragMove(4)}
          onDragEnd={handleDragEndPoint(4)}
        />,
      );
      // control
      els.push(
        <Circle
          key="c-2"
          x={cx + ox}
          y={cy + oy}
          radius={5}
          stroke={'#60a5fa'}
          fill={'#e0f2fe'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(2)}
          onDragMove={makeOnPointDragMove(2)}
          onDragEnd={handleDragEndPoint(2)}
        />,
      );
    } else {
      const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] = points;
      const ox = dragOffset.x;
      const oy = dragOffset.y;
      // helper lines
      els.push(
        <KLine key="hl-0" points={[x0+ox, y0+oy, c1x+ox, c1y+oy]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
        <KLine key="hl-1" points={[x1+ox, y1+oy, c2x+ox, c2y+oy]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
        <KLine key="hl-2" points={[c1x+ox, c1y+oy, c2x+ox, c2y+oy]} stroke="#bfdbfe" strokeWidth={1} dash={[2,4]} />,
      );
      // endpoints
      els.push(
        <Circle
          key="p-0"
          x={x0 + ox}
          y={y0 + oy}
          radius={6}
          stroke={'#3b82f6'}
          fill={'#fff'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(0)}
          onDragMove={makeOnPointDragMove(0)}
          onDragEnd={handleDragEndPoint(0)}
        />,
        <Circle
          key="p-6"
          x={x1 + ox}
          y={y1 + oy}
          radius={6}
          stroke={'#3b82f6'}
          fill={'#fff'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(6)}
          onDragMove={makeOnPointDragMove(6)}
          onDragEnd={handleDragEndPoint(6)}
        />,
      );
      // controls
      els.push(
        <Circle
          key="c-2"
          x={c1x + ox}
          y={c1y + oy}
          radius={5}
          stroke={'#60a5fa'}
          fill={'#e0f2fe'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(2)}
          onDragMove={makeOnPointDragMove(2)}
          onDragEnd={handleDragEndPoint(2)}
        />,
        <Circle
          key="c-4"
          x={c2x + ox}
          y={c2y + oy}
          radius={5}
          stroke={'#60a5fa'}
          fill={'#e0f2fe'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(4)}
          onDragMove={makeOnPointDragMove(4)}
          onDragEnd={handleDragEndPoint(4)}
        />,
      );
    }
    return els;
  }, [points, shape.type, makeOnPointDragMove, handleDragEndPoint, dragOffset]);

  return (
    <Group>
      <Path
        data={d}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.fill}
        onClick={interactive ? onSelect : undefined}
        onTap={interactive ? onSelect : undefined}
        draggable={interactive}
        listening={interactive}
        onDragMove={(e: any) => {
          const n = e.target;
          setDragOffset({ x: n.x(), y: n.y() });
        }}
        onDragEnd={(e: any) => {
          setDragOffset({ x: 0, y: 0 });
          onDragEnd?.(e);
        }}
        shadowColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
        shadowOffset={isSelected ? { x: 0, y: 0 } : undefined}
      />
      {interactive && isSelected ? anchors : null}
    </Group>
  );
};
