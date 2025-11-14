import { useCallback, useState } from 'react';
import type { AnyShape, CircleShape, CubicCurveShape, DraftShape, LineShape, QuadraticCurveShape, RectShape, ToolType } from '../../types/drawing';

export interface UseDraftDeps {
  tool: ToolType;
  stroke: string;
  strokeWidth: number;
  fill: string;
  nextId: () => string;
  setShapes: React.Dispatch<React.SetStateAction<AnyShape[]>>;
  redoStack: React.MutableRefObject<AnyShape[]>;
  notifyHistory: () => void;
}

export function useDraft({ tool, stroke, strokeWidth, fill, nextId, setShapes, redoStack, notifyHistory }: UseDraftDeps) {
  const [draft, setDraft] = useState<DraftShape>(null);

  const startDraft = useCallback(
    (x: number, y: number) => {
      if (tool === 'none') return;
      switch (tool) {
        case 'line': {
          const d: LineShape = {
            id: nextId(),
            type: 'line',
            stroke,
            strokeWidth,
            fill,
            points: [x, y, x, y],
            lineJoin: 'miter',
            lineCap: 'round',
          };
          setDraft(d);
          break;
        }
        case 'rect': {
          const d: RectShape = {
            id: nextId(),
            type: 'rect',
            stroke,
            strokeWidth,
            fill,
            x,
            y,
            width: 0,
            height: 0,
          };
          setDraft(d);
          break;
        }
        case 'circle': {
          const d: CircleShape = {
            id: nextId(),
            type: 'circle',
            stroke,
            strokeWidth,
            fill,
            cx: x,
            cy: y,
            r: 0,
          };
          setDraft(d);
          break;
        }
        case 'qcurve': {
          const d: QuadraticCurveShape = {
            id: nextId(),
            type: 'qcurve',
            stroke,
            strokeWidth,
            fill,
            points: [x, y, x, y, x, y],
          };
          setDraft(d);
          break;
        }
        case 'ccurve': {
          const d: CubicCurveShape = {
            id: nextId(),
            type: 'ccurve',
            stroke,
            strokeWidth,
            fill,
            points: [x, y, x, y, x, y, x, y],
          };
          setDraft(d);
          break;
        }
      }
    },
    [tool, stroke, strokeWidth, fill, nextId],
  );

  const updateDraft = useCallback(
    (x: number, y: number) => {
      if (!draft) return;
      switch (draft.type) {
        case 'line':
          setDraft({ ...draft, points: [draft.points[0], draft.points[1], x, y] });
          break;
        case 'rect': {
          const x0 = (draft as RectShape).x;
          const y0 = (draft as RectShape).y;
          const nx = Math.min(x0, x);
          const ny = Math.min(y0, y);
          const w = Math.abs(x - x0);
          const h = Math.abs(y - y0);
          setDraft({ ...(draft as RectShape), x: nx, y: ny, width: w, height: h });
          break;
        }
        case 'circle': {
          const cx = (draft as CircleShape).cx;
          const cy = (draft as CircleShape).cy;
          const r = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          setDraft({ ...(draft as CircleShape), r });
          break;
        }
        case 'qcurve': {
          const p0x = draft.points[0];
          const p0y = draft.points[1];
          const cpx = (p0x + x) / 2;
          const cpy = (p0y + y) / 2;
          setDraft({ ...draft, points: [p0x, p0y, cpx, cpy, x, y] });
          break;
        }
        case 'ccurve': {
          const p0x = draft.points[0];
          const p0y = draft.points[1];
          const cx1 = p0x + (x - p0x) / 3;
          const cy1 = p0y + (y - p0y) / 3;
          const cx2 = p0x + (2 * (x - p0x)) / 3;
          const cy2 = p0y + (2 * (y - p0y)) / 3;
          setDraft({ ...draft, points: [p0x, p0y, cx1, cy1, cx2, cy2, x, y] });
          break;
        }
      }
    },
    [draft],
  );

  const commitDraft = useCallback(() => {
    if (!draft) return;
    setShapes((prev) => [...prev, draft as AnyShape]);
    setDraft(null);
    redoStack.current = [];
    notifyHistory();
  }, [draft, setShapes, notifyHistory, redoStack]);

  return { draft, startDraft, updateDraft, commitDraft };
}
