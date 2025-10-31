import React, { useEffect, useImperativeHandle } from 'react';
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
    const { shapes, draft, canUndo, canRedo, clear, undo, redo, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd } =
      useDrawing({ tool, stroke: strokeColor, strokeWidth, onHistoryChange });

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
          });
          return JSON.stringify(screen, null, 2);
        },
      }),
      [clear, undo, redo]
    );

    return (
      <CanvasArea
        shapes={shapes}
        draft={draft}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onLineDragEnd={onLineDragEnd}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
