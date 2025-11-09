import React, { useMemo } from 'react';
import type { AnyShape, ShapeGroup } from '../types/drawing';

interface LayersPanelProps {
  shapes: AnyShape[];
  groups: ShapeGroup[];
  selectedIds: string[]; // allow multi-select for grouping
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onGroup: (ids: string[]) => void;
  onUngroup: (groupId: string) => void;
  selectedGroupId?: string | null;
  onSelectGroup?: (id: string) => void;
}

// Flatten groups for quick search of group by id
function walkGroups(groups: ShapeGroup[], fn: (g: ShapeGroup) => void) {
  groups.forEach((g) => {
    fn(g);
    walkGroups(g.groups, fn);
  });
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ shapes, groups, selectedIds, onToggleSelect, onClearSelection, onGroup, onUngroup, selectedGroupId = null, onSelectGroup }) => {
  const shapeMap = useMemo(() => new Map(shapes.map((s) => [s.id, s])), [shapes]);

  const groupedShapeIds = useMemo(() => {
    const set = new Set<string>();
    walkGroups(groups, (g) => g.shapeIds.forEach((id) => set.add(id)));
    return set;
  }, [groups]);

  const canGroup = selectedIds.length >= 2;

  return (
    <div style={{ width: 240, borderLeft: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ fontSize: 13 }}>Layers</strong>
        <button type="button" style={{ fontSize: 11, marginLeft: 'auto' }} onClick={onClearSelection}>Clear Sel</button>
      </div>
      <div style={{ padding: 10, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Groups tree */}
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
        {shapes.filter((s) => !groupedShapeIds.has(s.id)).map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={selectedIds.includes(s.id)}
              onChange={() => onToggleSelect(s.id)}
              title="Select shape"
            />
            <span style={{ fontSize: 12, flex: 1 }}>{s.type}:{s.id}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          disabled={!canGroup}
          onClick={() => canGroup && onGroup(selectedIds)}
          style={{ fontSize: 12, padding: '6px 8px', cursor: canGroup ? 'pointer' : 'not-allowed' }}
        >
          Group ({selectedIds.length})
        </button>
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

const GroupNode: React.FC<GroupNodeProps> = ({ group, shapeMap, selectedIds, onToggleSelect, onUngroup, onSelectGroup, selectedGroupId }) => {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer', color: selectedGroupId === group.id ? '#2563eb' : '#111827' }}
          onClick={() => onSelectGroup?.(group.id)}
          title="Select group"
        >Group: {group.name}</span>
        <button
          type="button"
          style={{ fontSize: 10, marginLeft: 'auto' }}
          onClick={() => onUngroup(group.id)}
          title="Ungroup"
        >Ungroup</button>
      </div>
      {group.shapeIds.map((sid) => {
        const s = shapeMap.get(sid);
        if (!s) return null;
        return (
          <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
            <input
              type="checkbox"
              checked={selectedIds.includes(sid)}
              onChange={() => onToggleSelect(sid)}
              title="Select shape"
            />
            <span style={{ fontSize: 12 }}>{s.type}:{sid}</span>
          </div>
        );
      })}
      {group.groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
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
