import React from 'react';
import { Minus, MousePointer, Circle as CircleIcon, Square as RectIcon, Undo, Redo, Trash2, Download, Grid3x3, Pencil } from 'lucide-react';
import { Button } from './ui/button';
import type { ToolType, AnyShape, LineShape } from '../types/drawing';

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
  selectedShape?: AnyShape | null;
  onUpdateSelectedShape?: (shape: AnyShape) => void;
  onDeleteSelected?: () => void;
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
  selectedShape,
  onUpdateSelectedShape,
  onDeleteSelected,
}) => {
  const selectedLine: LineShape | null = selectedShape && selectedShape.type === 'line' ? (selectedShape as LineShape) : null;

  const updateLine = (patch: Partial<LineShape>) => {
    if (!selectedLine || !onUpdateSelectedShape) return;
    onUpdateSelectedShape({ ...selectedLine, ...patch });
  };

  return (
    <div className="w-72 bg-slate-50 border-l border-slate-200 p-4 space-y-6 overflow-y-auto">
      {/* Tools */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Tools</h3>
        <div className="grid grid-cols-3 gap-2">
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
          <Button
            variant={tool === 'freehand' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('freehand')}
            className="justify-start"
          >
            <Pencil size={16} />
            <span className="ml-2">Draw</span>
          </Button>
          <Button
            variant={tool === 'rect' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('rect')}
            className="justify-start"
          >
            <RectIcon size={16} />
            <span className="ml-2">Rect</span>
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('circle')}
            className="justify-start"
          >
            <CircleIcon size={16} />
            <span className="ml-2">Circle</span>
          </Button>
          <Button
            variant={tool === 'qcurve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('qcurve')}
            className="justify-start"
          >
            <Minus size={16} />
            <span className="ml-2">QCurve</span>
          </Button>
          <Button
            variant={tool === 'ccurve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('ccurve')}
            className="justify-start"
          >
            <Minus size={16} />
            <span className="ml-2">CCurve</span>
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

      {/* Line-specific controls */}
      {selectedLine && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Line</h3>
          <div className="space-y-4">
            {/* Line Cap */}
            <div>
              <div className="text-xs text-slate-600 mb-2">Line Cap</div>
              <div className="grid grid-cols-3 gap-2">
                {(['butt','round','square'] as const).map((cap) => (
                  <Button
                    key={cap}
                    variant={selectedLine.lineCap === cap ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateLine({ lineCap: cap })}
                  >
                    {cap}
                  </Button>
                ))}
              </div>
            </div>

            {/* Line Join */}
            <div>
              <div className="text-xs text-slate-600 mb-2">Line Join</div>
              <div className="grid grid-cols-3 gap-2">
                {(['miter','round','bevel'] as const).map((join) => (
                  <Button
                    key={join}
                    variant={selectedLine.lineJoin === join ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateLine({ lineJoin: join })}
                  >
                    {join}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dash presets */}
            <div>
              <div className="text-xs text-slate-600 mb-2">Dash</div>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={!selectedLine.dash || selectedLine.dash.length === 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateLine({ dash: [] })}
                >
                  None
                </Button>
                <Button
                  variant={JSON.stringify(selectedLine.dash) === JSON.stringify([4,4]) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateLine({ dash: [4, 4] })}
                >
                  4-4
                </Button>
                <Button
                  variant={JSON.stringify(selectedLine.dash) === JSON.stringify([8,6]) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateLine({ dash: [8, 6] })}
                >
                  8-6
                </Button>
                <Button
                  variant={JSON.stringify(selectedLine.dash) === JSON.stringify([12,4,2,4]) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateLine({ dash: [12, 4, 2, 4] })}
                >
                  Mix
                </Button>
              </div>
            </div>

            {/* Closed + Tension */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!!selectedLine.closed}
                  onChange={(e) => updateLine({ closed: e.target.checked })}
                />
                Closed (fill)
              </label>
              <div className="flex-1">
                <div className="text-xs text-slate-600 mb-1">Tension: {selectedLine.tension ?? 0}</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedLine.tension ?? 0}
                  onChange={(e) => updateLine({ tension: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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

          {selectedShape && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              className="w-full"
              disabled={!onDeleteSelected}
            >
              <Trash2 size={16} />
              <span className="ml-2">Delete Selected</span>
            </Button>
          )}

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
