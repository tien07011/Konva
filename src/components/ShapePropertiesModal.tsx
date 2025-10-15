import React from 'react';
import { AnyShape, ShapeType } from '../shapes/types';

type Props = {
  shape: AnyShape | null;
  open: boolean;
  onClose: () => void;
  onApply: (patch: Partial<AnyShape>) => void;
  onApplyAll?: (patch: Partial<AnyShape>) => void; // optional: apply all changes at once
};

type Field = {
  key: string;
  label: string;
  type: 'number' | 'text' | 'color';
  step?: number;
  min?: number;
};

function getFieldsFor(shape: AnyShape | null): Field[] {
  if (!shape) return [];
  const common: Field[] = [
    { key: 'x', label: 'X', type: 'number', step: 1 },
    { key: 'y', label: 'Y', type: 'number', step: 1 },
    { key: 'rotation', label: 'Rotation', type: 'number', step: 1 },
    { key: 'fill', label: 'Fill', type: 'color' },
    { key: 'stroke', label: 'Stroke', type: 'color' },
    { key: 'strokeWidth', label: 'Stroke width', type: 'number', step: 1, min: 0 },
  ];
  const byType: Record<ShapeType, Field[]> = {
    rectangle: [
      { key: 'width', label: 'Width', type: 'number', step: 1, min: 0 },
      { key: 'height', label: 'Height', type: 'number', step: 1, min: 0 },
    ],
    ellipse: [
      { key: 'radiusX', label: 'Radius X', type: 'number', step: 1, min: 0 },
      { key: 'radiusY', label: 'Radius Y', type: 'number', step: 1, min: 0 },
    ],
    diamond: [
      { key: 'width', label: 'Width', type: 'number', step: 1, min: 0 },
      { key: 'height', label: 'Height', type: 'number', step: 1, min: 0 },
    ],
    line: [
      { key: 'dx', label: 'Delta X (x2)', type: 'number', step: 1 },
      { key: 'dy', label: 'Delta Y (y2)', type: 'number', step: 1 },
    ],
    arrow: [
      { key: 'dx', label: 'Delta X (x2)', type: 'number', step: 1 },
      { key: 'dy', label: 'Delta Y (y2)', type: 'number', step: 1 },
      { key: 'pointerLength', label: 'Pointer length', type: 'number', step: 1, min: 0 },
      { key: 'pointerWidth', label: 'Pointer width', type: 'number', step: 1, min: 0 },
    ],
    text: [], // not used currently
  };
  return [...common, ...byType[shape.type]];
}

const Modal: React.FC<Props> = ({ shape, open, onClose, onApply }) => {
  const [local, setLocal] = React.useState<any>({});

  React.useEffect(() => {
    if (!shape) return;
    const base: any = {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation ?? 0,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    };
    if (shape.type === 'rectangle') {
      base.width = shape.width; base.height = shape.height;
    } else if (shape.type === 'ellipse') {
      base.radiusX = shape.radiusX; base.radiusY = shape.radiusY;
    } else if (shape.type === 'diamond') {
      base.width = shape.width; base.height = shape.height;
    } else if (shape.type === 'line') {
      const [, , dx, dy] = shape.points;
      base.dx = dx; base.dy = dy;
    } else if (shape.type === 'arrow') {
      const [, , dx, dy] = shape.points;
      base.dx = dx; base.dy = dy;
      base.pointerLength = shape.pointerLength; base.pointerWidth = shape.pointerWidth;
    }
    setLocal(base);
  }, [shape?.id, open]);

  if (!open || !shape) return null;

  const fields = getFieldsFor(shape);

  const apply = () => {
    const patch: any = {
      x: num(local.x, shape.x),
      y: num(local.y, shape.y),
      rotation: num(local.rotation, shape.rotation ?? 0),
      fill: local.fill ?? shape.fill,
      stroke: local.stroke ?? shape.stroke,
      strokeWidth: num(local.strokeWidth, shape.strokeWidth),
    };
    if (shape.type === 'rectangle') {
      patch.width = clamp(num(local.width, shape.width), 0, Infinity);
      patch.height = clamp(num(local.height, shape.height), 0, Infinity);
    } else if (shape.type === 'ellipse') {
      patch.radiusX = clamp(num(local.radiusX, shape.radiusX), 0, Infinity);
      patch.radiusY = clamp(num(local.radiusY, shape.radiusY), 0, Infinity);
    } else if (shape.type === 'diamond') {
      patch.width = clamp(num(local.width, shape.width), 0, Infinity);
      patch.height = clamp(num(local.height, shape.height), 0, Infinity);
    } else if (shape.type === 'line') {
      const dx = num(local.dx, shape.points[2]);
      const dy = num(local.dy, shape.points[3]);
      patch.points = [0, 0, dx, dy];
    } else if (shape.type === 'arrow') {
      const dx = num(local.dx, shape.points[2]);
      const dy = num(local.dy, shape.points[3]);
      patch.points = [0, 0, dx, dy];
      patch.pointerLength = clamp(num(local.pointerLength, shape.pointerLength), 0, Infinity);
      patch.pointerWidth = clamp(num(local.pointerWidth, shape.pointerWidth), 0, Infinity);
    }
    onApply(patch);
    onClose();
  };

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ fontSize: 16, flex: 1 }}>Edit {shape.type} – {shape.id}</strong>
          <button onClick={onClose} style={styles.iconBtn} aria-label="Close">✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 300, overflow: 'auto' }}>
          {fields.map((f) => (
            <label key={f.key} style={styles.label}>
              <span style={styles.labelText}>{f.label}</span>
              {f.type === 'color' ? (
                <input
                  type="color"
                  value={String(local[f.key] ?? '')}
                  onChange={(e) => setLocal((s: any) => ({ ...s, [f.key]: e.target.value }))}
                  style={styles.input}
                />
              ) : (
                <input
                  type="number"
                  value={String(local[f.key] ?? '')}
                  step={f.step}
                  min={f.min}
                  onChange={(e) => setLocal((s: any) => ({ ...s, [f.key]: e.target.value }))}
                  style={styles.input}
                />
              )}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={styles.btn}>Cancel</button>
          <button onClick={apply} style={{ ...styles.btn, ...styles.primary }}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

function num(v: any, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
  modal: {
    width: 420, background: '#fff', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: 16, border: '1px solid #e5e7eb',
  },
  label: { display: 'flex', flexDirection: 'column', gap: 4 },
  labelText: { color: '#334155', fontSize: 12 },
  input: { padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' },
  btn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' },
  primary: { background: '#2563eb', color: '#fff', borderColor: '#1d4ed8' },
  iconBtn: { padding: 6, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' },
};
