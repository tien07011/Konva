// Using loose typings for loader compatibility across versions
import { instantiate } from '@assemblyscript/loader';

// Types matching our AssemblyScript exports
export interface GeometryWasmExports {
  memory: WebAssembly.Memory;
  FLOAT64ARRAY_ID: number;
  polyline_length(pointsPtr: number): number;
  // Additional exports can be declared here as needed
  [key: string]: any;
}

let wasmPromise: Promise<GeometryWasmExports> | null = null;

export function loadGeometryWasm(): Promise<GeometryWasmExports> {
  if (!wasmPromise) {
    const url = '/wasm/geometry.wasm';
    wasmPromise = fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load WASM: ${res.status}`);
        const buf = await res.arrayBuffer();
        return instantiate(buf, {} as any);
      })
      .then((mod) => mod.exports as unknown as GeometryWasmExports);
  }
  return wasmPromise;
}
