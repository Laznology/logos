<script setup lang="ts">
const { showText = true, size = "md" } = defineProps<{
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}>();
</script>

<template>
  <div
    class="inline-flex items-center gap-2.5 leading-none font-semibold select-none"
  >
    <span
      aria-hidden="true"
      style="view-transition-name: logo-mark"
      :class="[
        'bg-primary app-logo-mark shrink-0 rounded-md',
        size === 'sm' ? 'size-6' : size === 'lg' ? 'size-10' : 'size-8',
      ]"
    />
    <span
      v-if="showText"
      :class="[
        'text-highlighted font-bold tracking-tight',
        size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
      ]"
    >
      Logos
    </span>
  </div>
</template>
