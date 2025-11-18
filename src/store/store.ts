import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import lineReducer from './lineSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    line: lineReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
