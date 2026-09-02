const nitroPreset = process.env.NITRO_PRESET ?? "node-server";
const isCloudflarePreset = nitroPreset.startsWith("cloudflare");
const NOINDEX_ROBOTS = "noindex, nofollow";
export default defineNuxtConfig({
  compatibilityDate: "2026-06-30",
  ssr: true,
  css: ["~/assets/css/main.css"],

  devtools: {
    enabled: true,
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
        disallow: ["/admin", "/login", "/register"],
      },
    ],
  },

  sitemap: {
    sources: ["/api/__sitemap__/urls"],
    exclude: ["/admin/**", "/api/**", "/login", "/register"],
  },

  routeRules: {
    "/admin/**": { ssr: false, robots: NOINDEX_ROBOTS },
    "/login": { robots: NOINDEX_ROBOTS },
    "/register": { robots: NOINDEX_ROBOTS },
  },

  icon: {
    serverBundle: "auto",
  },

  ogImage: {
    enabled: true,
    compatibility: {
      runtime: {
        takumi: isCloudflarePreset ? "wasm" : "node",
      },
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
    blob: true,
    db: {
      dialect: "sqlite",
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
    viewTransition: true,
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
