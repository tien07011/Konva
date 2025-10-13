import React from 'react';
import { Stage, Layer, Rect, Circle, Ellipse, Line, Arrow, Text, Transformer, RegularPolygon, Star } from 'react-konva';

// Shape schema: { id, type, x, y, width, height, rotation, points, text, style: { stroke, strokeWidth, fill, dash } }
// Supported types: 'rect' | 'ellipse' | 'circle' | 'line' | 'arrow' | 'text' | 'polyline' | 'polygon' | 'regularPolygon' | 'star'

const genId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function useSelectedTransformer(selectedId, nodeRef) {
  const transformerRef = React.useRef();
  React.useEffect(() => {
    const tr = transformerRef.current;
    const node = nodeRef?.current || null;
    if (tr && node && selectedId === node?.attrs?.id) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, nodeRef]);
  return transformerRef;
}

function Selectable({ isSelected, nodeRef, children }) {
  const transformerRef = useSelectedTransformer(isSelected ? nodeRef.current?.attrs?.id : null, nodeRef);
  return (
    <>
      {children}
      {isSelected && <Transformer ref={transformerRef} rotateEnabled enabledAnchors={["top-left","top-right","bottom-left","bottom-right"]} />}
    </>
  );
}

function NumberInput({ label, value, onChange, step = 1, min, max }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 90 }}>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = e.target.value === '' ? '' : Number(e.target.value);
          onChange(isNaN(v) ? undefined : v);
        }}
        style={{ width: 120 }}
      />
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 90 }}>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 180 }}
      />
    </label>
  );
}

function PropertiesPanel({ shape, onChange, onTogglePointEdit, isEditingPoints }) {
  if (!shape) return (
    <div style={{ padding: 12, fontSize: 13, color: '#555' }}>Chọn một hình để chỉnh sửa</div>
  );

  const style = shape.style || {};
  const dashStr = (style.dash || []).join(',');

  const setStyle = (patch) => onChange({ style: { ...style, ...patch } });

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 600 }}>Properties</div>
      <div style={{ fontSize: 12, color: '#666' }}>Type: {shape.type}</div>

      <NumberInput label="X" value={shape.x} onChange={(v) => v !== undefined && onChange({ x: v })} />
      <NumberInput label="Y" value={shape.y} onChange={(v) => v !== undefined && onChange({ y: v })} />
      <NumberInput label="Rotation" value={shape.rotation || 0} onChange={(v) => v !== undefined && onChange({ rotation: v })} />

      <TextInput label="Stroke" value={style.stroke || ''} onChange={(v) => setStyle({ stroke: v })} placeholder="#2b3a67 | red | rgba(...)" />
      <NumberInput label="StrokeWidth" value={style.strokeWidth || 1} onChange={(v) => v !== undefined && setStyle({ strokeWidth: Math.max(0, v) })} />
      <TextInput label="Fill" value={style.fill || ''} onChange={(v) => setStyle({ fill: v })} placeholder="#88aaff22 | transparent" />
      <TextInput label="Dash" value={dashStr} onChange={(v) => {
        const arr = (v || '')
          .split(',')
          .map((n) => Number(n.trim()))
          .filter((n) => !isNaN(n) && n >= 0);
        setStyle({ dash: arr });
      }} placeholder="4,4" />

      {(shape.type === 'rect' || shape.type === 'ellipse' || shape.type === 'circle' || shape.type === 'text') && (
        <>
          <NumberInput label="Width" value={shape.width} onChange={(v) => v !== undefined && onChange({ width: Math.max(1, v) })} />
          <NumberInput label="Height" value={shape.height} onChange={(v) => v !== undefined && onChange({ height: Math.max(1, v) })} />
        </>
      )}

      {shape.type === 'text' && (
        <TextInput label="Text" value={shape.text || ''} onChange={(v) => onChange({ text: v })} />
      )}

      {shape.type === 'regularPolygon' && (
        <>
          <NumberInput label="Sides" value={shape.sides || 5} onChange={(v) => v !== undefined && onChange({ sides: Math.max(3, Math.round(v)) })} />
          <NumberInput label="Radius" value={shape.radius || 50} onChange={(v) => v !== undefined && onChange({ radius: Math.max(1, v) })} />
        </>
      )}

      {shape.type === 'star' && (
        <>
          <NumberInput label="Points" value={shape.numPoints || 5} onChange={(v) => v !== undefined && onChange({ numPoints: Math.max(2, Math.round(v)) })} />
          <NumberInput label="InnerR" value={shape.innerRadius || 20} onChange={(v) => v !== undefined && onChange({ innerRadius: Math.max(1, v) })} />
          <NumberInput label="OuterR" value={shape.outerRadius || 50} onChange={(v) => v !== undefined && onChange({ outerRadius: Math.max(1, v) })} />
        </>
      )}

      {(shape.type === 'line' || shape.type === 'arrow' || shape.type === 'polyline' || shape.type === 'polygon') && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={onTogglePointEdit}>{isEditingPoints ? 'Done Editing Points' : 'Edit Points'}</button>
        </div>
      )}
    </div>
  );
}

