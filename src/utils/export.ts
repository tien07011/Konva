import type {
  AnyShape,
  ShapeGroup,
  PathShape,
  PathCommand,
  LineShape,
  RectShape,
  CircleShape,
  QuadraticCurveShape,
  CubicCurveShape,
} from '../types/drawing';
import type {
  Screen as OutScreen,
  Shape as OutShape,
  Group as OutGroup,
  PathCommand as OutPathCommand,
  VerboseCommand,
} from '../types/interface';

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

// Helpers to convert runtime shapes into PathCommand[]
function lineShapeToCommands(
  s: LineShape,
  precision: number,
): { compact: OutPathCommand[]; verbose: VerboseCommand[] } {
  const r = (v: number) => (Number.isFinite(v) ? round(v, precision) : 0);
  const pts = s.points;
  if (pts.length < 2) return { compact: [], verbose: [] };
  const compact: OutPathCommand[] = [{ cmd: 'M', x: r(pts[0]), y: r(pts[1]) }];
  const verbose: VerboseCommand[] = [{ type: 'moveTo', x: r(pts[0]), y: r(pts[1]) }];
  for (let i = 2; i < pts.length; i += 2) {
    compact.push({ cmd: 'L', x: r(pts[i]), y: r(pts[i + 1]) });
    verbose.push({ type: 'lineTo', x: r(pts[i]), y: r(pts[i + 1]) });
  }
  return { compact, verbose };
}

function rectShapeToCommands(
  s: RectShape,
  precision: number,
): { compact: OutPathCommand[]; verbose: VerboseCommand[] } {
  const r = (v: number) => (Number.isFinite(v) ? round(v, precision) : 0);
  const x = r(s.x);
  const y = r(s.y);
  const x2 = r(s.x + s.width);
  const y2 = r(s.y + s.height);
  return {
    compact: [
      { cmd: 'M', x, y },
      { cmd: 'L', x: x2, y },
      { cmd: 'L', x: x2, y: y2 },
      { cmd: 'L', x, y: y2 },
      { cmd: 'Z' },
    ],
    verbose: [
      { type: 'moveTo', x, y },
      { type: 'lineTo', x: x2, y },
      { type: 'lineTo', x: x2, y: y2 },
      { type: 'lineTo', x, y: y2 },
      { type: 'closePath' },
    ],
  };
}

function qCurveToCommands(
  s: QuadraticCurveShape,
  precision: number,
): { compact: OutPathCommand[]; verbose: VerboseCommand[] } {
  const p = s.points;
  if (p.length !== 6) return { compact: [], verbose: [] };
  const r = (v: number) => (Number.isFinite(v) ? round(v, precision) : 0);
  return {
    compact: [
      { cmd: 'M', x: r(p[0]), y: r(p[1]) },
      { cmd: 'Q', cx: r(p[2]), cy: r(p[3]), x: r(p[4]), y: r(p[5]) },
    ],
    verbose: [
      { type: 'moveTo', x: r(p[0]), y: r(p[1]) },
      { type: 'quadraticCurveTo', cx: r(p[2]), cy: r(p[3]), x: r(p[4]), y: r(p[5]) },
    ],
  };
}

function cCurveToCommands(
  s: CubicCurveShape,
  precision: number,
): { compact: OutPathCommand[]; verbose: VerboseCommand[] } {
  const p = s.points;
  if (p.length !== 8) return { compact: [], verbose: [] };
  const r = (v: number) => (Number.isFinite(v) ? round(v, precision) : 0);
  return {
    compact: [
      { cmd: 'M', x: r(p[0]), y: r(p[1]) },
      { cmd: 'C', x1: r(p[2]), y1: r(p[3]), x2: r(p[4]), y2: r(p[5]), x: r(p[6]), y: r(p[7]) },
    ],
    verbose: [
      { type: 'moveTo', x: r(p[0]), y: r(p[1]) },
      {
        type: 'cubicCurveTo',
        x1: r(p[2]),
        y1: r(p[3]),
        x2: r(p[4]),
        y2: r(p[5]),
        x: r(p[6]),
        y: r(p[7]),
      },
    ],
  };
}

function pathShapeToCommands(
  s: PathShape,
  precision: number,
): { compact: OutPathCommand[]; verbose: VerboseCommand[] } {
  // Already absolute; just round values
  const r = (v: number) => (Number.isFinite(v) ? round(v, precision) : 0);
  const compact: OutPathCommand[] = [];
  const verbose: VerboseCommand[] = [];
  for (const c of s.commands) {
    switch (c.cmd) {
      case 'M':
        compact.push({ cmd: 'M', x: r(c.x), y: r(c.y) });
        verbose.push({ type: 'moveTo', x: r(c.x), y: r(c.y) });
        break;
      case 'L':
        compact.push({ cmd: 'L', x: r(c.x), y: r(c.y) });
        verbose.push({ type: 'lineTo', x: r(c.x), y: r(c.y) });
        break;
      case 'Q':
        compact.push({ cmd: 'Q', cx: r(c.cx), cy: r(c.cy), x: r(c.x), y: r(c.y) });
        verbose.push({ type: 'quadraticCurveTo', cx: r(c.cx), cy: r(c.cy), x: r(c.x), y: r(c.y) });
        break;
      case 'C':
        compact.push({
          cmd: 'C',
          x1: r(c.x1),
          y1: r(c.y1),
          x2: r(c.x2),
          y2: r(c.y2),
          x: r(c.x),
          y: r(c.y),
        });
        verbose.push({
          type: 'cubicCurveTo',
          x1: r(c.x1),
          y1: r(c.y1),
          x2: r(c.x2),
          y2: r(c.y2),
          x: r(c.x),
          y: r(c.y),
        });
        break;
      case 'Z':
        compact.push({ cmd: 'Z' });
        verbose.push({ type: 'closePath' });
        break;
    }
  }
  return { compact, verbose };
}

