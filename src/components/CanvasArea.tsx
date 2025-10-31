import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type { AnyShape, DraftShape } from '../types/drawing';
import { ShapeNode } from './shapes/registry';

type PointerHandler = (e: any) => void;

export interface CanvasAreaHandle {
}

interface CanvasAreaProps {
	shapes: AnyShape[];
	draft: DraftShape;
	onMouseDown: PointerHandler;
	onMouseMove: PointerHandler;
	onMouseUp: PointerHandler;
  onLineDragEnd?: (payload: { id: string; points: number[] }) => void;
  onLineChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
  selectedId?: string | null;
  onSelectShape?: (id: string | null) => void;
}

// Vùng canvas hiển thị các shape và bản nháp
export const CanvasArea = React.forwardRef<CanvasAreaHandle, CanvasAreaProps>(
	({ shapes, draft, onMouseDown, onMouseMove, onMouseUp, onLineDragEnd, onLineChange, selectedId = null, onSelectShape }, ref) => {
		const containerRef = useRef<HTMLDivElement | null>(null);
		const stageRef = useRef<any>(null); // Konva.Stage instance
		const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });


		// Auto-resize to fill container
		useEffect(() => {
			const el = containerRef.current;
			if (!el) return;

			const measure = () => {
				const { clientWidth, clientHeight } = el;
				setSize({ width: clientWidth, height: clientHeight });
			};

			measure();
			const ro = new ResizeObserver(measure);
			ro.observe(el);
			window.addEventListener('resize', measure);
			return () => {
				ro.disconnect();
				window.removeEventListener('resize', measure);
			};
		}, []);

		return (
			<div
				ref={containerRef}
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					background: '#ffffff',
				}}
			>
				<Stage
					ref={stageRef}
					width={size.width}
					height={size.height}
					style={{ display: 'block' }}
					onMouseDown={(e: any) => {
						// Clear selection when clicking on empty stage
						const stage = e.target.getStage?.();
						if (stage && e.target === stage) onSelectShape?.(null);
						onMouseDown(e);
					}}
					onMouseMove={onMouseMove}
					onMouseUp={onMouseUp}
				>
					<Layer>
						{shapes.map((s) => (
							<ShapeNode
								key={s.id}
								shape={s}
								isDraft={false}
								isSelected={selectedId === s.id}
								onSelect={(id) => onSelectShape?.(id)}
								onLineDragEnd={onLineDragEnd}
								onLineChange={onLineChange}
							/>
						))}

						{draft ? (
							<ShapeNode shape={draft as any} isDraft />
						) : null}
					</Layer>
				</Stage>
			</div>
		);
	}
);

CanvasArea.displayName = 'CanvasArea';

export default CanvasArea;

