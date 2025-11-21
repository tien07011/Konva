import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AnyShape, ShapeGroup } from '../types/drawing';

export interface ShapesState {
  shapes: AnyShape[];
  groups: ShapeGroup[];
  selectedIds: string[];
  selectedGroupId: string | null;
  selectedId: string | null;
  history: AnyShape[][];
  historyIndex: number;
}

const initialState: ShapesState = {
  shapes: [],
  groups: [],
  selectedIds: [],
  selectedGroupId: null,
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
    updateShapes(state, action: PayloadAction<AnyShape[]>) {
      const updates = action.payload;
      updates.forEach((u) => {
        const index = state.shapes.findIndex((s) => s.id === u.id);
        if (index !== -1) state.shapes[index] = u;
      });
      // Update history once for the batch
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.shapes]);
      state.history = newHistory;
      state.historyIndex = newHistory.length - 1;
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
      state.selectedIds = action.payload ? [action.payload] : [];
      state.selectedGroupId = null;
    },
    selectMultipleShapes(state, action: PayloadAction<string[]>) {
      state.selectedIds = action.payload;
      state.selectedId = null;
      state.selectedGroupId = null;
    },
    toggleShapeSelection(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((i) => i !== id);
      } else {
        state.selectedIds.push(id);
      }
      state.selectedId = null;
      state.selectedGroupId = null;
    },
    selectGroup(state, action: PayloadAction<string | null>) {
      state.selectedGroupId = action.payload;
      state.selectedId = null;
      state.selectedIds = [];
    },
    createGroup(state, action: PayloadAction<{ name?: string }>) {
      if (state.selectedIds.length < 2) return;
      
      const id = `group-${Date.now()}`;
      const newGroup: ShapeGroup = {
        id,
        name: action.payload.name || `Group ${state.groups.length + 1}`,
        shapeIds: [...state.selectedIds],
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };
      
      state.groups.push(newGroup);
      state.selectedIds = [];
      state.selectedGroupId = id;
    },
    updateGroup(state, action: PayloadAction<ShapeGroup>) {
      const index = state.groups.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = action.payload;
      }
    },
    ungroupShapes(state, action: PayloadAction<string>) {
      const groupId = action.payload;
      const group = state.groups.find((g) => g.id === groupId);
      if (group) {
        state.selectedIds = [...group.shapeIds];
        state.groups = state.groups.filter((g) => g.id !== groupId);
        state.selectedGroupId = null;
      }
    },
    clearShapes(state) {
      state.shapes = [];
      state.groups = [];
      state.selectedId = null;
      state.selectedIds = [];
      state.selectedGroupId = null;
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
    importData(state, action: PayloadAction<{ shapes: AnyShape[]; groups?: ShapeGroup[] }>) {
      state.shapes = action.payload.shapes;
      state.groups = action.payload.groups || [];
      state.selectedId = null;
      state.selectedIds = [];
      state.selectedGroupId = null;
      // Update history
      state.history = [[...state.shapes]];
      state.historyIndex = 0;
    },
  },
});

export const { 
  addShape, 
  updateShape, 
  updateShapes,
  deleteShape, 
  selectShape, 
  selectMultipleShapes,
  toggleShapeSelection,
  selectGroup,
  createGroup,
  updateGroup,
  ungroupShapes,
  clearShapes, 
  undo, 
  redo,
  importData
} = shapesSlice.actions;

export default shapesSlice.reducer;
