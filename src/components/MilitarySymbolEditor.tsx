import React from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { AnyShape, ShapeType } from '../shapes/types';
import { renderShape, createShape, shapeRegistry, normalizeShape as normalizeShapeFromRegistry } from '../shapes/registry';
import ShapePropertiesModal from './ShapePropertiesModal';

const defaultStyles = {
  fill: '#88c0d0',
  stroke: '#2e3440',
  strokeWidth: 2,
};

// Workaround typing friction between React 19, TS 4.9 and react-konva types in CRA
const KStage = Stage as unknown as React.FC<any>;
const KLayer = Layer as unknown as React.FC<any>;
const KImage = KonvaImage as unknown as React.FC<any>;

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
  const stageRef = React.useRef<any>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [stageSize, setStageSize] = React.useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 60 : 700,
  });
  const [shapes, setShapes] = React.useState<AnyShape[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selectedShape = React.useMemo(() => shapes.find((s) => s.id === selectedId) || null, [shapes, selectedId]);
  const [showEditor, setShowEditor] = React.useState(false);
  const [showIO, setShowIO] = React.useState(false);
  const [ioText, setIoText] = React.useState('');
  const [bgDataUrl, setBgDataUrl] = React.useState<string | null>(null);
  const [bgImage, setBgImage] = React.useState<HTMLImageElement | null>(null);

  // Keep stage full-window responsive
  React.useEffect(() => {
    const onResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight - 60 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Helper: tạo hình mặc định ở giữa canvas
  const addDefaultShape = (type: ShapeType) => {
    const stage = stageRef.current;
    const w = stage?.width?.() ?? stageSize.width;
    const h = stage?.height?.() ?? stageSize.height;
    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    const id = `${type}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const created = makeShape(id, type, cx, cy);
    setShapes((prev) => [...prev, created]);
    setSelectedId(id);
  };

  const handleStageMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Nếu click vào vùng trống thì bỏ chọn
    if (e.target === stage) setSelectedId(null);
  };


  const updateShape = (id: string, attrs: Partial<AnyShape>) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...attrs } as AnyShape : s)));
  };

  // Export/Import JSON
  const doExport = () => {
    const obj = { version: 1, createdAt: new Date().toISOString(), background: bgDataUrl || null, shapes };
    setIoText(JSON.stringify(obj, null, 2));
    setShowIO(true);
  };

  // shape import normalization is delegated to modules
  const normalizeShape = (s: any): AnyShape | null => normalizeShapeFromRegistry(s, defaultStyles);

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
    // Background image (data URL) if present
    if (typeof parsed?.background === 'string' && parsed.background.length > 0) {
      setBackgroundFromDataUrl(parsed.background);
    } else {
      clearBackground();
    }
    setShowIO(false);
  };

  // Background helpers
  const setBackgroundFromDataUrl = (dataUrl: string) => {
    const img = new window.Image();
    img.onload = () => {
      setBgImage(img);
      setBgDataUrl(dataUrl);
    };
    img.src = dataUrl;
  };

  const clearBackground = () => {
    setBgImage(null);
    setBgDataUrl(null);
  };

  const onPickBackground = () => {
    fileRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) setBackgroundFromDataUrl(result);
    };
    reader.readAsDataURL(file);
    // reset value so same file can be re-picked
    e.currentTarget.value = '';
  };

  const getBgPlacement = React.useCallback(() => {
    if (!bgImage) return { x: 0, y: 0, width: 0, height: 0 };
    const sw = stageSize.width;
    const sh = stageSize.height;
    const iw = bgImage.width;
    const ih = bgImage.height;
    if (iw === 0 || ih === 0) return { x: 0, y: 0, width: sw, height: sh };
    const scale = Math.max(sw / iw, sh / ih); // cover
    const width = iw * scale;
    const height = ih * scale;
    const x = (sw - width) / 2;
    const y = (sh - height) / 2;
    return { x, y, width, height };
  }, [bgImage, stageSize.width, stageSize.height]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
        {Object.values(shapeRegistry).map((m) => (
          <ToolbarButton key={m.type} onClick={() => addDefaultShape(m.type as any)}>
            {m.label}
          </ToolbarButton>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <ToolbarButton onClick={onPickBackground}>Chọn nền</ToolbarButton>
          <ToolbarButton onClick={clearBackground} disabled={!bgImage}>Xóa nền</ToolbarButton>
          <ToolbarButton onClick={() => setShapes([])}>Clear</ToolbarButton>
          <ToolbarButton onClick={() => setSelectedId(null)}>Deselect</ToolbarButton>
          <ToolbarButton onClick={doExport}>Export</ToolbarButton>
          <ToolbarButton onClick={() => { setIoText(''); setShowIO(true); }}>Import</ToolbarButton>
        </div>
      </div>
      {/* Hidden file input for picking background */}
      <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
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
      <div style={{ flex: 1, position: 'relative' }}>
        <KStage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleStageMouseDown}
          style={{ background: '#f8fafc' }}
        >
          {/* Background layer */}
          <KLayer listening={false}>
            {bgImage && (() => {
              const { x, y, width, height } = getBgPlacement();
              return (
                <KImage image={bgImage} x={x} y={y} width={width} height={height} listening={false} />
              );
            })()}
          </KLayer>
          <KLayer>
            {shapes.map((shape) =>
              renderShape(
                shape,
                shape.id === selectedId,
                () => {
                  setSelectedId(shape.id);
                  setShowEditor(true);
                },
                (attrs) => updateShape(shape.id, attrs as any)
              )
            )}
          </KLayer>
        </KStage>
        {/* Right properties panel */}
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: selectedShape && showEditor ? 420 : 0, transition: 'width 150ms ease', pointerEvents: selectedShape && showEditor ? 'auto' : 'none' }}>
          <ShapePropertiesModal
            shape={selectedShape}
            open={!!selectedShape && showEditor}
            onClose={() => setShowEditor(false)}
            onApply={(patch) => {
              if (!selectedShape) return;
              updateShape(selectedShape.id, patch as any);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MilitarySymbolEditor;

