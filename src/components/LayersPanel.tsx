import React, { useMemo } from "react";
import type { AnyShape, ShapeGroup } from "../types/drawing";
import { Button } from "./ui/button"; // shadcn button

interface LayersPanelProps {
  shapes: AnyShape[];
  groups: ShapeGroup[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onGroup: (ids: string[]) => void;
  onUngroup: (groupId: string) => void;
  selectedGroupId?: string | null;
  onSelectGroup?: (id: string) => void;
}

function walkGroups(groups: ShapeGroup[], fn: (g: ShapeGroup) => void) {
  groups.forEach((g) => {
    fn(g);
    walkGroups(g.groups, fn);
  });
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  shapes,
  groups,
  selectedIds,
  onToggleSelect,
  onClearSelection,
  onGroup,
  onUngroup,
  selectedGroupId = null,
  onSelectGroup,
}) => {
  const shapeMap = useMemo(() => new Map(shapes.map((s) => [s.id, s])), [shapes]);

  const groupedShapeIds = useMemo(() => {
    const set = new Set<string>();
    walkGroups(groups, (g) => g.shapeIds.forEach((id) => set.add(id)));
    return set;
  }, [groups]);

  const canGroup = selectedIds.length >= 2;

  return (
    <div className="w-60 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <strong className="text-xs">Layers</strong>
        <Button variant="ghost" size="xs" className="ml-auto" onClick={onClearSelection}>
          Clear Sel
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {/* Groups */}
        {groups.map((g) => (
          <GroupNode
            key={g.id}
            group={g}
            shapeMap={shapeMap}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onUngroup={onUngroup}
            onSelectGroup={onSelectGroup}
            selectedGroupId={selectedGroupId}
          />
        ))}

        {/* Ungrouped shapes */}
        {shapes
          .filter((s) => !groupedShapeIds.has(s.id))
          .map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => onToggleSelect(s.id)}
                title="Select shape"
              />
              <span className="text-xs flex-1">
                {s.type}:{s.id}
              </span>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 p-2 border-t border-gray-200">
        <Button
          size="sm"
          disabled={!canGroup}
          onClick={() => canGroup && onGroup(selectedIds)}
        >
          Group ({selectedIds.length})
        </Button>
      </div>
    </div>
  );
};

interface GroupNodeProps {
  group: ShapeGroup;
  shapeMap: Map<string, AnyShape>;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onUngroup: (groupId: string) => void;
  onSelectGroup?: (id: string) => void;
  selectedGroupId?: string | null;
}

const GroupNode: React.FC<GroupNodeProps> = ({
  group,
  shapeMap,
  selectedIds,
  onToggleSelect,
  onUngroup,
  onSelectGroup,
  selectedGroupId,
}) => {
  return (
    <div className="border border-gray-200 rounded-md p-1 flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span
          className={`text-xs font-semibold cursor-pointer ${
            selectedGroupId === group.id ? "text-blue-600" : "text-gray-900"
          }`}
          onClick={() => onSelectGroup?.(group.id)}
          title="Select group"
        >
          Group: {group.name}
        </span>
        <Button
          size="xs"
          variant="outline"
          className="ml-auto"
          onClick={() => onUngroup(group.id)}
        >
          Ungroup
        </Button>
      </div>

      {/* Shapes in group */}
      {group.shapeIds.map((sid) => {
        const s = shapeMap.get(sid);
        if (!s) return null;
        return (
          <div key={sid} className="flex items-center gap-1 pl-1">
            <input
              type="checkbox"
              checked={selectedIds.includes(sid)}
              onChange={() => onToggleSelect(sid)}
              title="Select shape"
            />
            <span className="text-xs">
              {s.type}:{sid}
            </span>
          </div>
        );
      })}

      {/* Nested groups */}
      {group.groups.length > 0 && (
        <div className="flex flex-col gap-1 pl-2">
          {group.groups.map((child) => (
            <GroupNode
              key={child.id}
              group={child}
              shapeMap={shapeMap}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onUngroup={onUngroup}
              onSelectGroup={onSelectGroup}
              selectedGroupId={selectedGroupId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LayersPanel;
