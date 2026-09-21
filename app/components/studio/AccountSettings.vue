<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

const open = defineModel<boolean>("open", { default: false });
const active = ref("profile");
const { user } = useUserSession();

const items = computed<TabsItem[]>(() => {
  const tabs: TabsItem[] = [
    {
      label: "Profile",
      icon: "i-lucide-user",
      value: "profile",
      slot: "profile",
    },
    {
      label: "Security",
      icon: "i-lucide-shield",
      value: "security",
      slot: "security",
    },
    {
      label: "Sessions",
      icon: "i-lucide-monitor-smartphone",
      value: "sessions",
      slot: "sessions",
    },
    {
      label: "Preferences",
      icon: "i-lucide-sliders-horizontal",
      value: "preferences",
      slot: "preferences",
    },
  ];

  if (user.value?.role === "admin") {
    tabs.push({
      label: "Workspace",
      icon: "i-lucide-building-2",
      value: "workspace",
      slot: "workspace",
      ui: {
        trigger:
          "border-l border-default sm:border-l-0 sm:border-t sm:mt-2 sm:pt-2",
      },
    });
  }

  return tabs;
});
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
          content: 'min-h-0 flex-1 overflow-y-auto',
        }"
      >
        <template #profile>
          <StudioSettingsProfileTab />
        </template>
        <template #security>
          <StudioSettingsSecurityTab />
        </template>
        <template #sessions>
          <StudioSettingsSessionsTab />
        </template>
        <template #preferences>
          <StudioSettingsPreferencesTab />
        </template>
        <template #workspace>
          <StudioSettingsWorkspaceTab />
        </template>
      </UTabs>
    </template>
  </UModal>
</template>
