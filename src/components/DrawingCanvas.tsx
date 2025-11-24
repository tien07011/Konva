import { useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setTool } from '../store/uiSlice';
import { LineComponent } from './shapes/LineComponent';
import { CircleComponent } from './shapes/CircleComponent';
import { RectComponent } from './shapes/RectComponent';
import { CurveComponent } from './shapes/CurveComponent';
import { FreehandComponent } from './shapes/FreehandComponent';
import { GroupComponent } from './shapes/GroupComponent';
import { TextComponent } from './shapes/TextComponent';
import type {
  AnyShape,
  LineShape,
  CircleShape,
  RectShape,
  QuadraticCurveShape,
  CubicCurveShape,
  FreehandShape,
  TextShape,
  ShapeGroup,
} from '../types/drawing';
import { startCircle, updateCircleFromCenter, updateCircleFromCorner } from '../utils/circle';
import { isShapeInSelection } from '../utils/selection';

interface DrawingCanvasProps {
  shapes: AnyShape[];
  groups: ShapeGroup[];
  onAddShape: (shape: AnyShape) => void;
  onUpdateShape: (shape: AnyShape) => void;
  selectedId: string | null;
  selectedIds: string[];
  selectedGroupId: string | null;
  onSelectShape: (id: string | null) => void;
  onSelectMultiple: (ids: string[]) => void;
  onSelectGroup: (id: string | null) => void;
  onUpdateGroup: (group: ShapeGroup) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  shapes,
  groups,
  onAddShape,
  onUpdateShape,
  selectedId,
  selectedIds,
  selectedGroupId,
  onSelectShape,
  onSelectMultiple,
  onSelectGroup,
  onUpdateGroup,
}) => {
  const dispatch = useDispatch();
  const { tool, strokeColor, strokeWidth, showGrid } = useSelector((state: RootState) => state.ui);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<AnyShape | null>(null);
  const [textPreview, setTextPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const stageRef = useRef<any>(null);

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Deselect when clicking on empty area
    if (e.target === stage) {
      onSelectShape(null);
      onSelectGroup(null);
    }

    // Selection rectangle mode
    if (tool === 'select') {
      if (e.target === stage) {
        setIsDrawing(true);
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      }
      return;
    }

    if (tool === 'line') {
      setIsDrawing(true);

      const id = `line-${Date.now()}`;
      const newLine: LineShape = {
        id,
        type: 'line',
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        closed: false,
        tension: 0,
      };

      setCurrentShape(newLine);
    } else if (tool === 'freehand') {
      setIsDrawing(true);

      const id = `freehand-${Date.now()}`;
      const newFreehand: FreehandShape = {
        id,
        type: 'freehand',
        points: [pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth,
      };

      setCurrentShape(newFreehand);
    } else if (tool === 'circle') {
      setIsDrawing(true);
      setDragStart({ x: pos.x, y: pos.y });

      const id = `circle-${Date.now()}`;
      const newCircle: CircleShape = startCircle(id, pos.x, pos.y, strokeColor, strokeWidth);
      setCurrentShape(newCircle);
    } else if (tool === 'rect') {
      setIsDrawing(true);

      const id = `rect-${Date.now()}`;
      const newRect: RectShape = {
        id,
        type: 'rect',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: strokeColor,
        strokeWidth,
        fill: undefined,
      };

      setCurrentShape(newRect);
    } else if (tool === 'qcurve') {
      setIsDrawing(true);

      const id = `qcurve-${Date.now()}`;
      const newQ: QuadraticCurveShape = {
        id,
        type: 'qcurve',
        points: [pos.x, pos.y, pos.x, pos.y, pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth,
      };
      setCurrentShape(newQ);
    } else if (tool === 'ccurve') {
      setIsDrawing(true);

      const id = `ccurve-${Date.now()}`;
      const newC: CubicCurveShape = {
        id,
        type: 'ccurve',
        points: [pos.x, pos.y, pos.x, pos.y, pos.x, pos.y, pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth,
      };
      setCurrentShape(newC);
    } else if (tool === 'text') {
      // Start drag for text region selection (defer creating shape until mouse up)
      setIsDrawing(true);
      setDragStart({ x: pos.x, y: pos.y });
      setTextPreview({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: any) => {
    // Selection rectangle path must run even when currentShape is null
    if (tool === 'select' && selectionRect && isDrawing) {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const x = Math.min(selectionRect.x, pos.x);
      const y = Math.min(selectionRect.y, pos.y);
      const width = Math.abs(pos.x - selectionRect.x);
      const height = Math.abs(pos.y - selectionRect.y);

      setSelectionRect({ x, y, width, height });
      return;
    }

    if (tool === 'text' && isDrawing && dragStart && textPreview) {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const startX = dragStart.x;
      const startY = dragStart.y;
      const x = Math.min(startX, pos.x);
      const y = Math.min(startY, pos.y);
      const width = Math.max(20, Math.abs(pos.x - startX));
      const height = Math.max(20, Math.abs(pos.y - startY));
      setTextPreview({ x, y, width, height });
      return;
    }

    if (!isDrawing || !currentShape) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (tool === 'line' && currentShape.type === 'line') {
      const updatedLine: LineShape = {
        ...currentShape,
        points: [currentShape.points[0], currentShape.points[1], pos.x, pos.y],
      };
      setCurrentShape(updatedLine);
    }

    if (tool === 'freehand' && currentShape.type === 'freehand') {
      // Add new point to the freehand line
      const updatedFreehand: FreehandShape = {
        ...currentShape,
        points: [...currentShape.points, pos.x, pos.y],
      };
      setCurrentShape(updatedFreehand);
    }

    if (tool === 'circle' && currentShape.type === 'circle') {
      const alt = !!(e.evt && e.evt.altKey);
      const start = dragStart ?? { x: currentShape.cx, y: currentShape.cy };
      const updatedCircle = alt
        ? updateCircleFromCenter(currentShape, start.x, start.y, pos.x, pos.y)
        : updateCircleFromCorner(currentShape, start.x, start.y, pos.x, pos.y);
      setCurrentShape(updatedCircle);
    }

    if (tool === 'rect' && currentShape.type === 'rect') {
      const startX = currentShape.x;
      const startY = currentShape.y;
      const x = Math.min(startX, pos.x);
      const y = Math.min(startY, pos.y);
      const width = Math.abs(pos.x - startX);
      const height = Math.abs(pos.y - startY);
      const updatedRect: RectShape = {
        ...currentShape,
        x,
        y,
        width,
        height,
      };
      setCurrentShape(updatedRect);
    }

    if (tool === 'qcurve' && currentShape.type === 'qcurve') {
      const sx = currentShape.points[0];
      const sy = currentShape.points[1];
      const ex = pos.x;
      const ey = pos.y;
      const vx = ex - sx;
      const vy = ey - sy;
      const midx = (sx + ex) / 2;
      const midy = (sy + ey) / 2;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      const nx = -vy / len;
      const ny = vx / len;
      const k = 0.4;
      const offset = k * len;
      const cx = midx + nx * offset;
      const cy = midy + ny * offset;
      const updatedQ: QuadraticCurveShape = {
        ...currentShape,
        points: [sx, sy, cx, cy, ex, ey],
      };
      setCurrentShape(updatedQ);
    }

    if (tool === 'ccurve' && currentShape.type === 'ccurve') {
      const sx = currentShape.points[0];
      const sy = currentShape.points[1];
      const ex = pos.x;
      const ey = pos.y;
      const vx = ex - sx;
      const vy = ey - sy;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      const nx = -vy / len;
      const ny = vx / len;
      const k = 0.35;
      const offset = k * len;
      const cx1x = sx + vx * 0.33 + nx * offset;
      const cx1y = sy + vy * 0.33 + ny * offset;
      const cx2x = sx + vx * 0.66 - nx * offset;
      const cx2y = sy + vy * 0.66 - ny * offset;
      const updatedC: CubicCurveShape = {
        ...currentShape,
        points: [sx, sy, cx1x, cx1y, cx2x, cx2y, ex, ey],
      };
      setCurrentShape(updatedC);
    }

    // (text tool handled earlier by preview rectangle)
  };

  const handleMouseUp = () => {
    // Finalize selection rectangle (include grouped shapes with group translation)
    if (tool === 'select' && selectionRect && isDrawing) {
      const selected: string[] = [];
      for (const shape of shapes) {
        // Determine group translation if any
        const grp = groups.find((g) => g.shapeIds.includes(shape.id));
        const offsetX = grp ? grp.x : 0;
        const offsetY = grp ? grp.y : 0;
        // Create adjusted shape clone for selection test
        let adjusted = shape as AnyShape;
        if (shape.type === 'rect') {
          adjusted = { ...shape, x: shape.x + offsetX, y: shape.y + offsetY };
        } else if (shape.type === 'circle') {
          adjusted = { ...shape, cx: shape.cx + offsetX, cy: shape.cy + offsetY };
        } else if (
          shape.type === 'line' ||
          shape.type === 'freehand' ||
          shape.type === 'qcurve' ||
          shape.type === 'ccurve'
        ) {
          adjusted = {
            ...shape,
            points: shape.points.map((v, i) => (i % 2 === 0 ? v + offsetX : v + offsetY)),
          } as AnyShape;
        } else if (shape.type === 'text') {
          adjusted = { ...shape, x: shape.x + offsetX, y: shape.y + offsetY } as AnyShape;
        }
        if (isShapeInSelection(adjusted, selectionRect)) {
          selected.push(shape.id);
        }
      }
      onSelectMultiple(selected);
      setSelectionRect(null);
      setIsDrawing(false);
      return;
    }

    if (tool === 'text' && isDrawing) {
      // Finalize text shape creation from preview
      const region = textPreview;
      const start = dragStart;
      const baseX = start?.x ?? 0;
      const baseY = start?.y ?? 0;
      const finalBox =
        region && region.width >= 5 && region.height >= 5
          ? region
          : { x: baseX, y: baseY, width: 160, height: 40 };
      const id = `text-${Date.now()}`;
      const newText: TextShape = {
        id,
        type: 'text',
        x: finalBox.x,
        y: finalBox.y,
        text: 'Text',
        fontSize: 24,
        fontFamily: 'Arial',
        align: 'left',
        width: finalBox.width,
        height: finalBox.height,
        stroke: strokeColor,
        strokeWidth,
        fill: '#111827',
      };
      onAddShape(newText);
      onSelectShape(newText.id);
      setIsDrawing(false);
      setDragStart(null);
      setTextPreview(null);
      dispatch(setTool('select'));
      return;
    }

    if (!isDrawing || !currentShape) return;

    onAddShape(currentShape);
    setIsDrawing(false);
    setCurrentShape(null);
    setDragStart(null);
    dispatch(setTool('select'));
  };

  const handleDragEnd = (shape: AnyShape) => (e: any) => {
    const node = e.target;

    if (shape.type === 'line') {
      const deltaX = node.x();
      const deltaY = node.y();
      const updatedShape: LineShape = {
        ...shape,
        points: shape.points.map((val, idx) => (idx % 2 === 0 ? val + deltaX : val + deltaY)),
      };
      node.position({ x: 0, y: 0 });
      onUpdateShape(updatedShape);
    }

    if (shape.type === 'circle') {
      // For circle we render node.x/node.y as absolute center, so after drag
      // node.x() already equals the new absolute center. Use that directly.
      const updatedShape: CircleShape = {
        ...shape,
        cx: node.x(),
        cy: node.y(),
      };
      node.position({ x: 0, y: 0 });
      onUpdateShape(updatedShape);
    }

    if (shape.type === 'rect') {
      const updatedShape: RectShape = {
        ...shape,
        x: node.x(),
        y: node.y(),
      };
      node.position({ x: 0, y: 0 });
      onUpdateShape(updatedShape);
    }
    if (shape.type === 'qcurve' || shape.type === 'ccurve') {
      const deltaX = node.x();
      const deltaY = node.y();
      const updatedShape = {
        ...shape,
        points: shape.points.map((v, i) => (i % 2 === 0 ? v + deltaX : v + deltaY)),
      } as QuadraticCurveShape | CubicCurveShape;
      node.position({ x: 0, y: 0 });
      onUpdateShape(updatedShape);
    }
    if (shape.type === 'freehand') {
      const deltaX = node.x();
      const deltaY = node.y();
      const updatedShape: FreehandShape = {
        ...shape,
        points: shape.points.map((v, i) => (i % 2 === 0 ? v + deltaX : v + deltaY)),
      };
      node.position({ x: 0, y: 0 });
      onUpdateShape(updatedShape);
    }
    if (shape.type === 'text') {
      const updatedShape: TextShape = {
        ...shape,
        x: node.x(),
        y: node.y(),
      };
      node.position({ x: 0, y: 0 });
      onUpdateShape(updatedShape);
    }
  };

  const renderShape = (shape: AnyShape) => {
    const isSelected = shape.id === selectedId || selectedIds.includes(shape.id);
    const interactive = tool === 'none' || tool === 'select';

    if (shape.type === 'line') {
      return (
        <LineComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          interactive={interactive}
          onSelect={
            interactive
              ? () => (tool === 'select' ? onSelectShape(shape.id) : onSelectShape(shape.id))
              : undefined
          }
          onDragEnd={handleDragEnd(shape)}
          onChange={(next) => onUpdateShape(next)}
        />
      );
    }

    if (shape.type === 'circle') {
      return (
        <CircleComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          interactive={interactive}
          onSelect={
            interactive
              ? () => (tool === 'select' ? onSelectShape(shape.id) : onSelectShape(shape.id))
              : undefined
          }
          onDragEnd={handleDragEnd(shape)}
          onChange={(next) => onUpdateShape(next)}
        />
      );
    }

    if (shape.type === 'rect') {
      return (
        <RectComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          interactive={interactive}
          onSelect={
            interactive
              ? () => (tool === 'select' ? onSelectShape(shape.id) : onSelectShape(shape.id))
              : undefined
          }
          onDragEnd={handleDragEnd(shape)}
          onChange={(next) => onUpdateShape(next)}
        />
      );
    }

    if (shape.type === 'qcurve' || shape.type === 'ccurve') {
      return (
        <CurveComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          interactive={interactive}
          onSelect={
            interactive
              ? () => (tool === 'select' ? onSelectShape(shape.id) : onSelectShape(shape.id))
              : undefined
          }
          onDragEnd={handleDragEnd(shape)}
          onChange={(next) => onUpdateShape(next)}
        />
      );
    }

    if (shape.type === 'freehand') {
      return (
        <FreehandComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          interactive={interactive}
          onSelect={
            interactive
              ? () => (tool === 'select' ? onSelectShape(shape.id) : onSelectShape(shape.id))
              : undefined
          }
          onDragEnd={handleDragEnd(shape)}
          onChange={(next: AnyShape) => onUpdateShape(next)}
        />
      );
    }

    if (shape.type === 'text') {
      return (
        <TextComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          interactive={interactive}
          onSelect={
            interactive
              ? () => (tool === 'select' ? onSelectShape(shape.id) : onSelectShape(shape.id))
              : undefined
          }
          onDragEnd={handleDragEnd(shape)}
          onChange={(next: AnyShape) => onUpdateShape(next)}
        />
      );
    }

    return null;
  };

  const StageComponent = Stage as any;
  const LayerComponent = Layer as any;

  return (
    <div className={`flex-1 bg-white relative ${showGrid ? 'bg-grid' : ''}`}>
      <StageComponent
        ref={stageRef}
        width={window.innerWidth - 528}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <LayerComponent>
          {groups.map((g) => (
            <GroupComponent
              key={g.id}
              group={g}
              shapes={shapes}
              isSelected={selectedGroupId === g.id}
              onSelect={() => onSelectGroup(g.id)}
              onChange={(updated) => onUpdateGroup(updated)}
              selectedIds={selectedIds}
              onSelectShape={(id) => {
                onSelectShape(id);
                onSelectGroup(null);
              }}
            />
          ))}
          {/* Skip shapes that are members of a group to avoid double render */}
          {shapes.filter((s) => !groups.some((g) => g.shapeIds.includes(s.id))).map(renderShape)}
          {currentShape && renderShape(currentShape)}
          {textPreview && tool === 'text' && (
            <Rect
              x={textPreview.x}
              y={textPreview.y}
              width={textPreview.width}
              height={textPreview.height}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[6, 4]}
              fill="rgba(59,130,246,0.1)"
            />
          )}
          {selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              stroke="rgba(59,130,246,1)" // blue-500
              strokeWidth={1}
              dash={[4, 4]}
              fill="rgba(59,130,246,0.1)"
            />
          )}
        </LayerComponent>
      </StageComponent>
    </div>
  );
};
