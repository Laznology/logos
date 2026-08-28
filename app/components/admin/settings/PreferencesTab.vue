<script setup lang="ts">
const colorMode = useColorMode();
const isCollapsed = useCookie<boolean>("admin_sidebar_collapsed", {
  default: () => false,
});

const themeOptions = [
  { label: "System", value: "system", icon: "i-lucide-monitor" },
  { label: "Light", value: "light", icon: "i-lucide-sun" },
  { label: "Dark", value: "dark", icon: "i-lucide-moon" },
];
</script>

<template>
  <div class="max-w-sm space-y-8">
    <section class="space-y-3">
      <h3 class="text-highlighted text-sm font-semibold">Theme</h3>
      <URadioGroup
        v-model="colorMode.preference"
        :items="themeOptions"
        variant="card"
        :ui="{ fieldset: 'grid grid-cols-3 gap-2' }"
      />
    </section>

    <section class="space-y-3">
      <h3 class="text-highlighted text-sm font-semibold">Sidebar</h3>
      <USwitch v-model="isCollapsed" label="Collapse sidebar by default" />
    </section>
  </div>
</template>
