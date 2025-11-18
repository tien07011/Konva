import React from 'react';
import { SymbolLine } from './shapes/SymbolLine';
import { SymbolRect } from './shapes/SymbolRect';
import { SymbolCircle } from './shapes/SymbolCircle';
import { SymbolQuadratic } from './shapes/SymbolQuadratic';
import { SymbolCubic } from './shapes/SymbolCubic';
import type { ToolType } from '../types/drawing';
import { Button } from './ui/button';

interface MenuBarProps {
  strokeColor: string;
  onStrokeColorChange: (c: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (n: number) => void;
  fillColor?: string;
  onFillColorChange?: (c: string) => void;
  tool?: ToolType;
  onToolChange?: (t: ToolType) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

// Khu vực chứa thanh công cụ (UI only)
export const MenuBar: React.FC<MenuBarProps> = ({
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  fillColor = "transparent",
  onFillColorChange,
  tool = "line",
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onClear,
  onExport,
  showGrid = false,
  onToggleGrid,
}) => {
  const toolButton = (active: boolean) =>
    active
      ? "border-blue-600 border-2 bg-blue-50"
      : "border border-gray-300 bg-white";

  return (
    <div
      className="
        flex items-center gap-3 
        px-3 py-1 
        border-b border-gray-200 
        bg-[#fafafa]
        sticky top-0 h-11 z-10
      "
    >
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => onToolChange?.("line")}
          className={`p-1 rounded-lg ${toolButton(tool === "line")}`}
        >
          <SymbolLine stroke={strokeColor} strokeWidth={strokeWidth} />
        </Button>

        <Button
          variant="ghost"
          onClick={() => onToolChange?.("rect")}
          className={`p-1 rounded-lg ${toolButton(tool === "rect")}`}
        >
          <SymbolRect stroke={strokeColor} strokeWidth={strokeWidth} fill={fillColor} />
        </Button>

        <Button
          variant="ghost"
          onClick={() => onToolChange?.("circle")}
          className={`p-1 rounded-lg ${toolButton(tool === "circle")}`}
        >
          <SymbolCircle stroke={strokeColor} strokeWidth={strokeWidth} fill={fillColor} />
        </Button>

        <Button
          variant="ghost"
          onClick={() => onToolChange?.("qcurve")}
          className={`p-1 rounded-lg ${toolButton(tool === "qcurve")}`}
        >
          <SymbolQuadratic stroke={strokeColor} strokeWidth={strokeWidth} />
        </Button>

        <Button
          variant="ghost"
          onClick={() => onToolChange?.("ccurve")}
          className={`p-1 rounded-lg ${toolButton(tool === "ccurve")}`}
        >
          <SymbolCubic stroke={strokeColor} strokeWidth={strokeWidth} />
        </Button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-7 bg-gray-300" />

      {/* Stroke color */}
      <label className="flex items-center gap-2">
        Màu viền
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => onStrokeColorChange(e.target.value)}
          className="h-6 w-6 rounded"
        />
      </label>

      {/* Fill color */}
      <label className="flex items-center gap-2">
        Màu trong
        <input
          type="color"
          value={fillColor === "transparent" ? "#ffffff" : fillColor}
          onChange={(e) => onFillColorChange?.(e.target.value)}
          className="h-6 w-6 rounded"
        />
      </label>

      {/* RIGHT */}
      <div className="ml-auto flex gap-2">
        {/* Grid toggle */}
        <Button
          variant="ghost"
          onClick={onToggleGrid}
          className={`px-3 ${showGrid ? "border-2 border-blue-600 bg-blue-50" : "border border-gray-300 bg-white"}`}
        >
          Lưới
        </Button>

        <Button onClick={onUndo} disabled={!canUndo} variant="outline">
          Undo
        </Button>

        <Button onClick={onRedo} disabled={!canRedo} variant="outline">
          Redo
        </Button>

        <Button variant="outline" onClick={onClear}>
          Xoá
        </Button>

        <Button variant="outline" onClick={onExport}>
          Xuất file
        </Button>
      </div>
    </div>
  );
};
