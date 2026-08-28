<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

const open = defineModel<boolean>("open", { default: false });
const active = ref("profile");

const items: TabsItem[] = [
  {
    label: "Profile",
    icon: "i-lucide-user",
    value: "profile",
    slot: "profile" as const,
  },
  {
    label: "Security",
    icon: "i-lucide-shield",
    value: "security",
    slot: "security" as const,
  },
  {
    label: "Sessions",
    icon: "i-lucide-monitor-smartphone",
    value: "sessions",
    slot: "sessions" as const,
  },
  {
    label: "Preferences",
    icon: "i-lucide-sliders-horizontal",
    value: "preferences",
    slot: "preferences" as const,
  },
];
</script>

<template>
  <UModal
    v-model:open="open"
    title="Account settings"
    :ui="{
      content: 'max-w-3xl h-[min(40rem,calc(100dvh-2rem))]',
      body: 'min-h-0 flex overflow-hidden p-0 sm:p-0',
    }"
  >
    <template #body>
      <UTabs
        v-model="active"
        :items="items"
        orientation="vertical"
        :ui="{
          root: 'min-h-0 flex-1 items-stretch justify-start gap-4 sm:gap-6 p-4 sm:p-6',
          list: 'flex-row sm:flex-col sm:w-44 shrink-0 sm:h-fit self-start items-start justify-start',
          trigger: 'justify-start text-start',
        }"
      >
        <template #profile>
          <AdminSettingsProfileTab />
        </template>
        <template #security>
          <AdminSettingsSecurityTab />
        </template>
        <template #sessions>
          <AdminSettingsSessionsTab />
        </template>
        <template #preferences>
          <AdminSettingsPreferencesTab />
        </template>
      </UTabs>
    </template>
  </UModal>
</template>