export function buildScreenFromShapes(shapes: AnyShape[], opts: ExportOptions = {}): OutScreen {
  const {
    id = 'screen_1',
    name = 'Canvas',
    background = '#ffffff',
    precision = 2,
    normalize = 'none',
  } = opts;

  const outShapes: OutShape[] = shapes.map((s) => shapeToOutShape(s, precision, normalize));
  return { id, name, shapes: outShapes, groups: [], background };
}

// New: build screen with groups and shapes (shapes inside groups are not duplicated at root)
export function buildScreen(
  shapes: AnyShape[],
  groups: ShapeGroup[],
  opts: ExportOptions = {},
): OutScreen {
  const {
    id = 'screen_1',
    name = 'Canvas',
    background = '#ffffff',
    precision = 2,
    normalize = 'none',
  } = opts;
  const shapeMap = new Map<string, AnyShape>();
  shapes.forEach((s) => shapeMap.set(s.id, s));

  const groupedIds = new Set<string>();
  const collect = (list: ShapeGroup[]) => {
    list.forEach((g) => {
      g.shapeIds.forEach((id) => groupedIds.add(id));
      collect(g.groups);
    });
  };
  collect(groups);

  const toOutGroup = (g: ShapeGroup): OutGroup => {
    const childShapes: OutShape[] = g.shapeIds
      .map((id) => shapeMap.get(id))
      .filter(Boolean)
      .map((s) => shapeToOutShape(s!, precision, normalize));
    const childGroups: OutGroup[] = g.groups.map((child) => toOutGroup(child));
    const out: OutGroup = { id: g.id, shapes: childShapes, groups: childGroups };
    if (g.rotation != null) out.rotation = round(g.rotation, precision);
    if (g.translate)
      out.translate = { x: round(g.translate.x, precision), y: round(g.translate.y, precision) };
    if (g.scale) out.scale = round(g.scale.x, precision); // uniform scale
    return out;
  };

  const outShapes: OutShape[] = shapes
    .filter((s) => !groupedIds.has(s.id))
    .map((s) => shapeToOutShape(s, precision, normalize));
  const outGroups: OutGroup[] = groups.map((g) => toOutGroup(g));
  return { id, name, shapes: outShapes, groups: outGroups, background };
}

// Core conversion for single shape
function shapeToOutShape(
  s: AnyShape,
  precision: number,
  normalize: ExportOptions['normalize'],
): OutShape {
  let commands: OutPathCommand[] = [];
  let verbose: VerboseCommand[] = [];
  let translate: { x: number; y: number } | undefined;
  if (s.type === 'line') {
    const pts = (s as LineShape).points.slice();
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
    const res = lineShapeToCommands({ ...(s as LineShape), points: pts }, precision);
    commands = res.compact;
    verbose = res.verbose;
  } else if (s.type === 'rect') {
    const res = rectShapeToCommands(s as RectShape, precision);
    commands = res.compact;
    verbose = res.verbose;
  } else if (s.type === 'circle') {
    // Approximate circle as a 4-point path (or export as a centered translate with radius as scale).
    // We'll output as a path: move to rightmost point, then use 4 cubic curves could be heavy; instead, use a polygonal approximation.
    const c = s as CircleShape;
    const steps = 16;
    const pts: OutPathCommand[] = [];
    const vOps: VerboseCommand[] = [];
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * Math.PI * 2;
      const x = c.cx + c.r * Math.cos(ang);
      const y = c.cy + c.r * Math.sin(ang);
      if (i === 0) {
        pts.push({ cmd: 'M', x: round(x, precision), y: round(y, precision) });
        vOps.push({ type: 'moveTo', x: round(x, precision), y: round(y, precision) });
      } else {
        pts.push({ cmd: 'L', x: round(x, precision), y: round(y, precision) });
        vOps.push({ type: 'lineTo', x: round(x, precision), y: round(y, precision) });
      }
    }
    pts.push({ cmd: 'Z' });
    vOps.push({ type: 'closePath' });
    commands = pts;
    verbose = vOps;
  } else if (s.type === 'qcurve') {
    const res = qCurveToCommands(s as QuadraticCurveShape, precision);
    commands = res.compact;
    verbose = res.verbose;
  } else if (s.type === 'ccurve') {
    const res = cCurveToCommands(s as CubicCurveShape, precision);
    commands = res.compact;
    verbose = res.verbose;
  } else if (s.type === 'path') {
    const res = pathShapeToCommands(s as PathShape, precision);
    commands = res.compact;
    verbose = res.verbose;
  }
  const out: OutShape = {
    id: s.id,
    commands,
    ops: verbose,
    stroke: s.stroke,
    strokeWidth: s.strokeWidth,
  };
  if (s.fill) (out as any).fill = s.fill;
  if (s.rotation != null) out.rotation = round(s.rotation, precision);
  if (translate) out.translate = translate;
  return out;
}