function Toolbar({ onAdd, onDelete, onBringFront, onSendBack, onClear, onExport, onImport, selected, onTogglePointEdit, onAddPoint, onRemovePoint, isEditingPoints }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8, borderBottom: '1px solid #eee', alignItems: 'center' }}>
      <strong>Shapes:</strong>
      <button onClick={() => onAdd('rect')}>Rect</button>
      <button onClick={() => onAdd('ellipse')}>Ellipse</button>
      <button onClick={() => onAdd('circle')}>Circle</button>
      <button onClick={() => onAdd('line')}>Line</button>
      <button onClick={() => onAdd('arrow')}>Arrow</button>
      <button onClick={() => onAdd('text')}>Text</button>
      <button onClick={() => onAdd('polyline')}>Polyline</button>
      <button onClick={() => onAdd('polygon')}>Polygon</button>
      <button onClick={() => onAdd('regularPolygon')}>Regular Polygon</button>
      <button onClick={() => onAdd('star')}>Star</button>
      <span style={{ marginLeft: 16 }} />
      <button onClick={onDelete}>Delete</button>
      <button onClick={onBringFront}>Bring to Front</button>
      <button onClick={onSendBack}>Send to Back</button>
      <button onClick={onClear}>Clear</button>
      <span style={{ marginLeft: 16 }} />
      <button onClick={onExport}>Export JSON</button>
      <button onClick={onImport}>Import JSON</button>
      {!!selected && (selected.type === 'polyline' || selected.type === 'polygon' || selected.type === 'line' || selected.type === 'arrow') && (
        <>
          <span style={{ marginLeft: 16 }} />
          <strong>Points:</strong>
          <button onClick={onTogglePointEdit}>{isEditingPoints ? 'Done Editing' : 'Edit Points'}</button>
          <button onClick={onAddPoint}>Add Point</button>
          <button onClick={onRemovePoint}>Remove Point</button>
        </>
      )}
    </div>
  );
}

