import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AnyShape } from '../types/drawing';

export interface ShapesState {
  shapes: AnyShape[];
  selectedId: string | null;
  history: AnyShape[][];
  historyIndex: number;
}

const initialState: ShapesState = {
  shapes: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,
};

const shapesSlice = createSlice({
  name: 'shapes',
  initialState,
  reducers: {
    addShape(state, action: PayloadAction<AnyShape>) {
      state.shapes.push(action.payload);
      // Update history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.shapes]);
      state.history = newHistory;
      state.historyIndex = newHistory.length - 1;
    },
    updateShape(state, action: PayloadAction<AnyShape>) {
      const index = state.shapes.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.shapes[index] = action.payload;
        // Update history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push([...state.shapes]);
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      }
    },
    deleteShape(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.shapes = state.shapes.filter((s) => s.id !== id);
      if (state.selectedId === id) {
        state.selectedId = null;
      }
      // Update history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.shapes]);
      state.history = newHistory;
      state.historyIndex = newHistory.length - 1;
    },
    selectShape(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    clearShapes(state) {
      state.shapes = [];
      state.selectedId = null;
      // Update history
      state.history = [[]];
      state.historyIndex = 0;
    },
    undo(state) {
      if (state.historyIndex > 0) {
        state.historyIndex -= 1;
        state.shapes = [...state.history[state.historyIndex]];
        state.selectedId = null;
      }
    },
    redo(state) {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1;
        state.shapes = [...state.history[state.historyIndex]];
        state.selectedId = null;
      }
    },
  },
});

export const { addShape, updateShape, deleteShape, selectShape, clearShapes, undo, redo } =
  shapesSlice.actions;

export default shapesSlice.reducer;
