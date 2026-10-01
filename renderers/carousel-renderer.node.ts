import { Renderer } from "@takumi-rs/wasm/node";

export async function createCarouselRenderer() {
  return new Renderer();
}
