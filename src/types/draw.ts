export type Tool = 'select' | 'brush' | 'line' | 'rectangle' | 'circle' | 'eraser';

export interface ToolbarState {
  tool: Tool;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number; // px
  useFill: boolean;
}
