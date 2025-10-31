import React from 'react';
import { SymbolLine } from './shapes/SymbolLine';

interface MenuBarProps {
  strokeColor: string;
  onStrokeColorChange: (c: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (n: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}

// Khu vực chứa thanh công cụ (UI only)
export const MenuBar: React.FC<MenuBarProps> = ({
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onClear,
  onExport,
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
        zIndex: 10,
      }}
    >
      <SymbolLine stroke={strokeColor} strokeWidth={strokeWidth} />

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

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 220,
        }}
      >
        Nét: {strokeWidth}px
        <input
          type="range"
          min={1}
          max={50}
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(parseInt(e.target.value, 10))}
        />
      </label>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
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
