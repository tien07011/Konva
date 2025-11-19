import { Line, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';
import type { FreehandShape } from '../../types/drawing';

interface FreehandComponentProps {
  shape: FreehandShape;
  isSelected: boolean;
  interactive: boolean;
  onSelect?: () => void;
  onDragEnd?: (e: any) => void;
  onChange?: (shape: FreehandShape) => void;
}

export const FreehandComponent: React.FC<FreehandComponentProps> = ({
  shape,
  isSelected,
  interactive,
  onSelect,
  onDragEnd,
  onChange,
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransform = () => {
    const node = shapeRef.current;
    if (!node || !onChange) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newPoints = shape.points.map((val, idx) => {
      return idx % 2 === 0 ? val * scaleX : val * scaleY;
    });

    onChange({
      ...shape,
      points: newPoints,
    });
  };

  return (
    <>
      <Line
        ref={shapeRef}
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        draggable={interactive}
        listening={true}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={handleTransform}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
};
