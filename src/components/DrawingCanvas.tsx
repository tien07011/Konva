import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { CanvasArea } from './CanvasArea';
import { useDrawing } from '../hooks/useDrawing';
import type { ToolType } from '../types/drawing';
import { buildScreen, buildScreenFromShapes } from '../utils/export';
import { LayersPanel } from './LayersPanel';

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  exportJSON: () => string; // JSON following interface.Screen
}

interface DrawingCanvasProps {
  strokeColor: string;
  strokeWidth: number;
  onHistoryChange?: (info: { canUndo: boolean; canRedo: boolean }) => void;
  tool?: ToolType; // default 'line'
  onToolChange?: (t: ToolType) => void;
}

export const DrawingCanvas = React.forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ strokeColor, strokeWidth, onHistoryChange, tool = 'line', onToolChange }, ref) => {
    const { shapes, groups, draft, canUndo, canRedo, clear, undo, redo, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd, onLineChange, onLineStyleChange, onShapeUpdate, onRectDragEnd, onRectChange, groupShapes, ungroupGroup, groupDragEnd, groupChange } =
      useDrawing({ tool, stroke: strokeColor, strokeWidth, onHistoryChange });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]); // multi-select (layers or marquee)
  const selectedShape = useMemo(() => (selectedId ? shapes.find((s) => s.id === selectedId) || null : null), [shapes, selectedId]);

    useEffect(() => {
      onHistoryChange?.({ canUndo, canRedo });
    }, [canUndo, canRedo, onHistoryChange]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        undo,
        redo,
        exportJSON: () => {
          const screen = buildScreen(shapes, groups, {
            id: 'screen_1',
            name: 'Canvas',
            background: '#ffffff',
            precision: 2,
            normalize: 'none',
          });
          return JSON.stringify(screen, null, 2);
        },
      }),
      [clear, undo, redo]
    );

    return (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Layers panel on the left */}
        <LayersPanel
          shapes={shapes}
          groups={groups}
          selectedIds={selectedShapeIds}
          onToggleSelect={(id) => {
            setSelectedId(id); // also reflect highlight in canvas
            setSelectedShapeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
          }}
          onClearSelection={() => { setSelectedShapeIds([]); setSelectedId(null); }}
          onGroup={(ids) => {
            const gid = groupShapes(ids, `Group ${ids.length}`);
            if (gid) setSelectedShapeIds([]);
          }}
          onUngroup={(gid) => {
            ungroupGroup(gid);
          }}
          selectedGroupId={selectedId}
          onSelectGroup={(gid) => setSelectedId(gid)}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <CanvasArea
            shapes={shapes}
            groups={groups}
            draft={draft}
            tool={tool}
            selectedId={selectedId}
            selectedIds={selectedShapeIds}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={(e: any) => {
              const hadDraft = !!draft;
              onMouseUp(e);
              if (hadDraft) {
                setSelectedId(null);
                onToolChange?.('none');
              }
            }}
            onLineDragEnd={onLineDragEnd}
            onLineChange={onLineChange}
            onRectDragEnd={onRectDragEnd}
            onRectChange={onRectChange}
            onSelectShape={(id: string | null) => setSelectedId(id)}
            onMarqueeSelect={(ids) => {
              setSelectedShapeIds(ids);
              // do not override single selectedId unless exactly one id
              setSelectedId(ids.length === 1 ? ids[0] : null);
            }}
            onContextGroupRequest={() => {
              if (selectedShapeIds.length >= 2) {
                const gid = groupShapes(selectedShapeIds, `Group ${selectedShapeIds.length}`);
                if (gid) {
                  setSelectedShapeIds([]);
                  setSelectedId(gid);
                }
              }
            }}
            onGroupDragEnd={groupDragEnd}
            onGroupChange={groupChange}
          />
        </div>
        {/* Properties panel */}
        {selectedShape && selectedId && !groups.some(g => g.id === selectedId) && (
          <div
            style={{
              width: 260,
              borderLeft: '1px solid #e5e7eb',
              background: '#ffffff',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong>Thuộc tính</strong>
              <button type="button" onClick={() => setSelectedId(null)} style={{ fontSize: 12 }}>Bỏ chọn</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#374151' }}>Màu viền</label>
              <input
                type="color"
                value={selectedShape.stroke}
                onChange={(e) => onShapeUpdate({ id: selectedShape.id, stroke: e.target.value })}
                title="Màu viền"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#374151' }}>Độ dày</label>
              <input
                type="range"
                min={1}
                max={50}
                value={selectedShape.strokeWidth}
                onChange={(e) => onShapeUpdate({ id: selectedShape.id, strokeWidth: parseInt(e.target.value, 10) })}
              />
              <span style={{ fontSize: 12, color: '#4b5563', minWidth: 28, textAlign: 'right' }}>{selectedShape.strokeWidth}px</span>
            </div>
            {/* Rotation control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#374151' }}>Góc xoay</label>
              <input
                type="number"
                style={{ width: 70 }}
                value={selectedShape.rotation ?? 0}
                onChange={(e) => onShapeUpdate({ id: selectedShape.id, rotation: parseFloat(e.target.value) || 0 })}
                title="Góc xoay (độ)"
              />
              <button
                type="button"
                style={{ fontSize: 11 }}
                onClick={() => onShapeUpdate({ id: selectedShape.id, rotation: 0 })}
                title="Đặt lại góc xoay"
              >
                Reset
              </button>
            </div>

            {/* Position & size (chỉ cho hình chữ nhật) */}
            {selectedShape.type === 'rect' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 12, color: '#374151' }}>X</label>
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={(selectedShape as any).x}
                    onChange={(e) => onRectChange({ id: selectedShape.id, x: parseFloat(e.target.value) || 0 })}
                  />
                  <label style={{ fontSize: 12, color: '#374151' }}>Y</label>
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={(selectedShape as any).y}
                    onChange={(e) => onRectChange({ id: selectedShape.id, y: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 12, color: '#374151' }}>W</label>
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={(selectedShape as any).width}
                    onChange={(e) => onRectChange({ id: selectedShape.id, width: Math.max(1, parseFloat(e.target.value) || 1) })}
                  />
                  <label style={{ fontSize: 12, color: '#374151' }}>H</label>
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={(selectedShape as any).height}
                    onChange={(e) => onRectChange({ id: selectedShape.id, height: Math.max(1, parseFloat(e.target.value) || 1) })}
                  />
                </div>
              </>
            )}
            {selectedShape.type === 'line' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#374151' }}>Line Join</label>
                <select
                  value={(selectedShape as any).lineJoin || 'miter'}
                  onChange={(e) => onLineStyleChange({ id: selectedShape.id, lineJoin: e.target.value as any })}
                  style={{ fontSize: 12 }}
                  title="Kiểu nối giữa các đoạn"
                >
                  <option value="miter">miter</option>
                  <option value="round">round</option>
                  <option value="bevel">bevel</option>
                </select>
              </div>
            )}
          </div>
        )}
        {/* Group properties panel */}
        {selectedId && groups.some(g => g.id === selectedId) && (() => {
          const g = groups.find(gr => gr.id === selectedId)!;
          return (
            <div
              style={{
                width: 260,
                borderLeft: '1px solid #e5e7eb',
                background: '#ffffff',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>Group</strong>
                <button type="button" onClick={() => setSelectedId(null)} style={{ fontSize: 12 }}>Bỏ chọn</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#374151' }}>Vị trí</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={g.translate?.x || 0}
                    onChange={(e) => groupChange({ id: g.id, x: parseFloat(e.target.value) || 0 })}
                    title="X"
                  />
                  <input
                    type="number"
                    style={{ width: 70 }}
                    value={g.translate?.y || 0}
                    onChange={(e) => groupChange({ id: g.id, y: parseFloat(e.target.value) || 0 })}
                    title="Y"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#374151' }}>Góc xoay</label>
                <input
                  type="number"
                  style={{ width: 70 }}
                  value={g.rotation || 0}
                  onChange={(e) => groupChange({ id: g.id, rotation: parseFloat(e.target.value) || 0 })}
                  title="Góc xoay (độ)"
                />
                <button type="button" style={{ fontSize: 11 }} onClick={() => groupChange({ id: g.id, rotation: 0 })}>Reset</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#374151' }}>Scale</label>
                <input
                  type="number"
                  style={{ width: 70 }}
                  step={0.01}
                  value={g.scale?.x ?? 1}
                  onChange={(e) => groupChange({ id: g.id, scaleX: parseFloat(e.target.value) || 1 })}
                  title="Scale X"
                />
                <input
                  type="number"
                  style={{ width: 70 }}
                  step={0.01}
                  value={g.scale?.y ?? 1}
                  onChange={(e) => groupChange({ id: g.id, scaleY: parseFloat(e.target.value) || 1 })}
                  title="Scale Y"
                />
                <button type="button" style={{ fontSize: 11 }} onClick={() => groupChange({ id: g.id, scaleX: 1, scaleY: 1 })}>Reset</button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
