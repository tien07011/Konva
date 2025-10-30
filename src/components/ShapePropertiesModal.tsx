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
    path: [
      { key: 'd', label: 'Path d', type: 'text' },
    ],
    svg: [
      { key: 'width', label: 'Width', type: 'number', step: 1, min: 0 },
      { key: 'height', label: 'Height', type: 'number', step: 1, min: 0 },
      { key: 'svg', label: 'SVG markup', type: 'text' },
    ],
    text: [], // not used currently
    group: [],
  };
  return [...common, ...byType[shape.type]];
}

type Adapter = {
  toLocal?: (shape: AnyShape) => Record<string, any>;
  toPatch?: (local: any, shape: AnyShape) => Partial<AnyShape>;
};

const adapters: Record<ShapeType, Adapter> = {
  rectangle: {
    toLocal: (shape) => ({ width: (shape as any).width, height: (shape as any).height }),
    toPatch: (local, shape) => ({
      width: clamp(num(local.width, (shape as any).width), 0, Infinity),
      height: clamp(num(local.height, (shape as any).height), 0, Infinity),
    }),
  },
  ellipse: {
    toLocal: (shape) => ({ radiusX: (shape as any).radiusX, radiusY: (shape as any).radiusY }),
    toPatch: (local, shape) => ({
      radiusX: clamp(num(local.radiusX, (shape as any).radiusX), 0, Infinity),
      radiusY: clamp(num(local.radiusY, (shape as any).radiusY), 0, Infinity),
    }),
  },
  diamond: {
    toLocal: (shape) => ({ width: (shape as any).width, height: (shape as any).height }),
    toPatch: (local, shape) => ({
      width: clamp(num(local.width, (shape as any).width), 0, Infinity),
      height: clamp(num(local.height, (shape as any).height), 0, Infinity),
    }),
  },
  line: {
    toLocal: (shape) => ({ points: ((shape as any).points || []).join(',') }),
    toPatch: (local, shape) => {
      const arr = parseNumbers(local.points);
      const pts = arr.length >= 4 && arr.length % 2 === 0 ? arr : (shape as any).points;
      return { points: pts } as Partial<AnyShape>;
    },
  },
  arrow: {
    toLocal: (shape) => ({
      points: ((shape as any).points || []).join(','),
      pointerLength: (shape as any).pointerLength,
      pointerWidth: (shape as any).pointerWidth,
    }),
    toPatch: (local, shape) => {
      const arr = parseNumbers(local.points);
      const pts = arr.length >= 4 && arr.length % 2 === 0 ? arr : (shape as any).points;
      return {
        points: pts,
        pointerLength: clamp(num(local.pointerLength, (shape as any).pointerLength), 0, Infinity),
        pointerWidth: clamp(num(local.pointerWidth, (shape as any).pointerWidth), 0, Infinity),
      } as Partial<AnyShape>;
    },
  },
  'thick-arrow': {
    toLocal: (shape) => ({
      points: ((shape as any).points || []).join(','),
      shaftWidth: (shape as any).shaftWidth,
      headLength: (shape as any).headLength,
      headWidth: (shape as any).headWidth,
    }),
    toPatch: (local, shape) => {
      const arr = parseNumbers(local.points);
      const pts = arr.length === 4 ? (arr as any) : (shape as any).points;
      return {
        points: pts,
        shaftWidth: clamp(num(local.shaftWidth, (shape as any).shaftWidth), 0, Infinity),
        headLength: clamp(num(local.headLength, (shape as any).headLength), 0, Infinity),
        headWidth: clamp(num(local.headWidth, (shape as any).headWidth), 0, Infinity),
      } as Partial<AnyShape>;
    },
  },
  polygon: {
    toLocal: (shape) => ({ points: ((shape as any).points || []).join(',') }),
    toPatch: (local, shape) => {
      const arr = parseNumbers(local.points);
      const even = arr.length % 2 === 0 ? arr : (shape as any).points;
      const pts = even.length >= 6 ? even : (shape as any).points;
      return { points: pts } as Partial<AnyShape>;
    },
  },
  curve: {
    toLocal: (shape) => ({
      points: ((shape as any).points || []).join(','),
      tension: (shape as any).tension ?? 0.5,
    }),
    toPatch: (local, shape) => {
      const arr = parseNumbers(local.points);
      const even = arr.length % 2 === 0 && arr.length >= 4 ? arr : (shape as any).points;
      return {
        points: even,
        tension: clamp(num(local.tension, (shape as any).tension ?? 0.5), 0, 1),
      } as Partial<AnyShape>;
    },
  },
  path: {
    toLocal: (shape) => ({
      d: (shape as any).d || '',
    }),
    toPatch: (local, shape) => ({
      d: typeof local.d === 'string' && local.d.trim() ? local.d : (shape as any).d,
    }) as Partial<AnyShape>,
  },
  svg: {
    toLocal: (shape) => ({
      width: (shape as any).width,
      height: (shape as any).height,
      svg: (shape as any).svg || '',
    }),
    toPatch: (local, shape) => ({
      width: clamp(num(local.width, (shape as any).width), 0, Infinity),
      height: clamp(num(local.height, (shape as any).height), 0, Infinity),
      svg: typeof local.svg === 'string' && local.svg.trim() ? local.svg : (shape as any).svg,
    }) as Partial<AnyShape>,
  },
  text: {},
  group: {},
};

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
    const extra = adapters[shape.type]?.toLocal?.(shape) ?? {};
    setLocal({ ...base, ...extra });
  }, [shape?.id, open]);

  if (!open || !shape) return null;

  const fields = getFieldsFor(shape);

  const apply = () => {
    const basePatch: any = {
      x: num(local.x, shape.x),
      y: num(local.y, shape.y),
      rotation: num(local.rotation, shape.rotation ?? 0),
      fill: local.fill ?? shape.fill,
      stroke: local.stroke ?? shape.stroke,
      strokeWidth: num(local.strokeWidth, shape.strokeWidth),
    };
    const extraPatch = adapters[shape.type]?.toPatch?.(local, shape) ?? {};
    const patch = { ...basePatch, ...extraPatch } as Partial<AnyShape>;
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

function parseNumbers(v: any): number[] {
  const str = String(v ?? '').trim();
  if (!str) return [];
  return str
    .split(/\s*,\s*|\s+/)
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
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
