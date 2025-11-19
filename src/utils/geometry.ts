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
