<script setup>
const defaultTitle = "Logos Publication";
const description = "Distraction-free thoughts, essays, and stories.";

useHead({
  htmlAttrs: {
    lang: "en",
  },
  titleTemplate: (title) => title || defaultTitle,
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
    { rel: "manifest", href: "/site.webmanifest" },
  ],
  meta: [{ content: "width=device-width, initial-scale=1", name: "viewport" }],
});

useSeoMeta({
  description,
  ogDescription: description,
  ogSiteName: defaultTitle,
  ogTitle: defaultTitle,
  title: defaultTitle,
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp
    :toaster="{
      position: 'bottom-center',
    }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
