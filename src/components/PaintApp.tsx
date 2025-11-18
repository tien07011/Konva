import React, { useRef } from 'react';
import { MenuBar } from './MenuBar';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';
import type { ToolType } from '../types/drawing';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setStrokeColor, setStrokeWidth, setFillColor, setTool, toggleGrid, setHistoryFlags } from '../store/uiSlice';

export const PaintApp: React.FC = () => {
  const dispatch = useDispatch();
  const { strokeColor, strokeWidth, fillColor, tool, showGrid, canUndo, canRedo } = useSelector(
    (state: RootState) => state.ui,
  );

  const canvasRef = useRef<DrawingCanvasHandle | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f1f5f9',
      }}
    >
      <MenuBar
        strokeColor={strokeColor}
        onStrokeColorChange={(c) => dispatch(setStrokeColor(c))}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={(w) => dispatch(setStrokeWidth(w))}
        fillColor={fillColor}
        onFillColorChange={(f) => dispatch(setFillColor(f))}
        tool={tool}
        onToolChange={(t: ToolType) => dispatch(setTool(t))}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onClear={() => canvasRef.current?.clear()}
        onExport={() => {
          const json = canvasRef.current?.exportJSON();
          if (!json) return;
          const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ts = new Date();
          const pad = (n: number) => String(n).padStart(2, '0');
          const name = `screen-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
        }}
        showGrid={showGrid}
        onToggleGrid={() => dispatch(toggleGrid())}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <DrawingCanvas
          ref={canvasRef}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          fillColor={fillColor}
          tool={tool}
          onToolChange={(t: ToolType) => dispatch(setTool(t))}
          onHistoryChange={({ canUndo, canRedo }) => {
            dispatch(setHistoryFlags({ canUndo, canRedo }));
          }}
          showGrid={showGrid}
        />
      </div>
    </div>
  );
};
