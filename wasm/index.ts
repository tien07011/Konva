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
