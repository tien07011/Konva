import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Group, Line, Circle, Rect } from 'react-konva';
import type { LineShape } from '../../types/drawing';
import { polylineLength, closestSegment, snapVector45 } from '../../utils/geometry';

interface LineComponentProps {
  shape: LineShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
  onChange?: (next: LineShape) => void;
}

export const LineComponent: React.FC<LineComponentProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd,
  onChange,
}) => {
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [activeHandle, setActiveHandle] = useState<number | null>(null);

  useEffect(() => {
    // reset draft when selection or shape changes externally
    setDraftPoints(null);
    setActiveHandle(null);
  }, [shape.id, isSelected]);

  useEffect(() => {
    // Demo: compute polyline length in WASM when points change (no UI change)
    const pts = draftPoints ?? shape.points;
    if (pts && pts.length >= 4) {
      polylineLength(pts).then((len) => {
        console.log(`[WASM] polyline length for ${shape.id}:`, len.toFixed(2));
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug(`[WASM] polyline length for ${shape.id}:`, len.toFixed(2));
        }
      });
    }
  }, [shape.id, shape.points, draftPoints]);

  const points = draftPoints ?? shape.points;

  const handleDragMove = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      const x = node.x();
      const y = node.y();
      const next = points.slice();
      next[idx] = x;
      next[idx + 1] = y;
      setDraftPoints(next);
    },
    [points],
  );

  const handleDragMoveSnapped = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      const x = node.x();
      const y = node.y();
      // snap relative to previous point if exists, else next
      const refX = points[idx - 2] ?? points[idx + 2] ?? x;
      const refY = points[idx - 1] ?? points[idx + 3] ?? y;
      const { dx, dy } = snapVector45(x - refX, y - refY);
      const sx = refX + dx;
      const sy = refY + dy;
      const next = points.slice();
      next[idx] = sx;
      next[idx + 1] = sy;
      setDraftPoints(next);
    },
    [points],
  );

  const handleDragEndPoint = useCallback(
    (idx: number) => (e: any) => {
      const node = e.target;
      const x = node.x();
      const y = node.y();
      const next = (draftPoints ?? points).slice();
      next[idx] = x;
      next[idx + 1] = y;
      setDraftPoints(null);
      setActiveHandle(null);
      if (onChange) onChange({ ...shape, points: next });
    },
    [draftPoints, points, onChange, shape],
  );

  const makeOnPointDragMove = useCallback(
    (idx: number) => (e: any) => {
      if (e.evt?.shiftKey) return handleDragMoveSnapped(idx)(e);
      return handleDragMove(idx)(e);
    },
    [handleDragMove, handleDragMoveSnapped],
  );

  const makeOnMidDragMove = useCallback(
    () => (e: any) => {
      if (activeHandle !== null && activeHandle >= 0) {
        if (e.evt?.shiftKey) return handleDragMoveSnapped(activeHandle)(e);
        return handleDragMove(activeHandle)(e);
      }
    },
    [activeHandle, handleDragMove, handleDragMoveSnapped],
  );

  const makeOnMidDragEnd = useCallback(
    () => (e: any) => {
      if (activeHandle !== null) return handleDragEndPoint(activeHandle)(e);
    },
    [activeHandle, handleDragEndPoint],
  );

  const handleInsertAndDragMid = useCallback(
    (segStartIdx: number) => (e: any) => {
      // when starting drag on midpoint, insert it into points
      const node = e.target;
      const x = node.x();
      const y = node.y();
      const base = draftPoints ?? points;
      const next = base.slice();
      // insert after segStartIdx (which is x index), at position segStartIdx+2
      next.splice(segStartIdx + 2, 0, x, y);
      setDraftPoints(next);
      setActiveHandle(segStartIdx + 2);
    },
    [draftPoints, points],
  );

  const handleKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      if (!isSelected || activeHandle === null) return;
      if ((ev.key === 'Backspace' || ev.key === 'Delete') && points.length > 4) {
        const next = points.slice();
        next.splice(activeHandle, 2);
        setDraftPoints(null);
        setActiveHandle(null);
        if (onChange) onChange({ ...shape, points: next });
      }
    },
    [activeHandle, isSelected, onChange, points, shape],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDoubleClick = useCallback(
    (e: any) => {
      if (!isSelected) return;
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      const hit = closestSegment(points, pos.x, pos.y, 10);
      if (!hit) return;
      const insertAt = hit.index + 2; // after segment start
      const next = points.slice();
      next.splice(insertAt, 0, hit.x, hit.y);
      if (onChange) onChange({ ...shape, points: next });
    },
    [isSelected, onChange, points, shape],
  );

  const anchors = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i];
      const y = points[i + 1];
      out.push(
        <Circle
          key={`p-${i}`}
          x={x}
          y={y}
          radius={6}
          stroke={'#3b82f6'}
          fill={'#fff'}
          strokeWidth={2}
          draggable
          onDragStart={() => setActiveHandle(i)}
          onDragMove={makeOnPointDragMove(i)}
          onDragEnd={handleDragEndPoint(i)}
        />,
      );
      // midpoint handle between this and next if exists
      if (i + 2 < points.length) {
        const mx = (x + points[i + 2]) / 2;
        const my = (y + points[i + 3]) / 2;
        out.push(
          <Rect
            key={`m-${i}`}
            x={mx - 4}
            y={my - 4}
            width={8}
            height={8}
            cornerRadius={2}
            stroke={'#60a5fa'}
            fill={'#e0f2fe'}
            strokeWidth={1.5}
            draggable
            onDragStart={handleInsertAndDragMid(i)}
            onDragMove={makeOnMidDragMove()}
            onDragEnd={makeOnMidDragEnd()}
          />,
        );
      }
    }
    return out;
  }, [points, handleDragEndPoint, handleDragMove, handleDragMoveSnapped, handleInsertAndDragMid, activeHandle]);

  return (
    <Group>
      <Line
        id={shape.id}
        points={points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap={shape.lineCap || 'round'}
        lineJoin={shape.lineJoin || 'round'}
        dash={shape.dash}
        closed={!!shape.closed}
        tension={shape.tension ?? 0}
        fill={shape.fill}
        rotation={shape.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDoubleClick}
        onDragEnd={onDragEnd}
        shadowColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
        shadowOffset={isSelected ? { x: 0, y: 0 } : undefined}
      />
      {isSelected ? anchors : null}
    </Group>
  );
};
