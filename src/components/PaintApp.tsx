import React, { useRef } from 'react';
import { MenuBar } from './MenuBar';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';
import type { ToolType } from '../types/drawing';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setStrokeColor, setStrokeWidth, setFillColor, setTool, toggleGrid, setHistoryFlags } from '../store/uiSlice';

export const PaintApp: React.FC = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);

  const { strokeColor, strokeWidth, fillColor, tool, showGrid, canUndo, canRedo } = useSelector(
    (state: RootState) => state.ui,
  );

  const exportJSON = () => {
    const json = canvasRef.current?.exportJSON();
    if (!json) return;

    const blob = new Blob([json], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    const pad = (n: number) => String(n).padStart(2, "0");

    const t = new Date();
    const filename = `screen-${
      t.getFullYear()
      }${pad(t.getMonth() + 1)}${pad(t.getDate())}-${pad(
      t.getHours()
      )}${pad(t.getMinutes())}${pad(t.getSeconds())}.json`;

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };


  return (
    <div className="flex flex-col h-screen bg-slate-100">
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
        onExport={() => exportJSON()}
        showGrid={showGrid}
        onToggleGrid={() => dispatch(toggleGrid())}
      />

      <div className="flex flex-1">
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
