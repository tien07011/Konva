import React, { useRef, useState } from 'react';
import { MenuBar } from './MenuBar';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';
import type { ToolType } from '../types/drawing';

export const PaintApp: React.FC = () => {
  // UI state only (chỉ vẽ đường)
  const [strokeColor, setStrokeColor] = useState<string>('#111827');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [tool, setTool] = useState<ToolType>('line');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // History flags
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
        onStrokeColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        fillColor={fillColor}
        onFillColorChange={setFillColor}
        tool={tool}
        onToolChange={setTool}
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
        onToggleGrid={() => setShowGrid((g) => !g)}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <DrawingCanvas
          ref={canvasRef}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          fillColor={fillColor}
          tool={tool}
          onToolChange={setTool}
          onHistoryChange={({ canUndo, canRedo }) => {
            setCanUndo(canUndo);
            setCanRedo(canRedo);
          }}
          showGrid={showGrid}
        />
      </div>
    </div>
  );
};
