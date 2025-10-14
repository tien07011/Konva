import React from 'react';
import { Stage, Layer } from 'react-konva';
import { AnyShape, ShapeType } from '../shapes/types';
import { renderShape, createShape, updateOnDraw as updateOnDrawFromModule, isValidAfterDraw, shapeRegistry } from '../shapes/registry';

type Tool = ShapeType | 'select';

const defaultStyles = {
  fill: '#88c0d0',
  stroke: '#2e3440',
  strokeWidth: 2,
};

// Workaround typing friction between React 19, TS 4.9 and react-konva types in CRA
const KStage = Stage as unknown as React.FC<any>;
const KLayer = Layer as unknown as React.FC<any>;

// Factory: delegated to module registry
function makeShape(id: string, type: ShapeType, x: number, y: number): AnyShape {
  return createShape(type, id, x, y, defaultStyles);
}

const ToolbarButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({ active, children, ...props }) => (
  <button
    {...props}
    style={{
      padding: '6px 10px',
      marginRight: 8,
      borderRadius: 6,
      border: active ? '2px solid #2e3440' : '1px solid #cbd5e1',
      background: active ? '#e5e9f0' : '#fff',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

const MilitarySymbolEditor: React.FC = () => {
  const [tool, setTool] = React.useState<Tool>('select');
  const [shapes, setShapes] = React.useState<AnyShape[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [drawing, setDrawing] = React.useState<{
    id: string;
    type: ShapeType;
    startX: number;
    startY: number;
  } | null>(null);
  const [showIO, setShowIO] = React.useState(false);
  const [ioText, setIoText] = React.useState('');

  // Editor không còn thêm trực tiếp; tạo qua drag logic

  const handleStageMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (tool === 'select') {
      // Nếu click vào vùng trống thì bỏ chọn
      if (e.target === stage) setSelectedId(null);
      return;
    }

    // Bắt đầu vẽ: tạo shape tạm với id và set drawing state
    const id = `${tool}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const type = tool as ShapeType;
    const sx = pointer.x;
    const sy = pointer.y;
    const base = makeShape(id, type, sx, sy);

    // Khởi tạo kích thước nhỏ để hiển thị ngay
    setShapes((prev) => {
      const initial = (() => {
        if (type === 'rectangle') return { ...base, width: 1, height: 1 } as AnyShape;
        if (type === 'ellipse') return { ...base, radiusX: 1, radiusY: 1 } as AnyShape;
        return base;
      })();
      return [...prev, initial];
    });
    setDrawing({ id, type, startX: sx, startY: sy });
  };

  const handleStageMouseMove = (e: any) => {
    if (!drawing) return;
    const stage = e.target.getStage();
    const p = stage.getPointerPosition();
    if (!p) return;
    setShapes((prev) => prev.map((s) => {
      if (s.id !== drawing.id) return s;
      const patch = updateOnDrawFromModule(s, { start: { x: drawing.startX, y: drawing.startY }, current: { x: p.x, y: p.y } });
      return { ...s, ...patch } as AnyShape;
    }));
  };

  const finalizeDrawing = React.useCallback((cancel: boolean) => {
    if (!drawing) return;
    setShapes((prev) => {
      if (cancel) return prev.filter((s) => s.id !== drawing.id);
      // Loại bỏ shape quá nhỏ theo module rule
      return prev.filter((s) => (s.id !== drawing.id ? true : isValidAfterDraw(s)));
    });
    if (!cancel) {
      setSelectedId(drawing.id);
      setTool('select');
    }
    setDrawing(null);
  }, [drawing, setShapes]);

  const handleStageMouseUp = (e: any) => {
    if (!drawing) return;
    finalizeDrawing(false);
  };

  // ESC to cancel current drawing
  React.useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && drawing) {
        finalizeDrawing(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawing, finalizeDrawing]);

  const updateShape = (id: string, attrs: Partial<AnyShape>) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...attrs } as AnyShape : s)));
  };

  // Export/Import JSON
  const doExport = () => {
    const obj = { version: 1, createdAt: new Date().toISOString(), shapes };
    setIoText(JSON.stringify(obj, null, 2));
    setShowIO(true);
  };

  const normalizeShape = (s: any): AnyShape | null => {
    if (!s || typeof s !== 'object') return null;
    if (!s.id || !s.type) return null;
    // backward compat: map legacy 'circle' to 'ellipse'
    const normalizedType = s.type === 'circle' ? 'ellipse' : s.type;
    if (!(normalizedType in shapeRegistry)) return null;
    const base = {
      id: String(s.id),
      type: normalizedType as ShapeType,
      x: Number(s.x) || 0,
      y: Number(s.y) || 0,
      rotation: Number(s.rotation) || 0,
      fill: typeof s.fill === 'string' ? s.fill : defaultStyles.fill,
      stroke: typeof s.stroke === 'string' ? s.stroke : defaultStyles.stroke,
      strokeWidth: Number(s.strokeWidth) || defaultStyles.strokeWidth,
    } as any;
    if (normalizedType === 'rectangle') {
      const w = Number(s.width) || 0; const h = Number(s.height) || 0;
      return w > 0 && h > 0 ? ({ ...base, width: w, height: h } as AnyShape) : null;
    }
    if (normalizedType === 'ellipse') {
      // support both legacy circle and new ellipse fields
      const radiusX = s.radiusX != null ? Number(s.radiusX) : Number(s.radius) || 0;
      const radiusY = s.radiusY != null ? Number(s.radiusY) : Number(s.radius) || 0;
      return radiusX > 0 && radiusY > 0 ? ({ ...base, radiusX, radiusY } as AnyShape) : null;
    }
    if (normalizedType === 'line') {
      const pts: number[] = Array.isArray(s.points) ? s.points.map((n: any) => Number(n) || 0) : [0, 0, Number(s.dx) || 0, Number(s.dy) || 0];
      // Ensure 4 numbers
      const points: [number, number, number, number] = [pts[0] || 0, pts[1] || 0, pts[2] || 0, pts[3] || 0];
      return ({ ...base, points } as AnyShape);
    }
    if (normalizedType === 'arrow') {
      const pts: number[] = Array.isArray(s.points) ? s.points.map((n: any) => Number(n) || 0) : [0, 0, Number(s.dx) || 0, Number(s.dy) || 0];
      const points: [number, number, number, number] = [pts[0] || 0, pts[1] || 0, pts[2] || 0, pts[3] || 0];
      const pointerLength = s.pointerLength != null ? Number(s.pointerLength) : 14;
      const pointerWidth = s.pointerWidth != null ? Number(s.pointerWidth) : 12;
      return ({ ...base, points, pointerLength, pointerWidth } as AnyShape);
    }
    return null;
  };

  const doImport = () => {
    let parsed: any;
    try {
      parsed = JSON.parse(ioText);
    } catch (e) {
      alert('JSON không hợp lệ');
      return;
    }
    const list = Array.isArray(parsed?.shapes) ? parsed.shapes : Array.isArray(parsed) ? parsed : [];
    const next: AnyShape[] = [];
    for (const raw of list) {
      const n = normalizeShape(raw);
      if (n) next.push(n);
    }
    setShapes(next);
    setSelectedId(null);
    setTool('select');
    setShowIO(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
        <ToolbarButton active={tool === 'select'} onClick={() => setTool('select')}>Select</ToolbarButton>
        {Object.values(shapeRegistry).map((m) => (
          <ToolbarButton key={m.type} active={tool === m.type} onClick={() => setTool(m.type)}>
            {m.label}
          </ToolbarButton>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <ToolbarButton onClick={() => setShapes([])}>Clear</ToolbarButton>
          <ToolbarButton onClick={() => setSelectedId(null)}>Deselect</ToolbarButton>
          <ToolbarButton onClick={doExport}>Export</ToolbarButton>
          <ToolbarButton onClick={() => { setIoText(''); setShowIO(true); }}>Import</ToolbarButton>
        </div>
      </div>
      {showIO && (
        <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
          <textarea
            value={ioText}
            onChange={(e) => setIoText(e.target.value)}
            rows={10}
            style={{ flex: 1, width: '100%', fontFamily: 'monospace' }}
            placeholder='{"version":1,"shapes":[...]}'
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={doExport}>Export</button>
            <button onClick={doImport}>Import</button>
            <button onClick={() => setShowIO(false)}>Close</button>
          </div>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <KStage
          width={window.innerWidth}
          height={window.innerHeight - 60}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={handleStageMouseMove}
          onTouchEnd={handleStageMouseUp}
          style={{ background: '#f8fafc' }}
        >
          <KLayer listening={tool === 'select' && !drawing}>
            {shapes.map((shape) =>
              renderShape(
                shape,
                shape.id === selectedId,
                () => {
                  setSelectedId(shape.id);
                  setTool('select');
                },
                (attrs) => updateShape(shape.id, attrs as any)
              )
            )}
          </KLayer>
        </KStage>
      </div>
    </div>
  );
};

export default MilitarySymbolEditor;

