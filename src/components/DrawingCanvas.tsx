import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { CanvasArea } from './CanvasArea';
import { useDrawing } from '../hooks/useDrawing';
import type { ToolType } from '../types/drawing';
import { buildScreenFromShapes } from '../utils/export';

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
    const { shapes, draft, canUndo, canRedo, clear, undo, redo, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd, onLineChange, onShapeUpdate, onRectDragEnd, onRectChange } =
      useDrawing({ tool, stroke: strokeColor, strokeWidth, onHistoryChange });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const selectedShape = useMemo(() => shapes.find((s) => s.id === selectedIds[0]) || null, [shapes, selectedIds]);

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
          const screen = buildScreenFromShapes(shapes, {
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <CanvasArea
            shapes={shapes}
            draft={draft}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={(e: any) => {
              const hadDraft = !!draft;
              onMouseUp(e);
              if (hadDraft) {
                setSelectedIds([]);
                onToolChange?.('none');
              }
            }}
            onLineDragEnd={onLineDragEnd}
            onLineChange={onLineChange}
            onRectDragEnd={onRectDragEnd}
            onRectChange={onRectChange}
            selectedIds={selectedIds}
            onSelectShape={(id, append) => {
              if (append) setSelectedIds((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
              else setSelectedIds([id]);
            }}
            onSetSelection={(ids) => setSelectedIds(ids)}
            onClearSelection={() => setSelectedIds([])}
            selectMode={tool === 'none'}
          />
        </div>
        {/* Properties panel */}
        {selectedShape && selectedIds.length === 1 && (
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
              <button type="button" onClick={() => setSelectedIds([])} style={{ fontSize: 12 }}>Bỏ chọn</button>
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

            {/* Future: rotation
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#374151' }}>Góc xoay</label>
              <input
                type="number"
                value={selectedShape.rotation ?? 0}
                onChange={(e) => onShapeUpdate({ id: selectedShape.id, rotation: parseFloat(e.target.value) || 0 })}
              />
            </div>
            */}
          </div>
        )}
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
