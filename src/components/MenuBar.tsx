import React from 'react';
import { SymbolLine } from './shapes/SymbolLine';
import { SymbolRect } from './shapes/SymbolRect';
import { SymbolCircle } from './shapes/SymbolCircle';
import { SymbolQuadratic } from './shapes/SymbolQuadratic';
import { SymbolCubic } from './shapes/SymbolCubic';
import type { ToolType } from '../types/drawing';

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
  fillColor = 'transparent',
  onFillColorChange,
  tool = 'line',
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
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fafafa',
        position: 'sticky',
        top: 0,
        height: 44,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => onToolChange?.('line')}
          aria-pressed={tool === 'line'}
          title="Công cụ: Vẽ đường"
          style={{
            padding: 4,
            border: tool === 'line' ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: 8,
            background: tool === 'line' ? '#eff6ff' : '#ffffff',
          }}
        >
          <SymbolLine stroke={strokeColor} strokeWidth={strokeWidth} />
        </button>
        <button
          type="button"
          onClick={() => onToolChange?.('rect')}
          aria-pressed={tool === 'rect'}
          title="Công cụ: Hình chữ nhật"
          style={{
            padding: 4,
            border: tool === 'rect' ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: 8,
            background: tool === 'rect' ? '#eff6ff' : '#ffffff',
          }}
        >
          <SymbolRect stroke={strokeColor} strokeWidth={strokeWidth} fill={fillColor} />
        </button>
        <button
          type="button"
          onClick={() => onToolChange?.('circle')}
          aria-pressed={tool === 'circle'}
          title="Công cụ: Hình tròn"
          style={{
            padding: 4,
            border: tool === 'circle' ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: 8,
            background: tool === 'circle' ? '#eff6ff' : '#ffffff',
          }}
        >
          <SymbolCircle stroke={strokeColor} strokeWidth={strokeWidth} fill={fillColor} />
        </button>
        <button
          type="button"
          onClick={() => onToolChange?.('qcurve')}
          aria-pressed={tool === 'qcurve'}
          title="Công cụ: Đường cong bậc 2"
          style={{
            padding: 4,
            border: tool === 'qcurve' ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: 8,
            background: tool === 'qcurve' ? '#eff6ff' : '#ffffff',
          }}
        >
          <SymbolQuadratic stroke={strokeColor} strokeWidth={strokeWidth} />
        </button>
        <button
          type="button"
          onClick={() => onToolChange?.('ccurve')}
          aria-pressed={tool === 'ccurve'}
          title="Công cụ: Đường cong bậc 3"
          style={{
            padding: 4,
            border: tool === 'ccurve' ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: 8,
            background: tool === 'ccurve' ? '#eff6ff' : '#ffffff',
          }}
        >
          <SymbolCubic stroke={strokeColor} strokeWidth={strokeWidth} />
        </button>
      </div>

      <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Màu viền
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => onStrokeColorChange(e.target.value)}
          title="Màu viền"
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Màu trong
        <input
          type="color"
          value={fillColor === 'transparent' ? '#ffffff' : fillColor}
          onChange={(e) => onFillColorChange?.(e.target.value)}
          title="Màu tô bên trong"
        />
        <button
          type="button"
          style={{ fontSize: 11 }}
          onClick={() => onFillColorChange?.('transparent')}
          title="Không tô màu"
        >
          Xoá
        </button>
      </label>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onToggleGrid}
          aria-pressed={showGrid}
          title="Bật/tắt lưới"
          style={{
            padding: '4px 10px',
            border: showGrid ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: 6,
            background: showGrid ? '#eff6ff' : '#ffffff',
          }}
        >
          Lưới
        </button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" onClick={onClear}>
          Xoá
        </button>
        <button type="button" onClick={onExport}>
          Xuất file
        </button>
      </div>
    </div>
  );
};
