import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';

export interface CanvasAreaHandle {
    clear: () => void;
    undo: () => void;
    redo: () => void;
    exportImage: () => string | undefined; // dataURL
}

interface CanvasAreaProps {
    strokeColor: string;
    strokeWidth: number;
    onHistoryChange?: (info: { canUndo: boolean; canRedo: boolean }) => void;
}

// Khu vực dùng để vẽ đường thẳng bằng Konva
export const CanvasArea = React.forwardRef<CanvasAreaHandle, CanvasAreaProps>(
    ({ strokeColor, strokeWidth, onHistoryChange }, ref) => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const stageRef = useRef<any>(null);

        const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

        // Lưu các đường đã vẽ (mỗi đường là 2 điểm: [x1, y1, x2, y2])
        const [lines, setLines] = useState<Array<{ points: number[]; stroke: string; strokeWidth: number }>>([]);
        const redoStack = useRef<Array<{ points: number[]; stroke: string; strokeWidth: number }>>([]);

        // Đường đang preview khi kéo
        const [draft, setDraft] = useState<{ points: number[]; stroke: string; strokeWidth: number } | null>(null);

        const updateSize = useCallback(() => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setSize({ width: Math.max(0, rect.width), height: Math.max(0, rect.height) });
        }, []);

        useEffect(() => {
            updateSize();
            const onResize = () => updateSize();
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }, [updateSize]);

        const notifyHistory = useCallback(() => {
            onHistoryChange?.({ canUndo: lines.length > 0, canRedo: redoStack.current.length > 0 });
        }, [lines.length, onHistoryChange]);

        useEffect(() => {
            notifyHistory();
        }, [notifyHistory]);

        const onMouseDown = useCallback((e: any) => {
            const pos = e.target.getStage().getPointerPosition();
            if (!pos) return;
            setDraft({ points: [pos.x, pos.y, pos.x, pos.y], stroke: strokeColor, strokeWidth });
        }, [strokeColor, strokeWidth]);

        const onMouseMove = useCallback((e: any) => {
            if (!draft) return;
            const pos = e.target.getStage().getPointerPosition();
            if (!pos) return;
            setDraft({ ...draft, points: [draft.points[0], draft.points[1], pos.x, pos.y] });
        }, [draft]);

        const onMouseUp = useCallback(() => {
            if (!draft) return;
            setLines((prev) => [...prev, draft]);
            setDraft(null);
            // Mỗi khi có thao tác mới thì reset redo stack
            redoStack.current = [];
            notifyHistory();
        }, [draft, notifyHistory]);

        useImperativeHandle(ref, () => ({
            clear: () => {
                setLines([]);
                redoStack.current = [];
                notifyHistory();
            },
            undo: () => {
                setLines((prev) => {
                    if (prev.length === 0) return prev;
                    const copy = [...prev];
                    const popped = copy.pop()!;
                    redoStack.current.push(popped);
                    return copy;
                });
                notifyHistory();
            },
            redo: () => {
                if (redoStack.current.length === 0) return;
                const last = redoStack.current.pop()!;
                setLines((prev) => [...prev, last]);
                notifyHistory();
            },
            exportImage: () => {
                try {
                    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
                    return uri;
                } catch (err) {
                    return undefined;
                }
            },
        }), [notifyHistory]);

        const content = useMemo(() => (
            <>
                {lines.map((ln, idx) => (
                    <Line
                        key={idx}
                        points={ln.points}
                        stroke={ln.stroke}
                        strokeWidth={ln.strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                    />
                ))}
                {draft && (
                    <Line
                        points={draft.points}
                        stroke={draft.stroke}
                        strokeWidth={draft.strokeWidth}
                        dash={[8, 6]}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </>
        ), [lines, draft]);

        return (
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    background: '#fff',
                    border: '1px dashed #cbd5e1',
                    borderRadius: 8,
                    margin: 12,
                    boxShadow: 'inset 0 0 0 4px #f8fafc',
                    overflow: 'hidden',
                }}
            >
                {size.width > 0 && size.height > 0 && (
                    <Stage
                        width={size.width}
                        height={size.height}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        ref={stageRef}
                    >
                        <Layer>{content}</Layer>
                    </Stage>
                )}
            </div>
        );
    }
);

CanvasArea.displayName = 'CanvasArea';


