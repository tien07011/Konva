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

// Async WASM-accelerated variants (optional)
export async function projectPointToSegmentWasm(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Promise<{ x: number; y: number; t: number; dist: number }>{
  try {
    const wasm: any = await loadGeometryWasm();
    if (typeof wasm.project_point_to_segment === 'function' && typeof wasm.__getArray === 'function') {
      const ptr = wasm.project_point_to_segment(px, py, ax, ay, bx, by);
      const arr: number[] = wasm.__getArray(ptr);
      return { x: arr[0], y: arr[1], t: arr[2], dist: arr[3] };
    }
  } catch (_e) { /* wasm unavailable - fallback */ void 0; }
  return projectPointToSegment(px, py, ax, ay, bx, by);
}

export async function closestSegmentWasm(
  points: number[],
  px: number,
  py: number,
  maxDist = 8,
): Promise<{ index: number; x: number; y: number; t: number; dist: number } | null> {
  try {
    const wasm: any = await loadGeometryWasm();
    if (typeof wasm.closest_segment === 'function' && typeof wasm.__newArray === 'function' && typeof wasm.__getArray === 'function') {
      const arrPtr = wasm.__newArray(wasm.FLOAT64ARRAY_ID, new Float64Array(points));
      const resPtr = wasm.closest_segment(arrPtr, px, py, maxDist);
      const arr: number[] = wasm.__getArray(resPtr);
      const index = Math.floor(arr[0]);
      const dist = arr[4];
      if (index >= 0 && dist <= maxDist) {
        return { index, x: arr[1], y: arr[2], t: arr[3], dist };
      }
      return null;
    }
  } catch (_e) { /* wasm unavailable - fallback */ void 0; }
  return closestSegment(points, px, py, maxDist);
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
