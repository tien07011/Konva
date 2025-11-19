import { useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setTool } from '../store/uiSlice';
import { LineComponent } from './shapes/LineComponent';
import { CircleComponent } from './shapes/CircleComponent';
import { RectComponent } from './shapes/RectComponent';
import { CurveComponent } from './shapes/CurveComponent';
import type {
  AnyShape,
  LineShape,
  CircleShape,
  RectShape,
  QuadraticCurveShape,
  CubicCurveShape,
} from '../types/drawing';

interface DrawingCanvasProps {
  shapes: AnyShape[];
  onAddShape: (shape: AnyShape) => void;
  onUpdateShape: (shape: AnyShape) => void;
  selectedId: string | null;
  onSelectShape: (id: string | null) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  shapes,
  onAddShape,
  onUpdateShape,
  selectedId,
  onSelectShape,
}) => {
  const dispatch = useDispatch();
  const { tool, strokeColor, strokeWidth, showGrid } = useSelector(
    (state: RootState) => state.ui,
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<AnyShape | null>(null);
  const stageRef = useRef<any>(null);

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Deselect when clicking on empty area
    if (e.target === stage) {
      onSelectShape(null);
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
    } else if (tool === 'circle') {
      setIsDrawing(true);

      const id = `circle-${Date.now()}`;
      const newCircle: CircleShape = {
        id,
        type: 'circle',
        cx: pos.x,
        cy: pos.y,
        r: 0,
        stroke: strokeColor,
        strokeWidth,
        fill: undefined,
      };

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
    }
  };

  const handleMouseMove = (e: any) => {
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

    if (tool === 'circle' && currentShape.type === 'circle') {
      const dx = pos.x - currentShape.cx;
      const dy = pos.y - currentShape.cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const updatedCircle: CircleShape = {
        ...currentShape,
        r,
      };
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
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;

    onAddShape(currentShape);
    setIsDrawing(false);
    setCurrentShape(null);

    // Switch to select mode after drawing
    dispatch(setTool('none'));
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
  };

  const renderShape = (shape: AnyShape) => {
    const isSelected = shape.id === selectedId;

    if (shape.type === 'line') {
      return (
        <LineComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          onSelect={() => onSelectShape(shape.id)}
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
          onSelect={() => onSelectShape(shape.id)}
          onDragEnd={handleDragEnd(shape)}
        />
      );
    }

    if (shape.type === 'rect') {
      return (
        <RectComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          onSelect={() => onSelectShape(shape.id)}
          onDragEnd={handleDragEnd(shape)}
        />
      );
    }

    if (shape.type === 'qcurve' || shape.type === 'ccurve') {
      return (
        <CurveComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          onSelect={() => onSelectShape(shape.id)}
          onDragEnd={handleDragEnd(shape)}
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
        width={window.innerWidth - 300}
        height={window.innerHeight - 100}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <LayerComponent>
          {shapes.map(renderShape)}
          {currentShape && renderShape(currentShape)}
        </LayerComponent>
      </StageComponent>
    </div>
  );
};
