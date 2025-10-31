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
}

export const DrawingCanvas = React.forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ strokeColor, strokeWidth, onHistoryChange, tool = 'line' }, ref) => {
    const { shapes, draft, canUndo, canRedo, clear, undo, redo, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd, onLineChange, onShapeUpdate, onRectDragEnd, onRectChange } =
      useDrawing({ tool, stroke: strokeColor, strokeWidth, onHistoryChange });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedShape = useMemo(() => shapes.find((s) => s.id === selectedId) || null, [shapes, selectedId]);

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
            onMouseUp={onMouseUp}
            onLineDragEnd={onLineDragEnd}
            onLineChange={onLineChange}
            onRectDragEnd={onRectDragEnd}
            onRectChange={onRectChange}
            selectedId={selectedId}
            onSelectShape={setSelectedId}
          />
        </div>
        {/* Properties panel */}
        {selectedShape && (
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
