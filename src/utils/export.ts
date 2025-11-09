import type { AnyShape, ShapeGroup } from '../types/drawing';
import type { Screen as OutScreen, Shape as OutShape, Group as OutGroup } from '../types/interface';

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
      if ((s as any).lineJoin) (out as any).lineJoin = (s as any).lineJoin;
      if (s.rotation != null) out.rotation = round(s.rotation, precision);
      if (translate) out.translate = translate;
      return out;
    }
    if (s.type === 'rect') {
      const x = s.x;
      const y = s.y;
      const x2 = s.x + s.width;
      const y2 = s.y + s.height;
      const r = (n: number) => round(n, precision);
      const d = `M ${r(x)} ${r(y)} L ${r(x2)} ${r(y)} L ${r(x2)} ${r(y2)} L ${r(x)} ${r(y2)} Z`;
      const out: OutShape = {
        id: s.id,
        d,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
      };
      if ((s as any).rotation != null) out.rotation = round((s as any).rotation, precision);
      return out;
    }
    return {
      id: (s as any).id ?? 'unknown',
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

// New: build screen with groups and shapes (shapes inside groups are not duplicated at root)
export function buildScreen(shapes: AnyShape[], groups: ShapeGroup[], opts: ExportOptions = {}): OutScreen {
  const { id = 'screen_1', name = 'Canvas', background = '#ffffff', precision = 2, normalize = 'none' } = opts;

  const shapeMap = new Map<string, AnyShape>();
  shapes.forEach((s) => shapeMap.set(s.id, s));

  const toOutShape = (s: AnyShape): OutShape => {
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
        for (let i = 0; i < pts.length; i += 2) {
          pts[i] -= minX;
          pts[i + 1] -= minY;
        }
        translate = { x: round(minX, precision), y: round(minY, precision) };
      }
      const d = pathFromPoints(pts, precision);
      const out: OutShape = { id: s.id, d, stroke: s.stroke, strokeWidth: s.strokeWidth };
      if (s.rotation != null) out.rotation = round(s.rotation, precision);
      if (translate) out.translate = translate;
      return out;
    }
    if (s.type === 'rect') {
      const x = s.x;
      const y = s.y;
      const x2 = s.x + s.width;
      const y2 = s.y + s.height;
      const r = (n: number) => round(n, precision);
      const d = `M ${r(x)} ${r(y)} L ${r(x2)} ${r(y)} L ${r(x2)} ${r(y2)} L ${r(x)} ${r(y2)} Z`;
      const out: OutShape = { id: s.id, d, stroke: s.stroke, strokeWidth: s.strokeWidth };
      if ((s as any).rotation != null) out.rotation = round((s as any).rotation, precision);
      return out;
    }
  return { id: 'unknown', d: '' };
  };

  const toOutGroup = (g: ShapeGroup): OutGroup => {
    const childrenShapes: OutShape[] = g.shapeIds
      .map((id) => shapeMap.get(id))
      .filter(Boolean)
      .map((s) => toOutShape(s!));
    const childrenGroups: OutGroup[] = g.groups.map((child) => toOutGroup(child));
    const out: OutGroup = {
      id: g.id,
      shapes: childrenShapes,
      groups: childrenGroups,
    };
    if (g.rotation != null) out.rotation = round(g.rotation, precision);
    if (g.translate) out.translate = { x: round(g.translate.x, precision), y: round(g.translate.y, precision) };
    if (g.scale) out.scale = round(g.scale.x, precision); // interface has scale?: number; using x for uniform
    return out;
  };

  // Collect shape ids that appear inside groups to avoid duplication at root
  const groupedIds = new Set<string>();
  const collect = (list: ShapeGroup[]) => {
    list.forEach((g) => {
      g.shapeIds.forEach((id) => groupedIds.add(id));
      collect(g.groups);
    });
  };
  collect(groups);

  const outShapes: OutShape[] = shapes.filter((s) => !groupedIds.has(s.id)).map((s) => toOutShape(s));
  const outGroups: OutGroup[] = groups.map((g) => toOutGroup(g));

  return {
    id,
    name,
    shapes: outShapes,
    groups: outGroups,
    background,
  };
}
