import init, { Renderer } from "@takumi-rs/wasm";
import wasmUrl from "@takumi-rs/wasm/vite";

let initialized = false;
let fonts: Promise<Uint8Array[]> | null = null;

async function loadFont(path: string) {
  const response = await fetch(path);
  return new Uint8Array(await response.arrayBuffer());
}

export async function createCarouselRenderer() {
  if (!initialized) {
    await init(wasmUrl);
    initialized = true;
  }

  if (!fonts) {
    fonts = Promise.all([
      loadFont("/SpaceGrotesk-SemiBold.ttf"),
      loadFont("/SpaceMono-Regular.ttf"),
      loadFont("/SpaceMono-Bold.ttf"),
    ]);
  }

  const renderer = new Renderer();
  const loadedFonts = await fonts;
  await Promise.all(loadedFonts.map((font) => renderer.registerFont(font)));
  return renderer;
}
