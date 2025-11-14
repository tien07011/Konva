import { useCallback } from 'react';
import type { AnyShape, ShapeGroup } from '../../types/drawing';

export interface UseGroupingDeps {
  shapes: AnyShape[];
  groups: ShapeGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ShapeGroup[]>>;
  nextId: () => string;
}

function isInAnyGroup(id: string, groupsList: ShapeGroup[]): boolean {
  for (const g of groupsList) {
    if (g.shapeIds.includes(id)) return true;
    if (isInAnyGroup(id, g.groups)) return true;
  }
  return false;
}

export function useGrouping({ shapes, groups, setGroups, nextId }: UseGroupingDeps) {
  const groupShapes = useCallback(
    (ids: string[], name = 'Group'): string | null => {
      const unique = Array.from(new Set(ids.filter(Boolean)));
      if (unique.length < 2) return null;
      const allExist = unique.every((id) => shapes.some((s) => s.id === id));
      if (!allExist) return null;
      const topLevelIds = unique.filter((id) => !isInAnyGroup(id, groups));
      if (topLevelIds.length < 2) return null;
      const newGroup: ShapeGroup = {
        id: nextId(),
        name,
        shapeIds: topLevelIds,
        groups: [],
        visible: true,
        locked: false,
      };
      setGroups((prev) => [newGroup, ...prev]);
      return newGroup.id;
    },
    [groups, shapes, setGroups, nextId],
  );

  const ungroupGroup = useCallback((groupId: string) => {
    const removeRec = (list: ShapeGroup[]): ShapeGroup[] =>
      list.filter((g) => g.id !== groupId).map((g) => ({ ...g, groups: removeRec(g.groups) }));
    setGroups((prev) => removeRec(prev));
  }, [setGroups]);

  const groupDragEnd = useCallback((payload: { id: string; x: number; y: number }) => {
    setGroups((prev) => prev.map((g) => (g.id === payload.id ? { ...g, translate: { x: payload.x, y: payload.y } } : g)));
  }, [setGroups]);

  const groupChange = useCallback(
    (payload: { id: string; x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== payload.id) return g;
          const next: ShapeGroup = { ...g };
          if (payload.x != null || payload.y != null) {
            const tx = payload.x != null ? payload.x : g.translate?.x || 0;
            const ty = payload.y != null ? payload.y : g.translate?.y || 0;
            next.translate = { x: tx, y: ty };
          }
          if (payload.rotation != null) next.rotation = payload.rotation;
          if (payload.scaleX != null || payload.scaleY != null) {
            const sx = payload.scaleX != null ? payload.scaleX : g.scale?.x || 1;
            const sy = payload.scaleY != null ? payload.scaleY : g.scale?.y || 1;
            next.scale = { x: sx, y: sy };
          }
          return next;
        }),
      );
    },
    [setGroups],
  );

  return { groupShapes, ungroupGroup, groupDragEnd, groupChange };
}
