import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { defineNuxtModule } from "nuxt/kit";

// ponytail: nuxt-csurf augments `nitropack`, but Nuxt resolves routeRules from
// `nitropack/types`, so the `csurf` rule needs declaring on both.
declare module "nitropack/types" {
  interface NitroRouteConfig {
    csurf?: Record<string, unknown> | false;
  }
}

const nitroPreset =
  process.env.NITRO_PRESET ||
  (process.env.WORKERS_CI ? "cloudflare_module" : "node-server");
const isCloudflarePreset = nitroPreset.startsWith("cloudflare");
const carouselRenderer = path.resolve("renderers/carousel-renderer.browser.ts");
const serverCarouselRenderer = path.resolve(
  `renderers/carousel-renderer.${isCloudflarePreset ? "wasm" : "node"}.ts`
);
const cloudflareR2BucketName = process.env.NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME;
const NOINDEX_ROBOTS = "noindex, nofollow";
const CLOUDFLARE_OBSERVABILITY = {
  enabled: true,
  logs: {
    enabled: true,
    head_sampling_rate: 1,
    invocation_logs: true,
    persist: true,
  },
  traces: {
    enabled: true,
    head_sampling_rate: 1,
    persist: true,
  },
  issue_detection: {
    enabled: true,
  },
};
const cloudflareObservabilityModule = defineNuxtModule({
  meta: { name: "cloudflare-observability" },
  setup(_options, nuxt) {
    if (!isCloudflarePreset || nuxt.options._prepare || nuxt.options.dev) {
      return;
    }

    nuxt.hook("close", async () => {
      const wranglerPath = path.join(
        nuxt.options.rootDir,
        ".output/server/wrangler.json"
      );
      const config = JSON.parse(await readFile(wranglerPath, "utf-8"));
      config.observability = {
        ...config.observability,
        ...CLOUDFLARE_OBSERVABILITY,
        logs: {
          ...config.observability?.logs,
          ...CLOUDFLARE_OBSERVABILITY.logs,
        },
        traces: {
          ...config.observability?.traces,
          ...CLOUDFLARE_OBSERVABILITY.traces,
        },
        issue_detection: {
          ...config.observability?.issue_detection,
          ...CLOUDFLARE_OBSERVABILITY.issue_detection,
        },
      };
      await writeFile(wranglerPath, JSON.stringify(config, null, 2));
    });
  },
});

export default defineNuxtConfig({
  compatibilityDate: "2026-06-30",
  ssr: true,
  css: ["~/assets/css/main.css"],

  devtools: {
    enabled: process.env.NODE_ENV !== "production",
  },

  site: {
    url: process.env.NUXT_SITE_URL,
    name: "Logos Publication",
    description: "Distraction-free thoughts, essays, and stories.",
    defaultLocale: "en",
    trailingSlash: false,
  },

  robots: {
    groups: [
      {
        userAgent: "*",
        disallow: ["/studio", "/login", "/register"],
      },
    ],
  },

  sitemap: {
    sources: ["/api/__sitemap__/urls"],
    exclude: ["/studio/**", "/api/**", "/login", "/register"],
  },

  routeRules: {
    "/login": { robots: NOINDEX_ROBOTS },
    "/register": { robots: NOINDEX_ROBOTS },
    // better-auth does its own origin/CSRF checks and is called from the client
    // with a JSON body, so the csurf cookie dance does not apply here.
    "/api/auth/**": { csurf: false },
  },

  icon: {
    serverBundle: "auto",
  },

  ogImage: {
    enabled: true,
    compatibility: {
      runtime: isCloudflarePreset
        ? {
            browser: "cloudflare",
            resvg: "wasm",
            satori: "wasm",
            takumi: "wasm",
            sharp: false,
            emoji: "fetch",
          }
        : { takumi: "node" },
      prerender: isCloudflarePreset
        ? { takumi: "wasm" }
        : { takumi: "node-dev" },
    },
    defaults: {
      width: 1200,
      height: 630,
      extension: "png",
      emojis: false,
      cacheMaxAgeSeconds: 60 * 60 * 24,
    },
  },

  hub: {
    blob:
      isCloudflarePreset && cloudflareR2BucketName
        ? {
            driver: "cloudflare-r2",
            binding: "BLOB",
            bucketName: cloudflareR2BucketName,
          }
        : true,
    db: {
      dialect: "sqlite",
      connection: {
        databaseId: process.env.NUXT_HUB_CLOUDFLARE_DATABASE_ID,
      },
      applyMigrationsDuringBuild: false,
    },
  },

  modules: [
    "@nuxt/ui",
    "@nuxthub/core",
    cloudflareObservabilityModule,
    "nuxt-csurf",
    "@vueuse/nuxt",
    "@nuxtjs/seo",
  ],

  ui: {
    experimental: {
      componentDetection: true,
    },
  },

  sourcemap: {
    server: false,
    client: false,
  },

  experimental: {
    inlineRouteRules: true,
  },

  alias: {
    "#carousel-renderer": carouselRenderer,
  },

  nitro: {
    preset: nitroPreset,
    alias: {
      "#carousel-renderer": serverCarouselRenderer,
    },
    ...(isCloudflarePreset ? {} : { exportConditions: ["!unwasm"] }),
    minify: true,
    prerender: {
      crawlLinks: false,
    },
  },

  vite: {
    build: {
      cssMinify: true,
      minify: true,
    },
    optimizeDeps: {
      include: [
        "@nuxt/ui > prosemirror-state",
        "@nuxt/ui > prosemirror-transform",
        "@nuxt/ui > prosemirror-model",
        "@nuxt/ui > prosemirror-view",
        "@nuxt/ui > prosemirror-gapcursor",
        "@tiptap/pm > prosemirror-state",
        "@tiptap/pm > prosemirror-transform",
        "@tiptap/pm > prosemirror-model",
        "@tiptap/pm > prosemirror-view",
        "@tiptap/pm > prosemirror-gapcursor",
        "@tiptap/pm/tables",
        "@tiptap/extension-table",
        "@tiptap/extension-table-cell",
        "@tiptap/extension-table-header",
        "@tiptap/extension-table-row",
      ],
    },
    resolve: {
      // ponytail: satu instance paksa — pemakan kelas bug "Duplicate use of selection JSON ID"
      dedupe: [
        "prosemirror-state",
        "prosemirror-view",
        "prosemirror-model",
        "prosemirror-transform",
        "prosemirror-gapcursor",
        "prosemirror-tables",
        "@tiptap/core",
        "@tiptap/pm",
        "@tiptap/extension-table",
        "@tiptap/extension-table-cell",
        "@tiptap/extension-table-header",
        "@tiptap/extension-table-row",
      ],
    },
  },
});
