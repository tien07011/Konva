import React from 'react';
import { Minus, MousePointer, Undo, Redo, Trash2, Download, Grid3x3 } from 'lucide-react';
import { Button } from './ui/button';
import type { ToolType } from '../types/drawing';

interface ToolbarProps {
  tool: ToolType;
  onToolChange: (tool: ToolType) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}

const commonColors = [
  '#111827',
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onToolChange,
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  fillColor,
  onFillColorChange,
  showGrid,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExport,
}) => {
  return (
    <div className="w-72 bg-slate-50 border-l border-slate-200 p-4 space-y-6 overflow-y-auto">
      {/* Tools */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={tool === 'none' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('none')}
            className="justify-start"
          >
            <MousePointer size={16} />
            <span className="ml-2">Select</span>
          </Button>
          <Button
            variant={tool === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('line')}
            className="justify-start"
          >
            <Minus size={16} />
            <span className="ml-2">Line</span>
          </Button>
        </div>
      </div>

      {/* Stroke Color */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Stroke Color</h3>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {commonColors.map((color) => (
            <button
              key={color}
              onClick={() => onStrokeColorChange(color)}
              className={`w-10 h-10 rounded border-2 ${
                strokeColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300'
              } hover:scale-110 transition-transform`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => onStrokeColorChange(e.target.value)}
          className="w-full h-10 rounded border border-slate-300 cursor-pointer"
        />
      </div>

      {/* Stroke Width */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Stroke Width: {strokeWidth}px
        </h3>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Actions</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex-1"
            >
              <Undo size={16} />
              <span className="ml-2">Undo</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex-1"
            >
              <Redo size={16} />
              <span className="ml-2">Redo</span>
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onToggleGrid} className="w-full">
            <Grid3x3 size={16} />
            <span className="ml-2">{showGrid ? 'Hide' : 'Show'} Grid</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onClear} className="w-full">
            <Trash2 size={16} />
            <span className="ml-2">Clear All</span>
          </Button>

          <Button variant="default" size="sm" onClick={onExport} className="w-full">
            <Download size={16} />
            <span className="ml-2">Export JSON</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
