import React from 'react';
import { AnyShape } from '../shapes/types';
import { shapeRegistry } from '../shapes/registry';

type Props = {
  shapes: AnyShape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onDelete: (id: string) => void;
  onOpenProps?: (id: string) => void;
  // Multi-select for grouping
  onGroup?: (ids: string[]) => void;
  onUngroup?: (ids: string[]) => void;
};

const Item: React.FC<{
  shape: AnyShape;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onOpenProps?: () => void;
}> = ({ shape, selected, onSelect, onMoveUp, onMoveDown, onDelete, onOpenProps }) => {
  const label = shape.type === 'group' ? 'Group' : (shapeRegistry as any)[shape.type]?.label ?? shape.type;
  const shortId = shape.id.length > 10 ? shape.id.slice(0, 10) + '…' : shape.id;
  return (
    <div
      onClick={onSelect}
      style={{
        padding: 8,
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: selected ? '#eef2ff' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#334155' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{shortId}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <button title="Move up" style={btn} onClick={onMoveUp}>▲</button>
        <button title="Move down" style={btn} onClick={onMoveDown}>▼</button>
        {onOpenProps && (
          <button title="Edit" style={btn} onClick={onOpenProps}>✎</button>
        )}
        <button title="Delete" style={btn} onClick={onDelete}>🗑</button>
      </div>
    </div>
  );
};

const btn: React.CSSProperties = {
  padding: '4px 6px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
};

const LayerTree: React.FC<Props> = ({ shapes, selectedId, onSelect, onMove, onDelete, onOpenProps, onGroup, onUngroup }) => {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // Cleanup checks and open state for shapes that no longer exist
    setChecked((c) => {
      const next: Record<string, boolean> = {};
      for (const s of shapes) if (c[s.id]) next[s.id] = true;
      return next;
    });
    setOpen((o) => {
      const next: Record<string, boolean> = {};
      for (const s of shapes) if (o[s.id]) next[s.id] = true;
      return next;
    });
  }, [shapes]);

  const selectedIds = React.useMemo(() => Object.keys(checked).filter((k) => checked[k]), [checked]);
  const anyGroupSelected = React.useMemo(
    () => selectedIds.some((id) => shapes.find((s) => s.id === id)?.type === 'group'),
    [selectedIds, shapes]
  );

  // Build children map
  const childrenByParent = React.useMemo(() => {
    const map: Record<string, AnyShape[]> = {};
    for (const s of shapes) {
      if (s.parentId) {
        (map[s.parentId] = map[s.parentId] || []).push(s);
      }
    }
    return map;
  }, [shapes]);

  const roots = React.useMemo(() => shapes.filter((s) => !s.parentId), [shapes]);

  const toggleOpen = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const Row: React.FC<{ shape: AnyShape; depth: number }> = ({ shape, depth }) => {
    const isGroup = shape.type === 'group';
    const hasChildren = isGroup && (childrenByParent[shape.id]?.length || 0) > 0;
    const expanded = !!open[shape.id];
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: depth * 12 }}>
          {isGroup ? (
            <button
              onClick={() => toggleOpen(shape.id)}
              title={expanded ? 'Collapse' : 'Expand'}
              style={{ ...btn, padding: '2px 6px' }}
            >
              {expanded ? '▾' : '▸'}
            </button>
          ) : (
            <span style={{ width: 18 }} />
          )}
          <input
            type="checkbox"
            checked={!!checked[shape.id]}
            onChange={(e) => setChecked((c) => ({ ...c, [shape.id]: e.target.checked }))}
          />
          <Item
            shape={shape}
            selected={shape.id === selectedId}
            onSelect={() => onSelect(shape.id)}
            onMoveUp={() => onMove(shape.id, 'up')}
            onMoveDown={() => onMove(shape.id, 'down')}
            onDelete={() => onDelete(shape.id)}
            onOpenProps={onOpenProps ? () => onOpenProps(shape.id) : undefined}
          />
        </div>
        {isGroup && expanded && hasChildren && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {childrenByParent[shape.id].map((child) => (
              <Row key={child.id} shape={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', flex: 1 }}>Layers</div>
        {onGroup && (
          <button
            style={btn}
            disabled={selectedIds.length < 2 || anyGroupSelected}
            title="Group selected"
            onClick={() => onGroup(selectedIds)}
          >Group</button>
        )}
        {onUngroup && (
          <button
            style={btn}
            disabled={selectedIds.length === 0}
            title="Ungroup selected groups"
            onClick={() => onUngroup(selectedIds)}
          >Ungroup</button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {roots.length === 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>No shapes</div>
        )}
        {roots.map((r) => (
          <Row key={r.id} shape={r} depth={0} />
        ))}
      </div>
    </div>
  );
};

export default LayerTree;
