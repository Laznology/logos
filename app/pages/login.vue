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
    name: "identifier",
    type: "text",
    label: "Username or Email",
    placeholder: "Enter your username or email",
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

async function onSubmit(event: FormSubmitEvent<SignInType>) {
  isLoading.value = true;
  try {
    await $csrfFetch("/api/auth/sign-in", {
      method: "POST",
      body: event.data,
    });

    await refreshSession();

    toast.add({
      title: "Welcome back!",
      description: "You have signed in successfully.",
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
      title="Sign in to Logos"
      description="Enter your credentials or use a social provider to access your workspace."
      icon="i-lucide-lock"
      :fields="fields"
      :providers="providers"
      :schema="signInSchema"
      :loading="isLoading"
      submit-button-label="Sign In"
      class="w-full max-w-md"
      @submit="onSubmit"
    >
      <template #footer>
        <p class="text-muted text-center text-xs">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="text-primary font-medium hover:underline"
          >
            Sign Up
          </NuxtLink>
        </p>
      </template>
    </UAuthForm>
  </div>
</template>
