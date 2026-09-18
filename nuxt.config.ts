const nitroPreset = process.env.NITRO_PRESET ?? "node-server";
const isCloudflarePreset = nitroPreset.startsWith("cloudflare");
const cloudflareR2BucketName = process.env.NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME;
const NOINDEX_ROBOTS = "noindex, nofollow";
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
    "nuxt-csurf",
    "@vueuse/nuxt",
    "nuxt-auth-utils",
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

  nitro: {
    preset: nitroPreset,
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
      ],
      exclude: ["@tiptap/extension-table"],
    },
  },
});
