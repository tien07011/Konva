import React from 'react';
import { Stage, Layer, Circle, Rect, Text } from 'react-konva';

function KonvaDemo() {
  const [color, setColor] = React.useState('#29b6f6');

  return (
    <div style={{ maxWidth: 600, margin: '16px auto' }}>
      <h2>Konva Demo</h2>
      <p>Drag the circle. Click rectangle to toggle color.</p>
      <Stage width={600} height={300} style={{ border: '1px solid #ddd', borderRadius: 8 }}>
        <Layer>
          <Text text="Hello Konva" fontSize={18} x={16} y={12} fill="#555" />

          <Rect
            x={16}
            y={40}
            width={120}
            height={40}
            cornerRadius={6}
            fill={color}
            shadowBlur={6}
            onClick={() => setColor((c) => (c === '#29b6f6' ? '#ab47bc' : '#29b6f6'))}
          />

          <Circle x={300} y={160} radius={40} fill="#ff7043" draggable shadowBlur={10} />
        </Layer>
      </Stage>
    </div>
  );
}

export default KonvaDemo;
