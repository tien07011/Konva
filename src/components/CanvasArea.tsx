import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group as KonvaGroup, Transformer } from 'react-konva';
import type { AnyShape, DraftShape, ShapeGroup } from '../types/drawing';
import { ShapeNode } from './shapes/registry';

type PointerHandler = (e: any) => void;

export interface CanvasAreaHandle {
}

interface CanvasAreaProps {
	shapes: AnyShape[];
	groups?: ShapeGroup[];
	draft: DraftShape;
	onMouseDown: PointerHandler;
	onMouseMove: PointerHandler;
	onMouseUp: PointerHandler;
	onLineDragEnd?: (payload: { id: string; points: number[] }) => void;
	onLineChange?: (payload: { id: string; points?: number[]; rotation?: number }) => void;
	onRectDragEnd?: (payload: { id: string; x: number; y: number }) => void;
	onRectChange?: (payload: { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void;
	selectedId?: string | null;
	onSelectShape?: (id: string | null) => void;
  onGroupDragEnd?: (payload: { id: string; x: number; y: number }) => void;
  onGroupChange?: (payload: { id: string; x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) => void;
}

// Vùng canvas hiển thị các shape, group và bản nháp
export const CanvasArea = React.forwardRef<CanvasAreaHandle, CanvasAreaProps>(
	(
		{
			shapes,
			groups = [],
			draft,
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onLineDragEnd,
			onLineChange,
			onRectDragEnd,
			onRectChange,
			selectedId = null,
			onSelectShape,
      onGroupDragEnd,
      onGroupChange,
		},
		ref
	) => {
		const containerRef = useRef<HTMLDivElement | null>(null);
		const stageRef = useRef<any>(null);
		const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

		// Auto-resize to fill container
		useEffect(() => {
			const el = containerRef.current;
			if (!el) return;

			const measure = () => {
				setSize({ width: el.clientWidth, height: el.clientHeight });
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

		// helper component to render a group with selectable transformer
		const GroupNode: React.FC<{ g: ShapeGroup }> = ({ g }) => {
			const groupRef = useRef<any>(null);
			const trRef = useRef<any>(null);
			const isSelected = selectedId === g.id;

			useEffect(() => {
				if (!trRef.current || !groupRef.current) return;
				if (isSelected) {
					trRef.current.nodes([groupRef.current]);
					trRef.current.getLayer()?.batchDraw();
				} else {
					trRef.current.nodes([]);
					trRef.current.getLayer()?.batchDraw();
				}
			}, [isSelected]);

			return (
				<>
					<KonvaGroup
						ref={groupRef}
						x={g.translate?.x || 0}
						y={g.translate?.y || 0}
						rotation={g.rotation || 0}
						opacity={g.visible ? 1 : 0}
						scaleX={g.scale?.x ?? 1}
						scaleY={g.scale?.y ?? 1}
						draggable
						onMouseDown={(e: any) => { e.cancelBubble = true; }}
						onTouchStart={(e: any) => { e.cancelBubble = true; }}
						onClick={() => onSelectShape?.(g.id)}
						onTap={() => onSelectShape?.(g.id)}
						onDragEnd={(e: any) => {
							const node = e.target as any;
							onGroupDragEnd?.({ id: g.id, x: node.x(), y: node.y() });
						}}
						onTransformEnd={() => {
							if (!groupRef.current) return;
							const node = groupRef.current;
							onGroupChange?.({ id: g.id, x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() });
						}}
					>
						{g.groups.map((child) => (
							<GroupNode key={child.id} g={child} />
						))}
						{g.shapeIds.map((sid) => {
							const s = shapes.find((x) => x.id === sid);
							if (!s) return null;
							return (
								<ShapeNode
									key={s.id}
									shape={s}
									isDraft={false}
									isSelected={selectedId === s.id}
									onSelect={(id) => onSelectShape?.(id)}
									onLineDragEnd={onLineDragEnd}
									onLineChange={onLineChange}
									onRectDragEnd={onRectDragEnd}
									onRectChange={onRectChange}
								/>
							);
						})}
					</KonvaGroup>
								{isSelected && (
						<Transformer
							ref={trRef}
							rotateEnabled
							resizeEnabled
							keepRatio={false}
										boundBoxFunc={(oldBox: any, newBox: any) => {
								if (newBox.width < 1 || newBox.height < 1) return oldBox;
								return newBox;
							}}
						/>
					)}
				</>
			);
		};

		const isInGroup = (id: string, list: ShapeGroup[]): boolean => {
			for (const g of list) {
				if (g.shapeIds.includes(id)) return true;
				if (isInGroup(id, g.groups)) return true;
			}
			return false;
		};

		return (
			<div
				ref={containerRef}
				style={{ position: 'relative', width: '100%', height: '100%', background: '#ffffff' }}
			>
				{/* @ts-expect-error: react-konva Stage children typing workaround */}
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
						{/* groups */}
						{groups.map((g) => (
							<GroupNode key={g.id} g={g} />
						))}

						{/* shapes that are not inside any group */}
						{shapes
							.filter((s) => !isInGroup(s.id, groups))
							.map((s) => (
								<ShapeNode
									key={s.id}
									shape={s}
									isDraft={false}
									isSelected={selectedId === s.id}
									onSelect={(id) => onSelectShape?.(id)}
									onLineDragEnd={onLineDragEnd}
									onLineChange={onLineChange}
									onRectDragEnd={onRectDragEnd}
									onRectChange={onRectChange}
								/>
							))}

						{draft ? <ShapeNode shape={draft as any} isDraft /> : null}
					</Layer>
				</Stage>
			</div>
		);
	}
);

CanvasArea.displayName = 'CanvasArea';

export default CanvasArea;

