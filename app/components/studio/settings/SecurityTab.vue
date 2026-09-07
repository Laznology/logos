<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { FetchError } from "ofetch";
import * as v from "valibot";

import { changePasswordSchema } from "#shared/types/auth";

const ConfirmSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.minLength(1, "Password is required")),
    newPassword: v.pipe(
      v.string(),
      v.minLength(8, "Minimum password length is 8 characters")
    ),
    confirmPassword: v.pipe(v.string(), v.minLength(1, "Confirm is required")),
  }),
  v.forward(
    v.partialCheck(
      [["newPassword"], ["confirmPassword"]],
      (input) => input.newPassword === input.confirmPassword,
      "Passwords do not match"
    ),
    ["confirmPassword"]
  )
);

type ConfirmType = v.InferInput<typeof ConfirmSchema>;

const { $csrfFetch } = useNuxtApp();
const toast = useToast();
const form = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const isSaving = ref(false);

async function onSubmit(_: FormSubmitEvent<ConfirmType>) {
  isSaving.value = true;
  try {
    await $csrfFetch("/api/account/password", {
      method: "PUT",
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      },
    });
    form.currentPassword = "";
    form.newPassword = "";
    form.confirmPassword = "";
    toast.add({
      title: "Password updated",
      description: "Other sessions have been signed out.",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Something went wrong",
      description:
        error instanceof FetchError ? error.statusMessage : "Unexpected error",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <UForm
    :schema="ConfirmSchema"
    :state="form"
    class="max-w-sm space-y-4"
    @submit="onSubmit"
  >
    <h3 class="text-highlighted text-sm font-semibold">Change password</h3>
    <UFormField label="Current password" name="currentPassword" required>
      <UInput v-model="form.currentPassword" type="password" class="w-full" />
    </UFormField>
    <UFormField label="New password" name="newPassword" required>
      <UInput v-model="form.newPassword" type="password" class="w-full" />
    </UFormField>
    <UFormField label="Confirm new password" name="confirmPassword" required>
      <UInput v-model="form.confirmPassword" type="password" class="w-full" />
    </UFormField>
    <UButton type="submit" size="sm" :loading="isSaving">
      Update password
    </UButton>
  </UForm>
</template>
