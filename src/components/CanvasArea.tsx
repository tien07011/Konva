import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import {
  Stage,
  Layer,
  Group as KonvaGroup,
  Transformer,
  Rect as KonvaRect,
  Line as KonvaLine,
} from 'react-konva';
import type { AnyShape, DraftShape, ShapeGroup } from '../types/drawing';
import { ShapeNode } from './shapes/registry';

// Temporary typing shim for Stage children typing issue in react-konva
const StageAny = Stage as unknown as React.ComponentType<any>;

type PointerHandler = (e: any) => void;

export interface CanvasAreaHandle {
  getStage: () => any | null;
}

interface CanvasAreaProps {
  shapes: AnyShape[];
  groups?: ShapeGroup[];
  draft: DraftShape;
  onMouseDown: PointerHandler;
  onMouseMove: PointerHandler;
  onMouseUp: PointerHandler;
  showGrid?: boolean;
  gridSize?: number;
  onLineDragEnd?: (payload: { id: string; points: number[] }) => void;
  onLineChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
  onRectDragEnd?: (payload: { id: string; x: number; y: number }) => void;
  onRectChange?: (payload: {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
  }) => void;
  onCircleDragEnd?: (payload: { id: string; cx: number; cy: number }) => void;
  onCircleChange?: (payload: {
    id: string;
    cx?: number;
    cy?: number;
    r?: number;
    rotation?: number;
  }) => void;
  selectedId?: string | null;
  onSelectShape?: (id: string | null) => void;
  onGroupDragEnd?: (payload: { id: string; x: number; y: number }) => void;
  onGroupChange?: (payload: {
    id: string;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }) => void;
  // new props for marquee & external grouping
  tool?: string;
  selectedIds?: string[]; // external current multi-selection
  onMarqueeSelect?: (ids: string[]) => void;
  onContextGroupRequest?: () => void; // right click -> group
}

