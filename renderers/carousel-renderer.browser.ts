import init, { Renderer } from "@takumi-rs/wasm";
import wasmUrl from "@takumi-rs/wasm/vite";

let initialized = false;

export async function createCarouselRenderer() {
  if (!initialized) {
    await init(wasmUrl);
    initialized = true;
  }

  return new Renderer();
}
