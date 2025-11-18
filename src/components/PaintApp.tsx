import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { DrawingCanvas } from './DrawingCanvas';
import { Toolbar } from './Toolbar';
import { setTool, setStrokeColor, setStrokeWidth, setFillColor, toggleGrid } from '../store/uiSlice';
import { addShape, updateShape, selectShape, clearShapes, undo, redo } from '../store/shapesSlice';
import type { AnyShape } from '../types/drawing';

export const PaintApp: React.FC = () => {
  const dispatch = useDispatch();

  // UI state
  const { strokeColor, strokeWidth, fillColor, tool, showGrid } = useSelector(
    (state: RootState) => state.ui,
  );

  // Shapes state
  const { shapes, selectedId, historyIndex, history } = useSelector(
    (state: RootState) => state.shapes,
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handlers
  const handleAddShape = (shape: AnyShape) => {
    dispatch(addShape(shape));
  };

  const handleUpdateShape = (shape: AnyShape) => {
    dispatch(updateShape(shape));
  };

  const handleSelectShape = (id: string | null) => {
    dispatch(selectShape(id));
  };

  const handleUndo = () => {
    dispatch(undo());
  };

  const handleRedo = () => {
    dispatch(redo());
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all shapes?')) {
      dispatch(clearShapes());
    }
  };

  const handleExport = () => {
    // TODO: Implement export logic
    const json = JSON.stringify(shapes, null, 2);
    console.log('Export JSON:', json);
    
    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <div className="flex-1 flex flex-col">
        {/* Canvas */}
        <DrawingCanvas
          shapes={shapes}
          onAddShape={handleAddShape}
          onUpdateShape={handleUpdateShape}
          selectedId={selectedId}
          onSelectShape={handleSelectShape}
        />
      </div>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        onToolChange={(t) => dispatch(setTool(t))}
        strokeColor={strokeColor}
        onStrokeColorChange={(c) => dispatch(setStrokeColor(c))}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={(w) => dispatch(setStrokeWidth(w))}
        fillColor={fillColor}
        onFillColorChange={(c) => dispatch(setFillColor(c))}
        showGrid={showGrid}
        onToggleGrid={() => dispatch(toggleGrid())}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
      />
    </div>
  );
};
