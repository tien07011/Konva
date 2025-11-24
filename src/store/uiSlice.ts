import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ToolType } from '../types/drawing';

export interface UIState {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  tool: ToolType;
  showGrid: boolean;
}

const initialState: UIState = {
  strokeColor: '#111827',
  strokeWidth: 5,
  fillColor: 'transparent',
  tool: 'select',
  showGrid: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setStrokeColor(state, action: PayloadAction<string>) {
      state.strokeColor = action.payload;
    },
    setStrokeWidth(state, action: PayloadAction<number>) {
      state.strokeWidth = action.payload;
    },
    setFillColor(state, action: PayloadAction<string>) {
      state.fillColor = action.payload;
    },
    setTool(state, action: PayloadAction<ToolType>) {
      state.tool = action.payload;
    },
    toggleGrid(state) {
      state.showGrid = !state.showGrid;
    },
  },
});

export const { setStrokeColor, setStrokeWidth, setFillColor, setTool, toggleGrid } =
  uiSlice.actions;

export default uiSlice.reducer;
