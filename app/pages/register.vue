<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { FetchError } from "ofetch";

definePageMeta({
  middleware: "guest",
});

const { $csrfFetch } = useNuxtApp();
const { fetch: refreshSession } = useUserSession();
const toast = useToast();
const isLoading = ref(false);

const fields = [
  {
    name: "name",
    type: "text",
    label: "Full Name",
    placeholder: "Name",
    required: true,
  },
  {
    name: "username",
    type: "text",
    label: "Username",
    placeholder: "username",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "Email",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "••••••••",
    required: true,
  },
];

const providers = [
  {
    label: "Continue with GitHub",
    icon: "i-simple-icons-github",
    color: "neutral" as const,
    to: "/auth/github",
  },
];

async function onSubmit(event: FormSubmitEvent<SignUpType>) {
  isLoading.value = true;
  try {
    await $csrfFetch("/api/auth/sign-up", {
      method: "POST",
      body: event.data,
    });
    await refreshSession();
    toast.add({
      title: "Account Created!",
      description: "Your account has been registered successfully.",
      color: "success",
    });
    await navigateTo("/");
  } catch (error) {
    if (error instanceof FetchError) {
      toast.add({
        title: "Authentication Failed",
        description: error.statusMessage || "An unexpected error occurred.",
        color: "error",
      });
    }
  } finally {
    isLoading.value = false;
  }
}
</script>
<template>
  <div class="bg-elevated/50 flex min-h-screen items-center justify-center p-4">
    <UAuthForm
      title="Create an Account"
      description="Enter your details below to get started with Logos."
      icon="i-lucide-user-plus"
      :fields="fields"
      :providers="providers"
      :schema="signUpSchema"
      :loading="isLoading"
      submit-button-label="Sign Up"
      class="w-full max-w-md"
      @submit="onSubmit"
    >
      <template #footer>
        <p class="text-muted text-center text-xs">
          Already have an account?
          <NuxtLink
            to="/login"
            class="text-primary font-medium hover:underline"
          >
            Sign In
          </NuxtLink>
        </p>
      </template>
    </UAuthForm>
  </div>
</template>