// Vùng canvas hiển thị các shape, group và bản nháp
export const CanvasArea = React.forwardRef<CanvasAreaHandle, CanvasAreaProps>(
  (
    {
      shapes,
      groups = [],
      draft,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      showGrid = false,
      gridSize = 10,
      onLineDragEnd,
      onLineChange,
      onRectDragEnd,
      onRectChange,
      onCircleDragEnd,
      onCircleChange,
      selectedId = null,
      onSelectShape,
      onGroupDragEnd,
      onGroupChange,
      tool = 'none',
      selectedIds = [],
      onMarqueeSelect,
      onContextGroupRequest,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef<any>(null);
    const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    // expose minimal imperative handle for parent refs
    useImperativeHandle(ref, () => ({ getStage: () => stageRef.current }), []);
    // marquee selection state
    const [marquee, setMarquee] = useState<null | {
      x: number;
      y: number;
      w: number;
      h: number;
      startX: number;
      startY: number;
    }>(null);
    const isMarqueeActive = !!marquee;
    // context menu state
    const [ctxMenu, setCtxMenu] = useState<null | { x: number; y: number }>(null);

    // Precompute grid lines
    const gridLines = React.useMemo((): React.ReactElement[] | null => {
      if (!showGrid || size.width <= 0 || size.height <= 0 || gridSize <= 0) return null;
      const lines: React.ReactElement[] = [];
      // vertical
      for (let x = 0, i = 0; x <= size.width; x += gridSize, i++) {
        const isMajor = i % 5 === 0;
        lines.push(
          <KonvaLine
            key={`v-${x}`}
            points={[x, 0, x, size.height]}
            stroke={isMajor ? '#e5e7eb' : '#f3f4f6'}
            strokeWidth={isMajor ? 1 : 0.5}
            listening={false}
            perfectDrawEnabled={false as any}
          />,
        );
      }
      // horizontal
      for (let y = 0, i = 0; y <= size.height; y += gridSize, i++) {
        const isMajor = i % 5 === 0;
        lines.push(
          <KonvaLine
            key={`h-${y}`}
            points={[0, y, size.width, y]}
            stroke={isMajor ? '#e5e7eb' : '#f3f4f6'}
            strokeWidth={isMajor ? 1 : 0.5}
            listening={false}
            perfectDrawEnabled={false as any}
          />,
        );
      }
      return lines;
    }, [showGrid, size.width, size.height, gridSize]);

    // Auto-resize to fill container
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const measure = () => {
        setSize({ width: el.clientWidth, height: el.clientHeight });
      };

      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      window.addEventListener('resize', measure);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', measure);
      };
    }, []);

    // helper component to render a group with selectable transformer
    const GroupNode: React.FC<{ g: ShapeGroup }> = ({ g }) => {
      const groupRef = useRef<any>(null);
      const trRef = useRef<any>(null);
      const isSelected = selectedId === g.id;

      useEffect(() => {
        if (!trRef.current || !groupRef.current) return;
        if (isSelected) {
          trRef.current.nodes([groupRef.current]);
          trRef.current.getLayer()?.batchDraw();
        } else {
          trRef.current.nodes([]);
          trRef.current.getLayer()?.batchDraw();
        }
      }, [isSelected]);

      return (
        <>
          <KonvaGroup
            ref={groupRef}
            x={g.translate?.x || 0}
            y={g.translate?.y || 0}
            rotation={g.rotation || 0}
            opacity={g.visible ? 1 : 0}
            scaleX={g.scale?.x ?? 1}
            scaleY={g.scale?.y ?? 1}
            draggable
            onMouseDown={(e: any) => {
              e.cancelBubble = true;
            }}
            onTouchStart={(e: any) => {
              e.cancelBubble = true;
            }}
            onClick={() => onSelectShape?.(g.id)}
            onTap={() => onSelectShape?.(g.id)}
            onDragEnd={(e: any) => {
              const node = e.target as any;
              onGroupDragEnd?.({ id: g.id, x: node.x(), y: node.y() });
            }}
            onTransformEnd={() => {
              if (!groupRef.current) return;
              const node = groupRef.current;
              onGroupChange?.({
                id: g.id,
                x: node.x(),
                y: node.y(),
                rotation: node.rotation(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
              });
            }}
          >
            {g.groups.map((child) => (
              <GroupNode key={child.id} g={child} />
            ))}
            {g.shapeIds.map((sid) => {
              const s = shapes.find((x) => x.id === sid);
              if (!s) return null;
              return (
                <ShapeNode
                  key={s.id}
                  shape={s}
                  isDraft={false}
                  isSelected={selectedId === s.id}
                  onSelect={(id) => onSelectShape?.(id)}
                  onLineDragEnd={onLineDragEnd}
                  onLineChange={onLineChange}
                  onRectDragEnd={onRectDragEnd}
                  onRectChange={onRectChange}
                  onCircleDragEnd={onCircleDragEnd}
                  onCircleChange={onCircleChange}
                />
              );
            })}
          </KonvaGroup>
          {isSelected && (
            <Transformer
              ref={trRef}
              rotateEnabled
              resizeEnabled
              keepRatio={false}
              boundBoxFunc={(oldBox: any, newBox: any) => {
                if (newBox.width < 1 || newBox.height < 1) return oldBox;
                return newBox;
              }}
            />
          )}
        </>
      );
    };

    const isInGroup = (id: string, list: ShapeGroup[]): boolean => {
      for (const g of list) {
        if (g.shapeIds.includes(id)) return true;
        if (isInGroup(id, g.groups)) return true;
      }
      return false;
    };

    // compute bounding boxes for shapes (rough, axis-aligned)
    const shapeBBox = useCallback((s: AnyShape): { x: number; y: number; w: number; h: number } => {
      if (s.type === 'rect')
        return { x: (s as any).x, y: (s as any).y, w: (s as any).width, h: (s as any).height };
      if (s.type === 'line' || s.type === 'qcurve' || s.type === 'ccurve') {
        const pts = (s as any).points as number[];
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i < pts.length; i += 2) {
          xs.push(pts[i]);
          ys.push(pts[i + 1]);
        }
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
      if (s.type === 'circle') {
        const c = s as any;
        return { x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 };
      }
      if (s.type === 'path') {
        // approximate path bbox from commands
        const cmds = (s as any).commands as any[];
        const xs: number[] = [];
        const ys: number[] = [];
        cmds.forEach((c) => {
          if ('x' in c) {
            xs.push(c.x);
            ys.push(c.y);
          }
          if ('x1' in c) {
            xs.push(c.x1);
            ys.push(c.y1);
          }
          if ('x2' in c) {
            xs.push(c.x2);
            ys.push(c.y2);
          }
          if ('cx' in c) {
            xs.push(c.cx);
            ys.push(c.cy);
          }
        });
        if (!xs.length) return { x: 0, y: 0, w: 0, h: 0 };
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
      return { x: 0, y: 0, w: 0, h: 0 };
    }, []);

    const marqueeSelect = useCallback(() => {
      if (!marquee) return;
      const rx = marquee.w >= 0 ? marquee.x : marquee.x + marquee.w;
      const ry = marquee.h >= 0 ? marquee.y : marquee.y + marquee.h;
      const rw = Math.abs(marquee.w);
      const rh = Math.abs(marquee.h);
      const ids = shapes
        .filter((s) => !isInGroup(s.id, groups))
        .filter((s) => {
          const b = shapeBBox(s);
          // simple intersection test
          return !(b.x + b.w < rx || b.y + b.h < ry || b.x > rx + rw || b.y > ry + rh);
        })
        .map((s) => s.id);
      onMarqueeSelect?.(ids);
    }, [groups, marquee, onMarqueeSelect, shapeBBox, shapes, isInGroup]);

    // global listeners to close context menu
    useEffect(() => {
      const close = () => setCtxMenu(null);
      window.addEventListener('click', close);
      window.addEventListener('contextmenu', close);
      return () => {
        window.removeEventListener('click', close);
        window.removeEventListener('contextmenu', close);
      };
    }, []);

    return (
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: '100%', background: '#ffffff' }}
      >
        <StageAny
          ref={stageRef}
          width={size.width}
          height={size.height}
          style={{ display: 'block' }}
          onMouseDown={(e: any) => {
            const stage = e.target.getStage?.();
            if (stage && e.target === stage) {
              // start marquee only if tool is none (selection mode) and left button
              if (tool === 'none' && e.evt.button === 0) {
                const pos = stage.getPointerPosition();
                if (pos) {
                  setMarquee({ x: pos.x, y: pos.y, w: 0, h: 0, startX: pos.x, startY: pos.y });
                }
              } else {
                onSelectShape?.(null);
              }
            }
            onMouseDown(e);
          }}
          onMouseMove={(e: any) => {
            if (isMarqueeActive) {
              const stage = e.target.getStage();
              const pos = stage.getPointerPosition();
              if (pos) {
                setMarquee((m) => (m ? { ...m, w: pos.x - m.startX, h: pos.y - m.startY } : m));
              }
            }
            onMouseMove(e);
          }}
          onMouseUp={(e: any) => {
            if (isMarqueeActive) {
              marqueeSelect();
              setMarquee(null);
            }
            onMouseUp(e);
          }}
          onContextMenu={(e: any) => {
            e.evt.preventDefault();
            const stage = e.target.getStage?.();
            if (stage) {
              const pointer = stage.getPointerPosition();
              if (pointer) {
                setCtxMenu({ x: pointer.x, y: pointer.y });
              }
            }
          }}
        >
          <Layer listening={false}>{gridLines}</Layer>
          <Layer>
            {/* groups */}
            {groups.map((g) => (
              <GroupNode key={g.id} g={g} />
            ))}

            {/* shapes that are not inside any group */}
            {shapes
              .filter((s) => !isInGroup(s.id, groups))
              .map((s) => (
                <ShapeNode
                  key={s.id}
                  shape={s}
                  isDraft={false}
                  isSelected={selectedId === s.id}
                  onSelect={(id) => onSelectShape?.(id)}
                  onLineDragEnd={onLineDragEnd}
                  onLineChange={onLineChange}
                  onRectDragEnd={onRectDragEnd}
                  onRectChange={onRectChange}
                  onCircleDragEnd={onCircleDragEnd}
                  onCircleChange={onCircleChange}
                />
              ))}

            {draft ? <ShapeNode shape={draft as any} isDraft /> : null}
            {/* marquee rectangle visual */}
            {isMarqueeActive && marquee && (
              <KonvaRect
                x={marquee.w >= 0 ? marquee.x : marquee.x + marquee.w}
                y={marquee.h >= 0 ? marquee.y : marquee.y + marquee.h}
                width={Math.abs(marquee.w)}
                height={Math.abs(marquee.h)}
                stroke="#2563eb"
                dash={[4, 4]}
                strokeWidth={1}
                listening={false}
              />
            )}
          </Layer>
        </StageAny>

        {/* custom context menu */}
        {ctxMenu && (
          <div
            style={{
              position: 'absolute',
              left: ctxMenu.x,
              top: ctxMenu.y,
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              padding: '4px 0',
              zIndex: 50,
              minWidth: 140,
              fontSize: 13,
            }}
          >
            <button
              type="button"
              onClick={() => {
                onContextGroupRequest?.();
                setCtxMenu(null);
              }}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              disabled={!selectedIds || selectedIds.length < 2}
            >
              Nhóm ({selectedIds?.length || 0})
            </button>
          </div>
        )}
      </div>
    );
  },
);

CanvasArea.displayName = 'CanvasArea';

export default CanvasArea;
