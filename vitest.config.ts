import path from "node:path";

import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

// Mirrors the `#carousel-renderer` alias from nuxt.config.ts so server utils
// resolve under the node-environment `unit` project.
const nodeCarouselRenderer = path.resolve(
  import.meta.dirname,
  "renderers/carousel-renderer.node.ts"
);

export default defineConfig({
  test: {
    hookTimeout: 30_000,
    testTimeout: 30_000,
    projects: [
      {
        resolve: {
          alias: { "#carousel-renderer": nodeCarouselRenderer },
        },
        test: {
          name: "unit",
          include: ["test/unit/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          hookTimeout: 30_000,
          testTimeout: 30_000,
          include: ["test/nuxt/*.{test,spec}.ts"],
          // SFC <style> blocks must be processed for getComputedStyle assertions.
          css: true,
          environmentOptions: {
            nuxt: {
              rootDir: import.meta.dirname,
              domEnvironment: "happy-dom",
            },
          },
        },
      }),
    ],
    coverage: {
      enabled: true,
      provider: "v8",
    },
  },
});
