import type { AnyShape } from '../types/drawing';
import type { Screen as OutScreen, Shape as OutShape } from '../types/interface';

export interface ExportOptions {
  id?: string;
  name?: string;
  background?: string;
  precision?: number; // rounding precision for coordinates
  normalize?: 'none' | 'translateMinToOrigin';
}

function round(n: number, p: number) {
  const m = Math.pow(10, p);
  return Math.round(n * m) / m;
}

function pathFromPoints(points: number[], precision: number): string {
  if (!points || points.length < 2) return '';
  const r = (v: number) => (Number.isFinite(v) ? round(v, precision) : 0);
  let d = `M ${r(points[0])} ${r(points[1])}`;
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${r(points[i])} ${r(points[i + 1])}`;
  }
  return d;
}

export function buildScreenFromShapes(shapes: AnyShape[], opts: ExportOptions = {}): OutScreen {
  const { id = 'screen_1', name = 'Canvas', background = '#ffffff', precision = 2, normalize = 'none' } = opts;

  const outShapes: OutShape[] = shapes.map((s) => {
    if (s.type === 'line') {
      const pts = s.points.slice();
      let translate: { x: number; y: number } | undefined;
      if (normalize === 'translateMinToOrigin' && pts.length >= 2) {
        let minX = pts[0];
        let minY = pts[1];
        for (let i = 2; i < pts.length; i += 2) {
          if (pts[i] < minX) minX = pts[i];
          if (pts[i + 1] < minY) minY = pts[i + 1];
        }
        if (Number.isFinite(minX) && Number.isFinite(minY)) {
          for (let i = 0; i < pts.length; i += 2) {
            pts[i] -= minX;
            pts[i + 1] -= minY;
          }
          translate = { x: round(minX, precision), y: round(minY, precision) };
        }
      }

      const d = pathFromPoints(pts, precision);
      const out: OutShape = {
        id: s.id,
        d,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
      };
      if (s.rotation != null) out.rotation = round(s.rotation, precision);
      if (translate) out.translate = translate;
      return out;
    }
    return {
      id: s.id,
      d: '',
    };
  });

  const screen: OutScreen = {
    id,
    name,
    shapes: outShapes,
    groups: [],
    background,
  };

  return screen;
}
