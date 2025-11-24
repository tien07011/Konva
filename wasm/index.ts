// AssemblyScript module for geometry calculations
// Exports:
// - FLOAT64ARRAY_ID: type id for Float64Array (for loader helpers)
// - polyline_length(points: Float64Array): f64
// - circle_length(r: f64): f64
// - circle_point_distance(cx, cy, r, px, py): f64
// - circle_perimeter_point_towards(cx, cy, r, px, py): Float64Array [x,y]
// - circle_intersect_ray(cx, cy, r, x1, y1, x2, y2): Float64Array [x,y] or [NaN,NaN]
// - circle_intersect_ray_t(cx, cy, r, x1, y1, x2, y2): f64 (param t on ray, NaN if no hit)
// - circle_bbox(cx, cy, r): Float64Array [minx, miny, maxx, maxy]
// - project_point_to_segment(px, py, ax, ay, bx, by): Float64Array [x,y,t,dist]
// - closest_segment(points: Float64Array, px: f64, py: f64, maxDist: f64): Float64Array [index,x,y,t,dist]

export const FLOAT64ARRAY_ID: i32 = idof<Float64Array>();

// Euclidean distance between two points
function dist(x0: f64, y0: f64, x1: f64, y1: f64): f64 {
  const dx = x1 - x0;
  const dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
}

// Compute the total length of a polyline represented as [x0, y0, x1, y1, ...]
export function polyline_length(points: Float64Array): f64 {
  const n = points.length;
  if (n < 4) return 0.0;
  let total: f64 = 0.0;
  for (let i = 2; i < n; i += 2) {
    total += dist(points[i - 2], points[i - 1], points[i], points[i + 1]);
  }
  return total;
}

// Circle circumference
export function circle_length(r: f64): f64 {
  const rr = Math.abs(r);
  return 2.0 * Math.PI * rr;
}

// Distance from a point to circle boundary (absolute difference)
export function circle_point_distance(cx: f64, cy: f64, r: f64, px: f64, py: f64): f64 {
  const d = dist(cx, cy, px, py);
  return Math.abs(d - Math.abs(r));
}

// Point on the circle perimeter in direction from center to (px,py)
export function circle_perimeter_point_towards(
  cx: f64,
  cy: f64,
  r: f64,
  px: f64,
  py: f64,
): Float64Array {
  const ang = Math.atan2(py - cy, px - cx);
  const rr = Math.abs(r);
  const out = new Float64Array(2);
  out[0] = cx + rr * Math.cos(ang);
  out[1] = cy + rr * Math.sin(ang);
  return out;
}

// Intersection of ray (x1,y1)->(x2,y2) with circle. Returns closest point with t>=0 or NaN,NaN.
export function circle_intersect_ray(
  cx: f64,
  cy: f64,
  r: f64,
  x1: f64,
  y1: f64,
  x2: f64,
  y2: f64,
): Float64Array {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const A = dx * dx + dy * dy;
  const B = 2.0 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4.0 * A * C;
  const out = new Float64Array(2);
  if (disc < 0.0 || A == 0.0) {
    out[0] = NaN;
    out[1] = NaN;
    return out;
  }
  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-B - sqrtDisc) / (2.0 * A);
  const t2 = (-B + sqrtDisc) / (2.0 * A);
  let t = t1;
  if (t < 0.0) t = t2;
  if (t < 0.0) {
    out[0] = NaN;
    out[1] = NaN;
    return out;
  }
  out[0] = x1 + t * dx;
  out[1] = y1 + t * dy;
  return out;
}

// Same as above but returns scalar parameter t on the ray, or NaN if no hit
export function circle_intersect_ray_t(
  cx: f64,
  cy: f64,
  r: f64,
  x1: f64,
  y1: f64,
  x2: f64,
  y2: f64,
): f64 {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const A = dx * dx + dy * dy;
  const B = 2.0 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4.0 * A * C;
  if (disc < 0.0 || A == 0.0) return NaN;
  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-B - sqrtDisc) / (2.0 * A);
  const t2 = (-B + sqrtDisc) / (2.0 * A);
  let t = t1;
  if (t < 0.0) t = t2;
  if (t < 0.0) return NaN;
  return t;
}

// Bounding box of circle
export function circle_bbox(cx: f64, cy: f64, r: f64): Float64Array {
  const rr = Math.abs(r);
  const out = new Float64Array(4);
  out[0] = cx - rr;
  out[1] = cy - rr;
  out[2] = cx + rr;
  out[3] = cy + rr;
  return out;
}

// Project point to segment
export function project_point_to_segment(
  px: f64,
  py: f64,
  ax: f64,
  ay: f64,
  bx: f64,
  by: f64,
): Float64Array {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  let t: f64 = 0.0;
  if (ab2 > 0.0) t = (apx * abx + apy * aby) / ab2;
  if (t < 0.0) t = 0.0;
  else if (t > 1.0) t = 1.0;
  const qx = ax + t * abx;
  const qy = ay + t * aby;
  const d = dist(px, py, qx, qy);
  const out = new Float64Array(4);
  out[0] = qx;
  out[1] = qy;
  out[2] = t;
  out[3] = d;
  return out;
}

// Find closest segment in polyline to point (px,py). If maxDist >= 0, applies threshold.
export function closest_segment(
  points: Float64Array,
  px: f64,
  py: f64,
  maxDist: f64,
): Float64Array {
  let bestIndex: f64 = -1.0;
  let bestX: f64 = NaN;
  let bestY: f64 = NaN;
  let bestT: f64 = NaN;
  let bestD: f64 = 1.0 / 0.0; // Infinity
  const n = points.length;
  for (let i = 2; i < n; i += 2) {
    const ax = points[i - 2];
    const ay = points[i - 1];
    const bx = points[i];
    const by = points[i + 1];
    const res = project_point_to_segment(px, py, ax, ay, bx, by);
    const d = res[3];
    if (d < bestD) {
      bestD = d;
      bestIndex = f64(i - 2);
      bestX = res[0];
      bestY = res[1];
      bestT = res[2];
    }
  }
  if (maxDist >= 0.0 && bestD > maxDist) {
    bestIndex = -1.0;
    bestX = NaN;
    bestY = NaN;
    bestT = NaN;
    bestD = 1.0 / 0.0;
  }
  const out = new Float64Array(5);
  out[0] = bestIndex;
  out[1] = bestX;
  out[2] = bestY;
  out[3] = bestT;
  out[4] = bestD;
  return out;
}
