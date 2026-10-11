<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

import { updateProfileSchema } from "#shared/types/auth";

const { $csrfFetch } = useNuxtApp();

const { updateUser } = authClient;
const session = authClient.useSession();
const toast = useToast();
const fileInput = ref<HTMLInputElement>();

const user = computed(() => session.value.data?.user);
// better-auth exposes the avatar as `image`; `/images/` is the blob route.
const avatarUrl = computed(() =>
  user.value?.image ? `/images/${user.value.image}` : null
);

const nameForm = reactive({ name: "" });
watch(
  () => user.value?.name,
  (name) => {
    nameForm.name = name || "";
  },
  { immediate: true }
);

const emailForm = reactive({ email: "", currentPassword: "" });
watch(
  () => user.value?.email,
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
  const { error } = await updateUser({ name: nameForm.name });
  isSavingName.value = false;
  if (error) {
    toast.add({
      title: "Something went wrong",
      description: error.message,
      color: "error",
    });
    return;
  }
  await session.value.refetch();
  toast.add({ title: "Name updated", color: "success" });
}

async function onEmailSubmit(_: FormSubmitEvent<UpdateEmailType>) {
  isSavingEmail.value = true;
  const { error } = await authClient.changeEmail({
    newEmail: emailForm.email,
  });
  isSavingEmail.value = false;
  if (error) {
    toast.add({
      title: "Something went wrong",
      description: error.message,
      color: "error",
    });
    return;
  }
  emailForm.currentPassword = "";
  await session.value.refetch();
  toast.add({ title: "Email updated", color: "success" });
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
    await session.value.refetch();
    toast.add({ title: "Avatar updated", color: "success" });
  } catch {
    toast.add({ title: "Upload failed", color: "error" });
  } finally {
    isUploading.value = false;
    input.value = "";
  }
}

async function onRemoveAvatar() {
  isUploading.value = true;
  try {
    await $csrfFetch("/api/account/avatar", { method: "DELETE" });
    await session.value.refetch();
    toast.add({ title: "Avatar removed", color: "success" });
  } catch {
    toast.add({ title: "Could not remove avatar", color: "error" });
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
          :src="avatarUrl || undefined"
          :alt="user?.name"
          :icon="avatarUrl ? undefined : 'i-lucide-user'"
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
          v-if="avatarUrl"
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
      <UButton type="submit" size="sm" :loading="isSavingEmail">
        Save email
      </UButton>
    </UForm>
  </div>
</template>
