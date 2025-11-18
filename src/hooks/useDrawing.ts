import { useState, useCallback } from 'react';
import type { AnyShape, ToolType } from '../types/drawing';

export const useDrawing = (
  tool: ToolType,
  strokeColor: string,
  strokeWidth: number,
  fillColor: string,
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<AnyShape | null>(null);

  const handleMouseDown = useCallback((pos: { x: number; y: number }) => {
    // TODO: Implement mouse down logic to start drawing
  }, [tool, strokeColor, strokeWidth, fillColor]);

  const handleMouseMove = useCallback((pos: { x: number; y: number }) => {
    // TODO: Implement mouse move logic to update current shape
  }, [isDrawing, currentShape]);

  const handleMouseUp = useCallback(() => {
    // TODO: Implement mouse up logic to finish drawing
  }, [isDrawing, currentShape]);

  return {
    isDrawing,
    currentShape,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
