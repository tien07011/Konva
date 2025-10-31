import React from 'react';
import { Stage, Layer, Line } from 'react-konva';

interface SymbolLineProps {
    size?: number; // pixel, square canvas
    stroke?: string;
    strokeWidth?: number;
}

// Biểu tượng vẽ đường bằng Konva (icon hiển thị trực tiếp từ react-konva)
export const SymbolLine: React.FC<SymbolLineProps> = ({
    size = 36,
    stroke = '#111827',
    strokeWidth = 4,
}) => {
    const padding = Math.max(3, Math.ceil(strokeWidth / 2) + 2);
    const points = [
        padding,
        size - padding,
        size - padding,
        padding,
    ];

    return (
        <div
            style={{
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: '#ffffff',
            }}
            aria-label="Biểu tượng công cụ vẽ đường"
            title="Công cụ: Vẽ đường"
        >
            <Stage width={size} height={size} style={{ display: 'block', borderRadius: 6 }}>
                <Layer>
                    <Line
                        points={points}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                    />
                </Layer>
            </Stage>
        </div>
    );
};

