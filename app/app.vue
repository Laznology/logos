<script setup lang="ts">
import type { SiteSettings } from "#shared/types/settings";

const defaultTitle = "Logos Publication";
const description = "Distraction-free thoughts, essays, and stories.";

const { data: siteSettings } = useNuxtData<SiteSettings>(
  "public-site-settings"
);

const iconLinks = computed(() => {
  const logo = siteSettings.value?.logo;
  if (logo) {
    return [
      { rel: "icon" as const, href: logo },
      { rel: "apple-touch-icon" as const, href: logo },
    ];
  }
  return [
    {
      rel: "icon" as const,
      type: "image/x-icon",
      href: "/favicon.ico",
      sizes: "any",
    },
    {
      rel: "icon" as const,
      type: "image/png",
      href: "/favicon-32x32.png",
      sizes: "32x32",
    },
    {
      rel: "apple-touch-icon" as const,
      href: "/apple-touch-icon.png",
      sizes: "180x180",
    },
  ];
});

useHead({
  htmlAttrs: {
    lang: "en",
  },
  titleTemplate: (title) => title || defaultTitle,
  link: computed(() => [
    ...iconLinks.value,
    { rel: "manifest", href: "/site.webmanifest" },
  ]),
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
