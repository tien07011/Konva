import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { undo, redo } from '../store/shapesSlice';

export const useHistory = () => {
  const dispatch = useDispatch();
  const { historyIndex, history } = useSelector((state: RootState) => state.shapes);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      dispatch(undo());
    }
  }, [canUndo, dispatch]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      dispatch(redo());
    }
  }, [canRedo, dispatch]);

  return {
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  };
};