export default function MilitarySymbolEditor() {
  const stageRef = React.useRef();
  const layerRef = React.useRef();

  const [shapes, setShapes] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [exportJson, setExportJson] = React.useState('');
  const [showIO, setShowIO] = React.useState(false);
  const [pointEdit, setPointEdit] = React.useState({ id: null, prevRotation: 0 });
  const [snapEnabled, setSnapEnabled] = React.useState(true);
  const [grid, setGrid] = React.useState(20);

  const defaultStyle = { stroke: '#2b3a67', strokeWidth: 2, fill: '#88aaff22', dash: [] };

  const addShape = (type) => {
    const id = genId();
    const base = { id, type, x: 80, y: 80, rotation: 0, style: { ...defaultStyle } };
    let s;
    switch (type) {
      case 'rect':
        s = { ...base, width: 120, height: 80 };
        break;
      case 'ellipse':
        s = { ...base, width: 120, height: 80 };
        break;
      case 'circle':
        s = { ...base, width: 80, height: 80 };
        break;
      case 'line':
        s = { ...base, points: [0, 0, 120, 0] };
        break;
      case 'arrow':
        s = { ...base, points: [0, 0, 140, 0] };
        break;
      case 'text':
        s = { ...base, text: 'Label', width: 120, height: 30 };
        break;
      case 'polyline':
        s = { ...base, points: [0, 0, 120, 0, 160, 40] };
        break;
      case 'polygon':
        s = { ...base, points: [0, 0, 120, 0, 120, 80, 0, 80] };
        break;
      case 'regularPolygon':
        s = { ...base, sides: 5, radius: 50 };
        break;
      case 'star':
        s = { ...base, numPoints: 5, innerRadius: 20, outerRadius: 50 };
        break;
      default:
        return;
    }
    setShapes((prev) => [...prev, s]);
    setSelectedId(id);
  };

  const updateShape = (id, patch) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    setShapes((prev) => {
      const idx = prev.findIndex((s) => s.id === selectedId);
      if (idx < 0) return prev;
      const arr = prev.slice();
      const [item] = arr.splice(idx, 1);
      arr.push(item);
      return arr;
    });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    setShapes((prev) => {
      const idx = prev.findIndex((s) => s.id === selectedId);
      if (idx < 0) return prev;
      const arr = prev.slice();
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return arr;
    });
  };

  const clearAll = () => {
    setShapes([]);
    setSelectedId(null);
  };

  const doExport = () => {
    const obj = { version: 1, createdAt: new Date().toISOString(), shapes };
    const json = JSON.stringify(obj, null, 2);
    setExportJson(json);
    setShowIO(true);
  };

  const doImport = () => {
    let parsed = null;
    try {
      parsed = JSON.parse(exportJson);
    } catch (e) {
      alert('Invalid JSON');
      return;
    }
    if (!parsed || !Array.isArray(parsed.shapes)) {
      alert('JSON must contain { shapes: [...] }');
      return;
    }
    setShapes(parsed.shapes);
    setShowIO(false);
  };

  const width = 960;
  const height = 540;

  const snap = React.useCallback((n) => {
    if (!snapEnabled || grid <= 1) return n;
    return Math.round(n / grid) * grid;
  }, [snapEnabled, grid]);

  // Deselect when clicking on empty area
  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  // Coordinate transforms (local <-> world) respecting shape rotation
  const toWorld = React.useCallback((lx, ly, s) => {
    const t = ((s.rotation || 0) * Math.PI) / 180;
    const dx = lx * Math.cos(t) - ly * Math.sin(t);
    const dy = lx * Math.sin(t) + ly * Math.cos(t);
    return { x: s.x + dx, y: s.y + dy };
  }, []);

  const toLocal = React.useCallback((wx, wy, s) => {
    const t = ((s.rotation || 0) * Math.PI) / 180;
    const dx = wx - s.x;
    const dy = wy - s.y;
    const lx = dx * Math.cos(t) + dy * Math.sin(t);
    const ly = -dx * Math.sin(t) + dy * Math.cos(t);
    return { x: lx, y: ly };
  }, []);

  return (
    <div>
      <Toolbar
        onAdd={addShape}
        onDelete={handleDelete}
        onBringFront={bringToFront}
        onSendBack={sendToBack}
        onClear={clearAll}
        onExport={doExport}
        onImport={() => setShowIO(true)}
        selected={shapes.find((s) => s.id === selectedId) || null}
        isEditingPoints={pointEdit.id === selectedId && !!pointEdit.id}
        onTogglePointEdit={() => {
          const s = shapes.find((x) => x.id === selectedId);
          if (!s || (s.type !== 'polyline' && s.type !== 'polygon' && s.type !== 'line' && s.type !== 'arrow')) return;
          if (pointEdit.id === selectedId) {
            setPointEdit({ id: null, prevRotation: 0 });
          } else {
            setPointEdit({ id: selectedId, prevRotation: s.rotation || 0 });
          }
        }}
        onAddPoint={() => {
          const s = shapes.find((x) => x.id === selectedId);
          if (!s || !Array.isArray(s.points)) return;
          const pts = s.points.slice();
          if (pts.length >= 2) {
            const lastX = pts[pts.length - 2];
            const lastY = pts[pts.length - 1];
            pts.push(lastX + 40, lastY);
          } else {
            pts.push(40, 0);
          }
          updateShape(s.id, { points: pts });
        }}
        onRemovePoint={() => {
          const s = shapes.find((x) => x.id === selectedId);
          if (!s || !Array.isArray(s.points)) return;
          const min = s.type === 'polygon' ? 6 : 4; // polygon needs >= 3 points (6 numbers); line/arrow/polyline needs >= 2 points (4 numbers)
          if (s.points.length > min) {
            updateShape(s.id, { points: s.points.slice(0, -2) });
          }
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px dashed #eee', background: '#fafafa' }}>
        <strong>Grid:</strong>
        <button onClick={() => setSnapEnabled((v) => !v)} style={{ fontWeight: snapEnabled ? 'bold' : 'normal' }}>
          {snapEnabled ? 'Snap ON' : 'Snap OFF'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Size</span>
          <input
            type="number"
            min={2}
            step={2}
            value={grid}
            onChange={(e) => {
              const val = Number(e.target.value);
              setGrid(Number.isFinite(val) && val >= 2 ? Math.floor(val) : 20);
            }}
            style={{ width: 80 }}
          />
        </label>
      </div>

      {showIO && (
        <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
          <div style={{ marginBottom: 6 }}>
            <strong>JSON</strong>
          </div>
          <textarea
            value={exportJson}
            onChange={(e) => setExportJson(e.target.value)}
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace' }}
            placeholder="Paste JSON here or click Export JSON"
          />
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            <button onClick={doExport}>Export JSON</button>
            <button onClick={doImport}>Import JSON</button>
            <button onClick={() => setShowIO(false)}>Close</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, padding: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Stage
            ref={stageRef}
            width={width}
            height={height}
            style={{ border: '1px solid #ddd', background: '#f9fbff' }}
            onMouseDown={handleStageMouseDown}
          >
            {/* Grid overlay layer (non-interactive) */}
            <Layer listening={false}>
              {(() => {
                const lines = [];
                const colorMajor = '#e5eaf2';
                const colorMinor = '#f2f5fa';
                for (let x = 0; x <= width; x += grid) {
                  const major = x % (grid * 5) === 0;
                  lines.push(
                    <Line key={`v-${x}`} points={[x, 0, x, height]} stroke={major ? colorMajor : colorMinor} strokeWidth={major ? 1.2 : 1} />
                  );
                }
                for (let y = 0; y <= height; y += grid) {
                  const major = y % (grid * 5) === 0;
                  lines.push(
                    <Line key={`h-${y}`} points={[0, y, width, y]} stroke={major ? colorMajor : colorMinor} strokeWidth={major ? 1.2 : 1} />
                  );
                }
                return lines;
              })()}
            </Layer>

            <Layer ref={layerRef}>
            {shapes.map((s) => {
              const common = {
                id: s.id,
                x: s.x,
                y: s.y,
                rotation: s.rotation || 0,
                draggable: true,
                  dragBoundFunc: (pos) => ({ x: snap(pos.x), y: snap(pos.y) }),
                  onDragEnd: (e) => updateShape(s.id, { x: snap(e.target.x()), y: snap(e.target.y()) }),
                onClick: () => setSelectedId(s.id),
                onTap: () => setSelectedId(s.id),
              };
              const style = s.style || {};
              const nodeRef = React.createRef();
              const isSelected = selectedId === s.id;

              const onTransformEnd = (e) => {
                const node = nodeRef.current;
                if (!node) return;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                // reset scale to 1 and apply to width/height
                node.scaleX(1);
                node.scaleY(1);
                if (s.type === 'rect' || s.type === 'ellipse' || s.type === 'circle' || s.type === 'text') {
                  const newW = Math.max(5, node.width() * scaleX);
                  const newH = Math.max(5, node.height() * scaleY);
                  updateShape(s.id, { width: snap(newW), height: snap(newH), rotation: node.rotation(), x: snap(node.x()), y: snap(node.y()) });
                } else if (s.type === 'regularPolygon') {
                  const newRadius = Math.max(5, (node.radius ? node.radius() : 50) * Math.max(scaleX, scaleY));
                  updateShape(s.id, { radius: snap(newRadius), rotation: node.rotation(), x: snap(node.x()), y: snap(node.y()) });
                } else if (s.type === 'star') {
                  const newOuter = Math.max(5, (node.outerRadius ? node.outerRadius() : s.outerRadius || 50) * Math.max(scaleX, scaleY));
                  const newInner = Math.max(2, (node.innerRadius ? node.innerRadius() : s.innerRadius || 20) * Math.max(scaleX, scaleY));
                  updateShape(s.id, { outerRadius: snap(newOuter), innerRadius: snap(newInner), rotation: node.rotation(), x: snap(node.x()), y: snap(node.y()) });
                } else if (s.type === 'line' || s.type === 'arrow' || s.type === 'polyline' || s.type === 'polygon') {
                  // scale points
                  const pts = (s.points || []).slice();
                  for (let i = 0; i < pts.length; i += 2) {
                    pts[i] = snap(pts[i] * scaleX);
                    pts[i + 1] = snap(pts[i + 1] * scaleY);
                  }
                  updateShape(s.id, { points: pts, rotation: node.rotation(), x: snap(node.x()), y: snap(node.y()) });
                }
              };

              switch (s.type) {
                case 'rect':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Rect
                        ref={nodeRef}
                        {...common}
                        width={s.width}
                        height={s.height}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        fill={style.fill}
                        dash={style.dash}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'ellipse':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Ellipse
                        ref={nodeRef}
                        {...common}
                        radiusX={(s.width || 100) / 2}
                        radiusY={(s.height || 60) / 2}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        fill={style.fill}
                        dash={style.dash}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'circle':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Circle
                        ref={nodeRef}
                        {...common}
                        radius={(Math.max(s.width || 80, s.height || 80)) / 2}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        fill={style.fill}
                        dash={style.dash}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'regularPolygon':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <RegularPolygon
                        ref={nodeRef}
                        {...common}
                        sides={s.sides || 5}
                        radius={s.radius || 50}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        fill={style.fill}
                        dash={style.dash}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'star':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Star
                        ref={nodeRef}
                        {...common}
                        numPoints={s.numPoints || 5}
                        innerRadius={s.innerRadius || 20}
                        outerRadius={s.outerRadius || 50}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        fill={style.fill}
                        dash={style.dash}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'line':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Line
                        ref={nodeRef}
                        {...common}
                        points={s.points}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        dash={style.dash}
                        tension={0}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'arrow':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Arrow
                        ref={nodeRef}
                        {...common}
                        points={s.points}
                        stroke={style.stroke}
                        fill={style.stroke}
                        strokeWidth={style.strokeWidth}
                        pointerLength={12}
                        pointerWidth={12}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'polyline':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Line
                        ref={nodeRef}
                        {...common}
                        points={s.points}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        dash={style.dash}
                        tension={0}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'polygon':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Line
                        ref={nodeRef}
                        {...common}
                        points={s.points}
                        closed
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        fill={style.fill}
                        dash={style.dash}
                        tension={0}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                case 'text':
                  return (
                    <Selectable key={s.id} isSelected={isSelected} nodeRef={nodeRef}>
                      <Text
                        ref={nodeRef}
                        {...common}
                        text={s.text || 'Label'}
                        fontSize={18}
                        width={s.width}
                        height={s.height}
                        fill={style.stroke}
                        onDblClick={() => {
                          const value = window.prompt('Edit text', s.text || '');
                          if (value != null) updateShape(s.id, { text: value });
                        }}
                        onTransformEnd={onTransformEnd}
                      />
                    </Selectable>
                  );
                default:
                  return null;
              }
            })}

            {/* Vertex anchors for line-like shapes (shown when such a shape is selected or point-edit is toggled) */}
            {(() => {
              const sid = pointEdit.id || selectedId;
              const s = shapes.find((x) => x.id === sid);
              if (!s || !Array.isArray(s.points)) return null;
              if (!(s.type === 'line' || s.type === 'arrow' || s.type === 'polyline' || s.type === 'polygon')) return null;
              const items = [];
              for (let i = 0; i < s.points.length; i += 2) {
                const world = toWorld(s.points[i], s.points[i + 1], s);
                const idx = i / 2;
                items.push(
                  <Circle
                    key={`anchor-${s.id}-${idx}`}
                    x={world.x}
                    y={world.y}
                    radius={6}
                    fill="#ffffff"
                    stroke="#1976d2"
                    strokeWidth={2}
                    draggable
                    dragBoundFunc={(pos) => ({ x: snap(pos.x), y: snap(pos.y) })}
                    onDragMove={(e) => {
                      const pos = e.target.position();
                      const local = toLocal(pos.x, pos.y, s);
                      const pts = s.points.slice();
                      pts[i] = local.x;
                      pts[i + 1] = local.y;
                      updateShape(s.id, { points: pts });
                    }}
                  />
                );
              }
              return items;
            })()}
            </Layer>
          </Stage>
        </div>
        <div style={{ width: 300, border: '1px solid #eee', borderRadius: 6, background: '#fff' }}>
          <PropertiesPanel
            shape={shapes.find((s) => s.id === selectedId) || null}
            isEditingPoints={pointEdit.id === selectedId && !!pointEdit.id}
            onTogglePointEdit={() => {
              const s = shapes.find((x) => x.id === selectedId);
              if (!s || (s.type !== 'polyline' && s.type !== 'polygon' && s.type !== 'line' && s.type !== 'arrow')) return;
              if (pointEdit.id === selectedId) {
                updateShape(selectedId, { rotation: pointEdit.prevRotation });
                setPointEdit({ id: null, prevRotation: 0 });
              } else {
                setPointEdit({ id: selectedId, prevRotation: s.rotation || 0 });
                updateShape(selectedId, { rotation: 0 });
              }
            }}
            onChange={(patch) => {
              const id = selectedId;
              if (!id) return;
              updateShape(id, patch);
            }}
          />
        </div>
      </div>
    </div>
  );
}
