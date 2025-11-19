import { useRef, useEffect } from 'react';
import { Group, Transformer } from 'react-konva';
import type { ShapeGroup, AnyShape } from '../../types/drawing';
import { LineComponent } from './LineComponent';
import { CircleComponent } from './CircleComponent';
import { RectComponent } from './RectComponent';
import { CurveComponent } from './CurveComponent';
import { FreehandComponent } from './FreehandComponent';

interface GroupComponentProps {
  group: ShapeGroup;
  shapes: AnyShape[];
  isSelected: boolean;
  onSelect?: () => void;
  onChange: (group: ShapeGroup) => void;
  selectedIds?: string[];
  onSelectShape?: (id: string) => void;
}

export const GroupComponent: React.FC<GroupComponentProps> = ({
  group,
  shapes,
  isSelected,
  onSelect,
  onChange,
  selectedIds = [],
  onSelectShape,
}) => {
  const groupRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    onChange({
      ...group,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX,
      scaleY,
    });
  };

  const handleDragEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    onChange({
      ...group,
      x: node.x(),
      y: node.y(),
    });
  };

  // Get shapes that belong to this group
  const groupShapes = shapes.filter((s) => group.shapeIds.includes(s.id));

  const renderShape = (shape: AnyShape) => {
    const childSelected = selectedIds.includes(shape.id);
    if (shape.type === 'line') {
      return <LineComponent key={shape.id} shape={shape} isSelected={childSelected} interactive={false} onSelect={() => onSelectShape?.(shape.id)} />;
    }
    if (shape.type === 'circle') {
      return <CircleComponent key={shape.id} shape={shape} isSelected={childSelected} interactive={false} onSelect={() => onSelectShape?.(shape.id)} />;
    }
    if (shape.type === 'rect') {
      return <RectComponent key={shape.id} shape={shape} isSelected={childSelected} interactive={false} onSelect={() => onSelectShape?.(shape.id)} />;
    }
    if (shape.type === 'qcurve' || shape.type === 'ccurve') {
      return <CurveComponent key={shape.id} shape={shape} isSelected={childSelected} interactive={false} onSelect={() => onSelectShape?.(shape.id)} />;
    }
    if (shape.type === 'freehand') {
      return <FreehandComponent key={shape.id} shape={shape} isSelected={childSelected} interactive={false} onSelect={() => onSelectShape?.(shape.id)} />;
    }
    return null;
  };

  const GroupComp = Group as any;
  const TransformerComp = Transformer as any;

  return (
    <>
      <GroupComp
        ref={groupRef}
        x={group.x}
        y={group.y}
        rotation={group.rotation}
        scaleX={group.scaleX}
        scaleY={group.scaleY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {groupShapes.map(renderShape)}
      </GroupComp>
      {isSelected && (
        <TransformerComp
          ref={trRef}
          boundBoxFunc={(oldBox: any, newBox: any) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
        />
      )}
    </>
  );
};
