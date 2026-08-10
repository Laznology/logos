<script setup>
useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [{ href: "/favicon.ico", rel: "icon" }],
  meta: [{ content: "width=device-width, initial-scale=1", name: "viewport" }],
});

const title = "Nuxt Editor Template";
const description =
  "A Notion-like WYSIWYG editor with AI-powered completions and real-time collaboration in Vue & Nuxt.";

useSeoMeta({
  description,
  ogDescription: description,
  ogImage: "https://ui.nuxt.com/assets/templates/nuxt/editor-light.png",
  ogTitle: title,
  title,
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
