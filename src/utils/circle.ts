import type { CircleShape } from '../types/drawing';
import { loadGeometryWasm } from './wasm';

export function startCircle(
  id: string,
  cx: number,
  cy: number,
  stroke: string,
  strokeWidth: number,
  fill?: string,
): CircleShape {
  return { id, type: 'circle', cx, cy, r: 0, stroke, strokeWidth, fill };
}

export function updateCircleFromCorner(
  shape: CircleShape,
  startX: number,
  startY: number,
  x: number,
  y: number,
): CircleShape {
  const dx = x - startX;
  const dy = y - startY;
  const cx = (startX + x) / 2;
  const cy = (startY + y) / 2;
  const r = 0.5 * Math.max(Math.abs(dx), Math.abs(dy));
  return { ...shape, cx, cy, r };
}

export function updateCircleFromCenter(
  shape: CircleShape,
  cx: number,
  cy: number,
  x: number,
  y: number,
): CircleShape {
  const r = Math.hypot(x - cx, y - cy);
  return { ...shape, cx, cy, r };
}

export async function circleLength(r: number): Promise<number> {
  try {
    const wasm: any = await loadGeometryWasm();
    return wasm.circle_length(Math.abs(r));
  } catch {
    return 2 * Math.PI * Math.abs(r);
  }
}

export async function circlePointDistance(
  cx: number,
  cy: number,
  r: number,
  px: number,
  py: number,
): Promise<number> {
  try {
    const wasm: any = await loadGeometryWasm();
    return wasm.circle_point_distance(cx, cy, Math.abs(r), px, py);
  } catch {
    return Math.abs(Math.hypot(px - cx, py - cy) - Math.abs(r));
  }
}

export async function circleBBox(
  cx: number,
  cy: number,
  r: number,
): Promise<{ minx: number; miny: number; maxx: number; maxy: number }> {
  try {
    const wasm: any = await loadGeometryWasm();
    const ptr = wasm.circle_bbox(cx, cy, Math.abs(r));
    const arr: number[] = typeof wasm.__getArray === 'function' ? wasm.__getArray(ptr) : [];
    if (arr && arr.length >= 4) return { minx: arr[0], miny: arr[1], maxx: arr[2], maxy: arr[3] };
  } catch (_e) {
    /* wasm unavailable - fallback to JS */ void 0;
  }
  const rr = Math.abs(r);
  return { minx: cx - rr, miny: cy - rr, maxx: cx + rr, maxy: cy + rr };
}

export function circlePerimeterPointTowards(
  cx: number,
  cy: number,
  r: number,
  px: number,
  py: number,
): { x: number; y: number } {
  const ang = Math.atan2(py - cy, px - cx);
  const rr = Math.abs(r);
  return { x: cx + rr * Math.cos(ang), y: cy + rr * Math.sin(ang) };
}

export async function circleIntersectRay(
  cx: number,
  cy: number,
  r: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Promise<{ hit: boolean; x: number; y: number }> {
  try {
    const wasm: any = await loadGeometryWasm();
    if (typeof wasm.circle_intersect_ray_t === 'function') {
      const t: number = wasm.circle_intersect_ray_t(cx, cy, Math.abs(r), x1, y1, x2, y2);
      if (!isFinite(t) || t < 0) return { hit: false, x: NaN, y: NaN };
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      return { hit: true, x, y };
    }
    if (typeof wasm.circle_intersect_ray === 'function' && typeof wasm.__getArray === 'function') {
      const ptr = wasm.circle_intersect_ray(cx, cy, Math.abs(r), x1, y1, x2, y2);
      const arr: number[] = wasm.__getArray(ptr);
      const x = arr[0],
        y = arr[1];
      const hit = isFinite(x) && isFinite(y);
      return { hit, x, y };
    }
  } catch (_e) {
    /* wasm unavailable - fallback to JS */ void 0;
  }
  // JS fallback
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const A = dx * dx + dy * dy;
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4 * A * C;
  if (disc < 0 || A === 0) return { hit: false, x: NaN, y: NaN };
  const sqrtDisc = Math.sqrt(disc);
  let t = (-B - sqrtDisc) / (2 * A);
  if (t < 0) t = (-B + sqrtDisc) / (2 * A);
  if (t < 0) return { hit: false, x: NaN, y: NaN };
  return { hit: true, x: x1 + t * dx, y: y1 + t * dy };
}
