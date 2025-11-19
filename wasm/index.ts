// AssemblyScript module for geometry calculations
// Exports:
// - FLOAT64ARRAY_ID: type id for Float64Array (for loader helpers)
// - polyline_length(points: Float64Array): f64

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
