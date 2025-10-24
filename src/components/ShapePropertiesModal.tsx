import React from 'react';
import { AnyShape, ShapeType } from '../shapes/types';

type Props = {
  shape: AnyShape | null;
  open: boolean;
  onClose: () => void;
  onApply: (patch: Partial<AnyShape>) => void;
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
      { key: 'points', label: 'Points (x0,y0,x1,y1,...)', type: 'text' },
    ],
    arrow: [
      { key: 'points', label: 'Points (x0,y0,x1,y1,...)', type: 'text' },
      { key: 'pointerLength', label: 'Pointer length', type: 'number', step: 1, min: 0 },
      { key: 'pointerWidth', label: 'Pointer width', type: 'number', step: 1, min: 0 },
    ],
    'thick-arrow': [
      { key: 'points', label: 'Endpoints (x1,y1,x2,y2)', type: 'text' },
      { key: 'shaftWidth', label: 'Shaft width', type: 'number', step: 1, min: 0 },
      { key: 'headLength', label: 'Head length', type: 'number', step: 1, min: 0 },
      { key: 'headWidth', label: 'Head width', type: 'number', step: 1, min: 0 },
    ],
    polygon: [
      { key: 'points', label: 'Vertices (x0,y0,x1,y1,...)', type: 'text' },
    ],
    curve: [
      { key: 'points', label: 'Points (x0,y0,x1,y1,...)', type: 'text' },
      { key: 'tension', label: 'Tension (0..1)', type: 'number', step: 0.1, min: 0 },
    ],
    svg: [
      { key: 'width', label: 'Width', type: 'number', step: 1, min: 0 },
      { key: 'height', label: 'Height', type: 'number', step: 1, min: 0 },
      { key: 'svg', label: 'SVG markup', type: 'text' },
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
      base.points = (shape.points || []).join(',');
    } else if (shape.type === 'arrow') {
      base.points = (shape.points || []).join(',');
      base.pointerLength = shape.pointerLength; base.pointerWidth = shape.pointerWidth;
    }
    else if (shape.type === 'thick-arrow') {
      base.points = (shape.points || []).join(',');
      base.shaftWidth = (shape as any).shaftWidth;
      base.headLength = (shape as any).headLength;
      base.headWidth = (shape as any).headWidth;
    }
    else if (shape.type === 'polygon') {
      base.points = (shape.points || []).join(',');
    }
    else if (shape.type === 'curve') {
      base.points = (shape.points || []).join(',');
      (base as any).tension = (shape as any).tension ?? 0.5;
    }
    else if (shape.type === 'svg') {
      (base as any).width = (shape as any).width;
      (base as any).height = (shape as any).height;
      (base as any).svg = (shape as any).svg || '';
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
      const str = String(local.points ?? '').trim();
      const arr = str.split(/[\s,]+/).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      // ensure even length and at least 2 points
      const pts = arr.length >= 4 && arr.length % 2 === 0 ? arr : shape.points;
      patch.points = pts;
    } else if (shape.type === 'arrow') {
      const str = String(local.points ?? '').trim();
      const arr = str.split(/\s*,\s*|\s+/).filter(Boolean).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      const pts = arr.length >= 4 && arr.length % 2 === 0 ? arr : shape.points;
      patch.points = pts;
      patch.pointerLength = clamp(num(local.pointerLength, shape.pointerLength), 0, Infinity);
      patch.pointerWidth = clamp(num(local.pointerWidth, shape.pointerWidth), 0, Infinity);
    } else if (shape.type === 'thick-arrow') {
      const str = String(local.points ?? '').trim();
      const arr = str.split(/\s*,\s*|\s+/).filter(Boolean).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      const pts = arr.length === 4 ? (arr as any) : shape.points;
      (patch as any).points = pts;
      (patch as any).shaftWidth = clamp(num(local.shaftWidth, (shape as any).shaftWidth), 0, Infinity);
      (patch as any).headLength = clamp(num(local.headLength, (shape as any).headLength), 0, Infinity);
      (patch as any).headWidth = clamp(num(local.headWidth, (shape as any).headWidth), 0, Infinity);
    } else if (shape.type === 'polygon') {
      const str = String(local.points ?? '').trim();
      const arr = str.split(/\s*,\s*|\s+/).filter(Boolean).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      const even = arr.length % 2 === 0 ? arr : shape.points;
      patch.points = even.length >= 6 ? even : shape.points;
    } else if (shape.type === 'curve') {
      const str = String(local.points ?? '').trim();
      const arr = str.split(/\s*,\s*|\s+/).filter(Boolean).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      const even = arr.length % 2 === 0 && arr.length >= 4 ? arr : shape.points;
      patch.points = even;
      (patch as any).tension = clamp(num(local.tension, (shape as any).tension ?? 0.5), 0, 1);
    } else if (shape.type === 'svg') {
      (patch as any).width = clamp(num(local.width, (shape as any).width), 0, Infinity);
      (patch as any).height = clamp(num(local.height, (shape as any).height), 0, Infinity);
      (patch as any).svg = typeof local.svg === 'string' && local.svg.trim() ? local.svg : (shape as any).svg;
    }
    onApply(patch);
    onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ fontSize: 16, flex: 1 }}>Edit {shape.type} – {shape.id}</strong>
          <button onClick={onClose} style={styles.iconBtn} aria-label="Close">✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 300, overflow: 'auto' }}>
          {fields.map((f) => (
            <label key={f.key} style={styles.label}>
              <span style={styles.labelText}>{f.label}</span>
              {f.type === 'color' && (
                <input
                  type="color"
                  value={String(local[f.key] ?? '')}
                  onChange={(e) => setLocal((s: any) => ({ ...s, [f.key]: e.target.value }))}
                  style={styles.input}
                />
              )}
              {f.type === 'number' && (
                <input
                  type="number"
                  value={String(local[f.key] ?? '')}
                  step={f.step}
                  min={f.min}
                  onChange={(e) => setLocal((s: any) => ({ ...s, [f.key]: e.target.value }))}
                  style={styles.input}
                />
              )}
              {f.type === 'text' && (
                <textarea
                  value={String(local[f.key] ?? '')}
                  onChange={(e) => setLocal((s: any) => ({ ...s, [f.key]: e.target.value }))}
                  rows={3}
                  style={{ ...styles.input, fontFamily: 'monospace' }}
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
    position: 'fixed', inset: 0, background: 'transparent', zIndex: 50, pointerEvents: 'none',
  },
  modal: {
    position: 'absolute', right: 0, top: 0, height: '100%', width: 420, background: '#fff', boxShadow: '-8px 0 24px rgba(0,0,0,0.08)', padding: 16, borderLeft: '1px solid #e5e7eb', overflow: 'auto', pointerEvents: 'auto',
  },
  label: { display: 'flex', flexDirection: 'column', gap: 4 },
  labelText: { color: '#334155', fontSize: 12 },
  input: { padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' },
  btn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' },
  primary: { background: '#2563eb', color: '#fff', borderColor: '#1d4ed8' },
  iconBtn: { padding: 6, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' },
};
