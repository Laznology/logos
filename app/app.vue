<script setup>
useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
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
