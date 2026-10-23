import { readFile } from "node:fs/promises";
import path from "node:path";

import { Renderer } from "@takumi-rs/wasm/node";

const fonts = Promise.all([
  readFile(path.resolve("public/SpaceGrotesk-SemiBold.ttf")),
  readFile(path.resolve("public/SpaceMono-Regular.ttf")),
  readFile(path.resolve("public/SpaceMono-Bold.ttf")),
]);

export async function createCarouselRenderer() {
  const renderer = new Renderer();
  const loadedFonts = await fonts;
  await Promise.all(loadedFonts.map((font) => renderer.registerFont(font)));
  return renderer;
}
