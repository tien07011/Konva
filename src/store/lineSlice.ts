import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LineShape } from '../types/drawing';

export interface LineState {
	lines: LineShape[];
}

const initialState: LineState = {
	lines: [],
};

const lineSlice = createSlice({
	name: 'line',
	initialState,
	reducers: {
		addLine(state, action: PayloadAction<LineShape>) {
			state.lines.push(action.payload);
		},
		removeLine(state, action: PayloadAction<string>) {
			state.lines = state.lines.filter(line => line.id !== action.payload);
		},
		updateLine(state, action: PayloadAction<LineShape>) {
			const idx = state.lines.findIndex(line => line.id === action.payload.id);
			if (idx !== -1) {
				state.lines[idx] = action.payload;
			}
		},
		resetLines(state) {
			state.lines = [];
		},
	},
});

export const { addLine, removeLine, updateLine, resetLines } = lineSlice.actions;
export default lineSlice.reducer;
