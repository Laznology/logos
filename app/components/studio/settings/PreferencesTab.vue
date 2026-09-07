<script setup lang="ts">
import { FetchError } from "ofetch";

import type { SiteSettings } from "#shared/types/settings";

const colorMode = useColorMode();
const isCollapsed = useCookie<boolean>("admin_sidebar_collapsed", {
  default: () => false,
});
const { user } = useUserSession();
const toast = useToast();
const { $csrfFetch } = useNuxtApp();

const themeOptions = [
  { label: "System", value: "system", icon: "i-lucide-monitor" },
  { label: "Light", value: "light", icon: "i-lucide-sun" },
  { label: "Dark", value: "dark", icon: "i-lucide-moon" },
];

async function fetchSettings() {
  try {
    return await globalThis.$fetch<SiteSettings>("/api/studio/settings");
  } catch {
    return null;
  }
}

const {
  data: siteSettings,
  pending: settingsPending,
  error: settingsError,
  refresh: refreshSettings,
} = useAsyncData<SiteSettings | null>("studio-site-settings", fetchSettings);

const isAdmin = computed(
  () => user.value?.role === "admin" || Boolean(siteSettings.value)
);

const workspaceForm = reactive<SiteSettings>({
  graphEnabledByDefault: true,
  registrationEnabled: true,
});
const isSavingSettings = ref(false);
const saveError = ref("");

watch(
  siteSettings,
  (settings) => {
    if (settings) {
      workspaceForm.graphEnabledByDefault = settings.graphEnabledByDefault;
      workspaceForm.registrationEnabled = settings.registrationEnabled;
    }
  },
  { immediate: true }
);

async function saveWorkspaceSettings() {
  isSavingSettings.value = true;
  saveError.value = "";
  try {
    await $csrfFetch<SiteSettings>("/api/studio/settings", {
      method: "PUT",
      body: workspaceForm,
    });
    await refreshSettings();
    toast.add({ title: "Workspace settings saved", color: "success" });
  } catch (error) {
    saveError.value =
      error instanceof FetchError
        ? error.statusMessage || "Could not save workspace settings."
        : "Could not save workspace settings.";
  } finally {
    isSavingSettings.value = false;
  }
}
</script>

<template>
  <div class="max-w-xl space-y-8">
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

    <section v-if="isAdmin" class="border-default space-y-4 border-t pt-6">
      <div>
        <h3 class="text-highlighted text-sm font-semibold">
          Workspace settings
        </h3>
        <p class="text-muted mt-1 text-xs">
          Defaults applied to public readers and new accounts.
        </p>
      </div>

      <div v-if="settingsError" class="text-error text-sm">
        Could not load workspace settings.
      </div>

      <div class="space-y-4">
        <USwitch
          v-model="workspaceForm.graphEnabledByDefault"
          label="Show graph by default"
          description="Readers can still open it manually when disabled."
          :disabled="settingsPending || isSavingSettings"
        />
        <USwitch
          v-model="workspaceForm.registrationEnabled"
          label="Allow public registration"
          description="Let new users create an account from the register page."
          :disabled="settingsPending || isSavingSettings"
        />
      </div>

      <p v-if="saveError" class="text-error text-sm" role="alert">
        {{ saveError }}
      </p>
      <UButton
        size="sm"
        :loading="isSavingSettings"
        :disabled="settingsPending || Boolean(settingsError)"
        @click="saveWorkspaceSettings"
      >
        Save workspace settings
      </UButton>
    </section>
  </div>
</template>
