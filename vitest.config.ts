import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    hookTimeout: 30_000,
    testTimeout: 30_000,
    projects: [
      {
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
