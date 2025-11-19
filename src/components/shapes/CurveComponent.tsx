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
}

export const CurveComponent: React.FC<CurveComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
  onChange,
}) => {
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [activeHandle, setActiveHandle] = useState<number | null>(null); // stores x-index in points

  useEffect(() => {
    setDraftPoints(null);
    setActiveHandle(null);
  }, [shape.id, isSelected]);

  const points = draftPoints ?? shape.points;

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
      setPointAt(idx, node.x(), node.y(), false);
    },
    [setPointAt],
  );

  // Snap relative to the most relevant counterpart endpoint
  const handleDragMoveSnapped = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      let refX = points[0];
      let refY = points[1];
      if (shape.type === 'qcurve') {
        const endX = points[4], endY = points[5];
        if (idx === 0) { refX = endX; refY = endY; }
        else if (idx === 4) { refX = points[0]; refY = points[1]; }
        else {
          // control: snap relative to closer endpoint
          const d0 = Math.hypot(points[0] - node.x(), points[1] - node.y());
          const d1 = Math.hypot(endX - node.x(), endY - node.y());
          if (d1 < d0) { refX = endX; refY = endY; }
        }
      } else {
        const endX = points[6], endY = points[7];
        if (idx === 0) { refX = endX; refY = endY; }
        else if (idx === 6) { refX = points[0]; refY = points[1]; }
        else if (idx === 2) { refX = points[0]; refY = points[1]; }
        else if (idx === 4) { refX = endX; refY = endY; }
      }
      const { dx, dy } = snapVector45(node.x() - refX, node.y() - refY);
      setPointAt(idx, refX + dx, refY + dy, false);
    },
    [points, setPointAt, shape.type],
  );

  const handleDragEndPoint = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      setPointAt(idx, node.x(), node.y(), true);
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
      // helper lines
      els.push(
        <KLine key="hl-0" points={[x0, y0, cx, cy]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
        <KLine key="hl-1" points={[cx, cy, x1, y1]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
      );
      // endpoints
      els.push(
        <Circle
          key="p-0"
          x={x0}
          y={y0}
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
          x={x1}
          y={y1}
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
          x={cx}
          y={cy}
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
      // helper lines
      els.push(
        <KLine key="hl-0" points={[x0, y0, c1x, c1y]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
        <KLine key="hl-1" points={[x1, y1, c2x, c2y]} stroke="#93c5fd" strokeWidth={1} dash={[4,4]} />,
        <KLine key="hl-2" points={[c1x, c1y, c2x, c2y]} stroke="#bfdbfe" strokeWidth={1} dash={[2,4]} />,
      );
      // endpoints
      els.push(
        <Circle
          key="p-0"
          x={x0}
          y={y0}
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
          x={x1}
          y={y1}
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
          x={c1x}
          y={c1y}
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
          x={c2x}
          y={c2y}
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
  }, [points, shape.type, makeOnPointDragMove, handleDragEndPoint]);

  return (
    <Group draggable onDragEnd={onDragEnd}>
      <Path
        data={d}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.fill}
        onClick={onSelect}
        onTap={onSelect}
        shadowColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
        shadowOffset={isSelected ? { x: 0, y: 0 } : undefined}
      />
      {isSelected ? anchors : null}
    </Group>
  );
};
