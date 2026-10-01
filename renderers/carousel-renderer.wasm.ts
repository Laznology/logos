import init, { Renderer } from "@takumi-rs/wasm";

let initialized = false;

export async function createCarouselRenderer() {
  if (!initialized) {
    const wasmModule =
      (await import("@takumi-rs/wasm/takumi_wasm_bg.wasm")) as unknown as WebAssembly.Module;
    await init({ module_or_path: wasmModule });
    initialized = true;
  }

  return new Renderer();
}
