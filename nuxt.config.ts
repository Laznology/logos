// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-06-30",

  css: ["~/assets/css/main.css"],

  devtools: {
    enabled: true,
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
      include: ["@nuxt/ui > prosemirror-state"],
    },
  },
});
