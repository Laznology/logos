<script setup lang="ts">
import { FetchError } from "ofetch";

import type { SiteSettings } from "#shared/types/settings";

const toast = useToast();
const { $csrfFetch } = useNuxtApp();
const { csrf, headerName } = useCsrf();
const upload = useUpload("/api/upload", {
  formKey: "file",
  headers: { [headerName]: csrf },
  multiple: false,
});

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

const workspaceForm = reactive({
  title: "",
  logo: "",
  graphEnabledByDefault: true,
  registrationEnabled: true,
});
const isSavingSettings = ref(false);
const isUploadingLogo = ref(false);
const saveError = ref("");
const logoInput = ref<HTMLInputElement>();

watch(
  siteSettings,
  (settings) => {
    if (settings) {
      workspaceForm.title = settings.title || "";
      workspaceForm.logo = settings.logo || "";
      workspaceForm.graphEnabledByDefault = settings.graphEnabledByDefault;
      workspaceForm.registrationEnabled = settings.registrationEnabled;
    }
  },
  { immediate: true }
);

async function onLogoFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  isUploadingLogo.value = true;
  saveError.value = "";
  try {
    const result = await upload(file);
    workspaceForm.logo = `/images/${result.pathname}`;
  } catch {
    saveError.value = "Logo upload failed.";
  } finally {
    isUploadingLogo.value = false;
    input.value = "";
  }
}

async function saveWorkspaceSettings() {
  isSavingSettings.value = true;
  saveError.value = "";
  try {
    await $csrfFetch<SiteSettings>("/api/studio/settings", {
      method: "PUT",
      body: {
        ...workspaceForm,
        title: workspaceForm.title.trim() || null,
        logo: workspaceForm.logo.trim() || null,
      },
    });
    await refreshSettings();
    await refreshNuxtData("public-site-settings");
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
    <section class="space-y-4">
      <div>
        <h3 class="text-highlighted text-sm font-semibold">Branding</h3>
        <p class="text-muted mt-1 text-xs">
          Shown to readers across the public site.
        </p>
      </div>

      <div v-if="settingsError" class="text-error text-sm">
        Could not load workspace settings.
      </div>

      <UFormField
        label="Workspace title"
        description="Shown in the browser tab and site header."
      >
        <UInput
          v-model="workspaceForm.title"
          placeholder="Logos Publication"
          class="w-full"
          :disabled="settingsPending || isSavingSettings"
        />
      </UFormField>

      <UFormField
        label="Logo"
        description="Used as the site icon (favicon) and header logo. Paste a link or upload an image, max 2MB."
      >
        <div class="flex w-full items-center gap-3">
          <img
            v-if="workspaceForm.logo"
            :src="workspaceForm.logo"
            alt="Logo preview"
            class="border-default size-10 shrink-0 rounded-md border object-contain"
          />
          <span
            v-else
            aria-hidden="true"
            class="bg-primary app-logo-mark size-10 shrink-0 rounded-md"
          />
          <UInput
            v-model="workspaceForm.logo"
            placeholder="https://… or /images/…"
            class="flex-1"
            :disabled="settingsPending || isSavingSettings"
          />
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onLogoFileChange"
          />
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            icon="i-lucide-upload"
            :loading="isUploadingLogo"
            :disabled="settingsPending || isSavingSettings"
            @click="logoInput?.click()"
          >
            Upload
          </UButton>
        </div>
      </UFormField>
    </section>

    <section class="space-y-4">
      <div>
        <h3 class="text-highlighted text-sm font-semibold">Defaults</h3>
        <p class="text-muted mt-1 text-xs">
          Applied to public readers and new accounts.
        </p>
      </div>
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
    </section>

    <div class="space-y-3">
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
    </div>
  </div>
</template>
