<script setup>
const { data: siteSettings } = await useFetch("/api/public/settings", {
  key: "public-site-settings",
});

const defaultTitle = "Logos Publication";
const description = "Distraction-free thoughts, essays, and stories.";

const siteName = computed(() => siteSettings.value?.title || defaultTitle);

useHead({
  htmlAttrs: {
    lang: "en",
  },
  titleTemplate: (title) => {
    const name = siteName.value;
    if (!title) {
      return name;
    }
    return title.includes(name) ? title : `${title} | ${name}`;
  },
  link: computed(() => {
    const logo = siteSettings.value?.logo;
    if (logo) {
      return [
        { rel: "icon", href: logo },
        { rel: "apple-touch-icon", href: logo },
        { rel: "manifest", href: "/site.webmanifest" },
      ];
    }
    return [
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
    ];
  }),
  meta: [{ content: "width=device-width, initial-scale=1", name: "viewport" }],
});

useSeoMeta({
  description,
  ogDescription: description,
  ogSiteName: () => siteName.value,
  ogTitle: () => siteName.value,
  title: () => siteName.value,
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
