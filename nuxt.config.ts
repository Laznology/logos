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

  runtimeConfig: {
    public: {
      partykitHost: "",
    },
  },

  ui: {
    experimental: {
      componentDetection: true,
    },
  },

  vite: {
    optimizeDeps: {
      include: ["@nuxt/ui > prosemirror-state", "yjs", "y-partykit/provider"],
    },
  },
});
