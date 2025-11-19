import { loadGeometryWasm } from './wasm';

// Compute polyline length using WASM. Falls back to JS if loading fails.
export async function polylineLength(points: number[]): Promise<number> {
  try {
    const wasm = await loadGeometryWasm();
    // The loader can create AS arrays from JS arrays using __newArray and the id
    const arrPtr = (wasm as any).__newArray(wasm.FLOAT64ARRAY_ID, new Float64Array(points));
    const length = wasm.polyline_length(arrPtr);
    // Optionally free arrPtr here if desired: __pin/__unpin not strictly necessary for short-lived
    return length;
  } catch (e) {
    // Fallback pure JS implementation
    let total = 0;
    for (let i = 2; i < points.length; i += 2) {
      const dx = points[i] - points[i - 2];
      const dy = points[i + 1] - points[i - 1];
      total += Math.hypot(dx, dy);
    }
    return total;
  }
}

// Project a point P onto segment AB and return projection point, t in [0,1], and distance
export function projectPointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby || 1;
  let t = (apx * abx + apy * aby) / ab2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const qx = ax + t * abx;
  const qy = ay + t * aby;
  const dx = px - qx;
  const dy = py - qy;
  const dist = Math.hypot(dx, dy);
  return { x: qx, y: qy, t, dist };
}

// Find closest segment on a polyline to point (px,py). Returns segment index (point pair start)
export function closestSegment(
  points: number[],
  px: number,
  py: number,
  maxDist = 8,
): { index: number; x: number; y: number; t: number; dist: number } | null {
  let best: { index: number; x: number; y: number; t: number; dist: number } | null = null;
  for (let i = 2; i < points.length; i += 2) {
    const ax = points[i - 2];
    const ay = points[i - 1];
    const bx = points[i];
    const by = points[i + 1];
    const res = projectPointToSegment(px, py, ax, ay, bx, by);
    if (!best || res.dist < best.dist) {
      best = { index: i - 2, x: res.x, y: res.y, t: res.t, dist: res.dist };
    }
  }
  if (best && best.dist <= maxDist) return best;
  return null;
}

// Snap vector angle to multiples of 45° while preserving length
export function snapVector45(dx: number, dy: number) {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { dx, dy };
  const angle = Math.atan2(dy, dx);
  const step = Math.PI / 4;
  const snapped = Math.round(angle / step) * step;
  return { dx: Math.cos(snapped) * len, dy: Math.sin(snapped) * len };
}
