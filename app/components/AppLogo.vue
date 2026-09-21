<script setup lang="ts">
import type { SiteSettings } from "#shared/types/settings";

const { showText = true, size = "md" } = defineProps<{
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}>();

const { data: siteSettings } = useNuxtData<SiteSettings>(
  "public-site-settings"
);

const logo = computed(() => siteSettings.value?.logo || "");
const name = computed(() => siteSettings.value?.title || "Logos");
const markSize = computed(() =>
  size === "sm" ? "size-6" : size === "lg" ? "size-10" : "size-8"
);
</script>

<template>
  <div
    class="inline-flex items-center gap-2.5 leading-none font-semibold select-none"
  >
    <img
      v-if="logo"
      :src="logo"
      alt=""
      style="view-transition-name: logo-mark"
      :class="['shrink-0 rounded-md object-contain', markSize]"
    />
    <span
      v-else
      aria-hidden="true"
      style="view-transition-name: logo-mark"
      :class="['bg-primary app-logo-mark shrink-0 rounded-md', markSize]"
    />
    <span
      v-if="showText"
      :class="[
        'text-highlighted font-bold tracking-tight',
        size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
      ]"
    >
      {{ name }}
    </span>
  </div>
</template>
