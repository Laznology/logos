<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { FetchError } from "ofetch";

import { updateEmailSchema, updateProfileSchema } from "#shared/types/auth";

const { $csrfFetch } = useNuxtApp();
const toast = useToast();
function showError(error: unknown) {
  toast.add({
    title: "Something went wrong",
    description:
      error instanceof FetchError ? error.statusMessage : "Unexpected error",
    color: "error",
  });
}
const fileInput = ref<HTMLInputElement>();

const { data: profile, refresh: refreshProfile } = useFetch<{
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    username: string;
    avatar: string | null;
    avatarUrl: string | null;
  };
}>("/api/account/profile", {
  key: "account-profile",
  lazy: true,
});

const nameForm = reactive({ name: "" });
watch(
  () => profile.value?.data.name,
  (name) => {
    nameForm.name = name || "";
  },
  { immediate: true }
);

const emailForm = reactive({ email: "", currentPassword: "" });
watch(
  () => profile.value?.data.email,
  (email) => {
    emailForm.email = email || "";
  },
  { immediate: true }
);

const isSavingName = ref(false);
const isSavingEmail = ref(false);
const isUploading = ref(false);

async function onNameSubmit(_: FormSubmitEvent<UpdateProfileType>) {
  isSavingName.value = true;
  try {
    await $csrfFetch("/api/account/profile", {
      method: "PUT",
      body: { name: nameForm.name },
    });
    await refreshProfile();
    toast.add({ title: "Name updated", color: "success" });
  } catch (error) {
    showError(error);
  } finally {
    isSavingName.value = false;
  }
}

async function onEmailSubmit(_: FormSubmitEvent<UpdateEmailType>) {
  isSavingEmail.value = true;
  try {
    await $csrfFetch("/api/account/email", {
      method: "PUT",
      body: emailForm,
    });
    emailForm.currentPassword = "";
    await refreshProfile();
    toast.add({ title: "Email updated", color: "success" });
  } catch (error) {
    showError(error);
  } finally {
    isSavingEmail.value = false;
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  isUploading.value = true;
  try {
    const body = new FormData();
    body.set("file", file);
    await $csrfFetch("/api/account/avatar", { method: "POST", body });
    await refreshProfile();
    toast.add({ title: "Avatar updated", color: "success" });
  } catch (error) {
    showError(error);
  } finally {
    isUploading.value = false;
    input.value = "";
  }
}

async function onRemoveAvatar() {
  isUploading.value = true;
  try {
    await $csrfFetch("/api/account/avatar", { method: "DELETE" });
    await refreshProfile();
    toast.add({ title: "Avatar removed", color: "success" });
  } catch (error) {
    showError(error);
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div class="space-y-8">
    <section class="space-y-3">
      <h3 class="text-highlighted text-sm font-semibold">Avatar</h3>
      <div class="flex items-center gap-4">
        <UAvatar
          :src="profile?.data.avatarUrl || undefined"
          :alt="profile?.data.name"
          :icon="profile?.data.avatarUrl ? undefined : 'i-lucide-user'"
          size="lg"
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          icon="i-lucide-upload"
          :loading="isUploading"
          @click="fileInput?.click()"
        >
          Upload
        </UButton>
        <UButton
          v-if="profile?.data.avatarUrl"
          size="sm"
          variant="ghost"
          color="error"
          :disabled="isUploading"
          @click="onRemoveAvatar"
        >
          Remove
        </UButton>
      </div>
    </section>

    <UForm
      :schema="updateProfileSchema"
      :state="nameForm"
      class="space-y-4"
      @submit="onNameSubmit"
    >
      <h3 class="text-highlighted text-sm font-semibold">Display name</h3>
      <UFormField label="Name" name="name" required>
        <UInput v-model="nameForm.name" class="w-full" />
      </UFormField>
      <UButton type="submit" size="sm" :loading="isSavingName">
        Save name
      </UButton>
    </UForm>

    <UForm
      :schema="updateEmailSchema"
      :state="emailForm"
      class="space-y-4"
      @submit="onEmailSubmit"
    >
      <h3 class="text-highlighted text-sm font-semibold">Email</h3>
      <UFormField label="Email" name="email" required>
        <UInput v-model="emailForm.email" type="email" class="w-full" />
      </UFormField>
      <UFormField label="Current password" name="currentPassword" required>
        <UInput
          v-model="emailForm.currentPassword"
          type="password"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" size="sm" :loading="isSavingEmail">
        Save email
      </UButton>
    </UForm>
  </div>
</template>
