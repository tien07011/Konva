import React, { useRef, useState } from 'react';
import { MenuBar } from './MenuBar';
import { CanvasArea, type CanvasAreaHandle } from './CanvasArea';

export const PaintApp: React.FC = () => {
        // UI state only (chỉ vẽ đường)
        const [strokeColor, setStrokeColor] = useState<string>('#111827');
    const [strokeWidth, setStrokeWidth] = useState<number>(4);

        // History flags
        const [canUndo, setCanUndo] = useState(false);
        const [canRedo, setCanRedo] = useState(false);
        const canvasRef = useRef<CanvasAreaHandle | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9' }}>
                            <MenuBar
                        strokeColor={strokeColor}
                        onStrokeColorChange={setStrokeColor}
                        strokeWidth={strokeWidth}
                        onStrokeWidthChange={setStrokeWidth}
                        canUndo={canUndo}
                        canRedo={canRedo}
                                onUndo={() => canvasRef.current?.undo()}
                                onRedo={() => canvasRef.current?.redo()}
                                onClear={() => canvasRef.current?.clear()}
                                onExport={() => {
                                    const data = canvasRef.current?.exportImage();
                                    if (!data) return;
                                    const link = document.createElement('a');
                                    link.href = data;
                                    link.download = 'canvas.png';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                    />

            <div style={{ display: 'flex', flex: 1 }}>
                                <CanvasArea
                                    ref={canvasRef}
                                    strokeColor={strokeColor}
                                    strokeWidth={strokeWidth}
                                    onHistoryChange={({ canUndo, canRedo }) => {
                                        setCanUndo(canUndo);
                                        setCanRedo(canRedo);
                                    }}
                                />
            </div>
        </div>
    );
};
