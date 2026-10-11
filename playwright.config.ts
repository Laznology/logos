import type { ConfigOptions } from "@nuxt/test-utils/playwright";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig<ConfigOptions>({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The auth origin must match a known server URL, which pins the test server
  // to a single port, so workers cannot run in parallel.
  workers: 1,
  reporter: "html",
  use: {
    trace: "on-first-retry",
    nuxt: {
      rootDir: import.meta.dirname,
      // Each Playwright test builds its own Nuxt server; the default 120s is
      // not enough when several build in parallel.
      setupTimeout: 240_000,
      // Fixed port so the auth origin below matches the server URL.
      port: 3000,
      env: {
        // Production builds read NUXT_SITE_URL for better-auth's baseURL; point
        // both at the test origin so the sign-up origin check passes.
        BETTER_AUTH_URL: "http://127.0.0.1:3000",
        NUXT_SITE_URL: "http://127.0.0.1:3000",
      },
      // Run against an isolated Hub dir so e2e gets a fresh, migrated database
      // instead of mutating the developer's local .data state.
      nuxtConfig: {
        hub: {
          dir: ".data-e2e",
          db: { applyMigrationsDuringBuild: true },
        },
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
