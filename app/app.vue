<script setup>
useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    { rel: "manifest", href: "/site.webmanifest" },
  ],
  meta: [{ content: "width=device-width, initial-scale=1", name: "viewport" }],
});

const title = "Logos Publication";
const description = "Distraction-free thoughts, essays, and stories.";

useSeoMeta({
  description,
  ogDescription: description,
  ogTitle: title,
  title,
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
