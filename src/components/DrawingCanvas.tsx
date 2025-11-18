import { useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { LineComponent } from './shapes/LineComponent';
import type { AnyShape, LineShape } from '../types/drawing';

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

    if (tool !== 'line') return;

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
    };

    setCurrentShape(newLine);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentShape || tool !== 'line') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (currentShape.type === 'line') {
      const updatedLine: LineShape = {
        ...currentShape,
        points: [currentShape.points[0], currentShape.points[1], pos.x, pos.y],
      };
      setCurrentShape(updatedLine);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;

    onAddShape(currentShape);
    setIsDrawing(false);
    setCurrentShape(null);
  };

  const handleDragEnd = (shape: AnyShape) => (e: any) => {
    const node = e.target;
    const newPos = { x: node.x(), y: node.y() };

    if (shape.type === 'line') {
      const deltaX = newPos.x;
      const deltaY = newPos.y;
      const updatedShape: LineShape = {
        ...shape,
        points: shape.points.map((val, idx) => (idx % 2 === 0 ? val + deltaX : val + deltaY)),
      };
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
