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

const DEFAULT_SIDEBAR_LOGO = "/android-chrome-192x192.png";
const DEFAULT_SITE_ICON = "/favicon-32x32.png";
const previewTitle = computed(() => workspaceForm.title.trim() || "Logos");
const previewLogo = computed(() => workspaceForm.logo.trim());

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
  <div class="max-w-2xl">
    <header class="border-default border-b pb-5">
      <h2 class="text-highlighted text-lg font-semibold tracking-tight">
        Workspace settings
      </h2>
      <p class="text-muted mt-1 text-sm">
        Branding, previews, and defaults for everyone in this workspace.
      </p>
    </header>

    <div v-if="settingsError" class="text-error py-6 text-sm">
      Could not load workspace settings.
    </div>

    <section class="border-default space-y-5 border-b py-6">
      <div>
        <h3 class="text-highlighted text-sm font-semibold">Branding</h3>
        <p class="text-muted mt-1 text-xs">
          Shown to readers across the public site.
        </p>
      </div>

      <UFormField
        label="Logo"
        description="Used as the site icon and sidebar mark. Remove it to use the default static assets."
      >
        <div class="mt-1 flex items-start gap-4">
          <div
            class="border-default bg-elevated/50 flex size-16 shrink-0 items-center justify-center rounded-lg border"
          >
            <img
              :src="previewLogo || DEFAULT_SIDEBAR_LOGO"
              alt=""
              class="size-11 object-contain"
            />
          </div>
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
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
                Upload image
              </UButton>
              <UButton
                v-if="previewLogo"
                size="sm"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :disabled="settingsPending || isSavingSettings"
                @click="workspaceForm.logo = ''"
              >
                Remove
              </UButton>
            </div>
            <p class="text-dimmed text-xs">
              PNG, JPG or WebP, up to 2MB. Paste a URL below or upload a file.
            </p>
          </div>
        </div>
        <UInput
          v-model="workspaceForm.logo"
          placeholder="https://… or /images/…"
          size="sm"
          class="mt-3 w-full"
          :disabled="settingsPending || isSavingSettings"
        />
      </UFormField>

      <UFormField
        label="Workspace name"
        description="Shown in the browser tab, sidebar, and site header."
      >
        <UInput
          v-model="workspaceForm.title"
          placeholder="Logos Publication"
          size="sm"
          class="mt-1 w-full"
          :disabled="settingsPending || isSavingSettings"
        />
      </UFormField>
    </section>

    <section class="border-default space-y-4 border-b py-6">
      <div>
        <h3 class="text-highlighted text-sm font-semibold">Preview</h3>
        <p class="text-muted mt-1 text-xs">
          How your branding appears in the studio and the browser tab.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <p
            class="text-dimmed text-[11px] font-medium tracking-wider uppercase"
          >
            Studio sidebar
          </p>
          <div class="border-default bg-elevated/40 rounded-lg border p-3">
            <div class="flex items-center gap-2">
              <img
                :src="previewLogo || DEFAULT_SIDEBAR_LOGO"
                alt=""
                class="size-5 shrink-0 rounded object-contain"
              />
              <span class="text-highlighted truncate text-xs font-semibold">
                {{ previewTitle }}
              </span>
            </div>
            <div class="mt-3 space-y-1">
              <div
                class="bg-default flex items-center gap-2 rounded px-2 py-1.5"
              >
                <UIcon name="i-lucide-file-text" class="text-muted size-3" />
                <span class="bg-accented h-1.5 w-16 rounded-full" />
              </div>
              <div class="flex items-center gap-2 rounded px-2 py-1.5">
                <UIcon name="i-lucide-pen-line" class="text-dimmed size-3" />
                <span class="bg-accented/70 h-1.5 w-12 rounded-full" />
              </div>
              <div class="flex items-center gap-2 rounded px-2 py-1.5">
                <UIcon name="i-lucide-network" class="text-dimmed size-3" />
                <span class="bg-accented/70 h-1.5 w-14 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <p
            class="text-dimmed text-[11px] font-medium tracking-wider uppercase"
          >
            Site icon
          </p>
          <div
            class="border-default bg-elevated/40 overflow-hidden rounded-lg border"
          >
            <div
              class="border-default bg-muted/50 flex items-center gap-1 border-b px-2 py-1.5"
            >
              <span class="bg-accented size-1.5 rounded-full" />
              <span class="bg-accented size-1.5 rounded-full" />
              <span class="bg-accented size-1.5 rounded-full" />
            </div>
            <div class="flex items-center gap-1.5 px-2 pt-1.5">
              <div
                class="bg-default flex min-w-0 flex-1 items-center gap-1.5 rounded-t-md px-2 py-1.5"
              >
                <img
                  :src="previewLogo || DEFAULT_SITE_ICON"
                  alt=""
                  class="size-3 shrink-0 rounded-[3px] object-contain"
                />
                <span class="text-muted truncate text-[11px]">
                  {{ previewTitle }}
                </span>
              </div>
            </div>
            <div class="space-y-1.5 p-3">
              <div class="bg-accented h-1.5 w-3/4 rounded-full" />
              <div class="bg-accented/70 h-1.5 w-1/2 rounded-full" />
              <div class="bg-accented/50 h-1.5 w-2/3 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-6">
      <div>
        <h3 class="text-highlighted text-sm font-semibold">Defaults</h3>
        <p class="text-muted mt-1 text-xs">
          Applied to public readers and new accounts.
        </p>
      </div>
      <div class="divide-default mt-4 divide-y">
        <USwitch
          v-model="workspaceForm.graphEnabledByDefault"
          label="Show graph by default"
          description="Readers can still open it manually when disabled."
          class="py-3 first:pt-0"
          :disabled="settingsPending || isSavingSettings"
        />
        <USwitch
          v-model="workspaceForm.registrationEnabled"
          label="Allow public registration"
          description="Let new users create an account from the register page."
          class="py-3 last:pb-0"
          :disabled="settingsPending || isSavingSettings"
        />
      </div>
    </section>

    <div
      class="border-default flex flex-wrap items-center justify-between gap-3 border-t py-4"
    >
      <p v-if="saveError" class="text-error text-xs" role="alert">
        {{ saveError }}
      </p>
      <p v-else class="text-dimmed text-xs">Changes apply after saving.</p>
      <UButton
        size="sm"
        :loading="isSavingSettings"
        :disabled="settingsPending || Boolean(settingsError)"
        @click="saveWorkspaceSettings"
      >
        Save changes
      </UButton>
    </div>
  </div>
</template>
