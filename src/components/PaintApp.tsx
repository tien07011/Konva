import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { DrawingCanvas } from './DrawingCanvas';
import { Toolbar } from './Toolbar';
import { setTool, setStrokeColor, setStrokeWidth, setFillColor, toggleGrid } from '../store/uiSlice';
import { 
  addShape, 
  updateShape, 
  updateShapes,
  selectShape, 
  selectMultipleShapes,
  selectGroup,
  createGroup,
  updateGroup,
  ungroupShapes,
  clearShapes, 
  undo, 
  redo, 
  deleteShape,
  importData
} from '../store/shapesSlice';
import type { AnyShape, ShapeGroup } from '../types/drawing';

export const PaintApp: React.FC = () => {
  const dispatch = useDispatch();

  const { strokeColor, strokeWidth, fillColor, tool, showGrid } = useSelector(
    (state: RootState) => state.ui,
  );

    const { shapes, groups, selectedId, selectedIds, selectedGroupId, historyIndex, history } = useSelector(
      (state: RootState) => state.shapes
    );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const selectedShape = selectedId ? shapes.find((s) => s.id === selectedId) ?? null : null;

  const handleAddShape = (shape: AnyShape) => {
    dispatch(addShape(shape));
  };

  const handleUpdateShape = (shape: AnyShape) => {
    dispatch(updateShape(shape));
  };

  const handleSelectShape = (id: string | null) => {
    dispatch(selectShape(id));
  };

    const handleSelectMultiple = (ids: string[]) => {
      dispatch(selectMultipleShapes(ids));
    };

    const handleSelectGroup = (id: string | null) => {
      dispatch(selectGroup(id));
    };

    const handleCreateGroup = () => {
      if (selectedIds.length >= 2) {
        dispatch(createGroup({ name: undefined }));
      }
    };

    const handleUpdateGroup = (group: ShapeGroup) => {
      dispatch(updateGroup(group));
    };

    const handleUngroupShapes = () => {
      if (selectedGroupId) {
        dispatch(ungroupShapes(selectedGroupId));
      }
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

  const handleDeleteSelected = () => {
    if (selectedId) {
      dispatch(deleteShape(selectedId));
      dispatch(selectShape(null));
    } else if (selectedGroupId) {
      dispatch(ungroupShapes(selectedGroupId));
      dispatch(selectGroup(null));
    }
  };

  const handleExport = () => {
    const exportData = {
      shapes,
      groups
    };
    const json = JSON.stringify(exportData, null, 2);
    console.log('Export JSON:', json);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const data = JSON.parse(json);
          
          // Support both old format (array of shapes) and new format (object with shapes and groups)
          if (Array.isArray(data)) {
            dispatch(importData({ shapes: data, groups: [] }));
          } else if (data.shapes) {
            dispatch(importData({ shapes: data.shapes, groups: data.groups || [] }));
          } else {
            alert('Invalid JSON format');
          }
        } catch (error) {
          console.error('Import error:', error);
          alert('Failed to import file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  useEffect(() => {
    if (!selectedId) return;
    const sel = shapes.find((s) => s.id === selectedId);
    if (!sel) return;

    if ('stroke' in sel && sel.stroke && sel.stroke !== strokeColor) {
      dispatch(setStrokeColor(sel.stroke));
    }
    if (
      'strokeWidth' in sel &&
      typeof sel.strokeWidth === 'number' &&
      sel.strokeWidth !== strokeWidth
    ) {
      dispatch(setStrokeWidth(sel.strokeWidth));
    }
    if ('fill' in sel) {
      const fill = (sel as any).fill ?? 'transparent';
      if (fill !== fillColor) {
        dispatch(setFillColor(fill));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

    // When a group is selected, populate the toolbar with the first child's styles
    useEffect(() => {
      if (!selectedGroupId) return;
      const group = groups.find((g) => g.id === selectedGroupId);
      if (!group) return;
      const firstShape = shapes.find((s) => s.id === group.shapeIds[0]);
      if (!firstShape) return;

      if ('stroke' in firstShape && firstShape.stroke && firstShape.stroke !== strokeColor) {
        dispatch(setStrokeColor(firstShape.stroke));
      }
      if (
        'strokeWidth' in firstShape &&
        typeof firstShape.strokeWidth === 'number' &&
        firstShape.strokeWidth !== strokeWidth
      ) {
        dispatch(setStrokeWidth(firstShape.strokeWidth));
      }
      if ('fill' in firstShape) {
        const fill = (firstShape as any).fill ?? 'transparent';
        if (fill !== fillColor) {
          dispatch(setFillColor(fill));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedGroupId]);

    // Apply toolbar changes to all shapes in selected group
    useEffect(() => {
      if (!selectedGroupId) return;
      const group = groups.find((g) => g.id === selectedGroupId);
      if (!group) return;

      const updated: AnyShape[] = [];
      group.shapeIds.forEach((id) => {
        const s = shapes.find((sh) => sh.id === id);
        if (!s) return;
        const currentFill = (s as any).fill ?? 'transparent';
        const needsUpdate = s.stroke !== strokeColor || s.strokeWidth !== strokeWidth || currentFill !== fillColor;
        if (needsUpdate) {
          updated.push({
            ...s,
            stroke: strokeColor,
            strokeWidth,
            fill: fillColor,
          });
        }
      });

      if (updated.length > 0) {
        dispatch(updateShapes(updated));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strokeColor, strokeWidth, fillColor, selectedGroupId]);

  useEffect(() => {
    if (!selectedId) return;
    const sel = shapes.find((s) => s.id === selectedId);
    if (!sel) return;

    const currentFill = (sel as any).fill ?? 'transparent';
    const needsUpdate =
      sel.stroke !== strokeColor || sel.strokeWidth !== strokeWidth || currentFill !== fillColor;

    if (!needsUpdate) return;

    dispatch(
      updateShape({
        ...sel,
        stroke: strokeColor,
        strokeWidth,
        fill: fillColor,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeColor, strokeWidth, fillColor, selectedId]);

  // Keyboard delete handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const editable = target.isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return; // don't interfere with typing
      }
      dispatch(deleteShape(selectedId));
      dispatch(selectShape(null));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, selectedId]);

  return (
    <div className="flex h-screen bg-slate-100">
      <div className="flex-1 flex flex-col">
        <DrawingCanvas
          shapes={shapes}
            groups={groups}
          onAddShape={handleAddShape}
          onUpdateShape={handleUpdateShape}
          selectedId={selectedId}
            selectedIds={selectedIds}
            selectedGroupId={selectedGroupId}
          onSelectShape={handleSelectShape}
            onSelectMultiple={handleSelectMultiple}
            onSelectGroup={handleSelectGroup}
            onUpdateGroup={handleUpdateGroup}
        />
      </div>

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
        onImport={handleImport}
        selectedShape={selectedShape}
          selectedIds={selectedIds}
          selectedGroupId={selectedGroupId}
          onCreateGroup={handleCreateGroup}
          onUngroupShapes={handleUngroupShapes}
        onUpdateSelectedShape={(shape: AnyShape) => dispatch(updateShape(shape))}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  );
};
