import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import shapesReducer from './shapesSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    shapes: shapesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
