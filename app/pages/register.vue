<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SiteSettings } from "~~/shared/types/settings";

definePageMeta({
  middleware: "guest",
});

const { signUp } = authClient;
const session = authClient.useSession();
const toast = useToast();
const isLoading = ref(false);

const { data: siteSettings } = await useFetch<SiteSettings>(
  "/api/public/settings",
  { key: "public-site-settings" }
);

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

async function onSubmit(event: FormSubmitEvent<SignUpType>) {
  isLoading.value = true;
  const { error } = await signUp.email(event.data);
  isLoading.value = false;

  if (error) {
    toast.add({
      title: "Authentication Failed",
      description: error.message || "Could not create your account",
      color: "error",
    });
    return;
  }

  await session.value.refetch();
  toast.add({
    title: "Account Created!",
    description: "Your account has been registered successfully.",
    color: "success",
  });
  await navigateTo("/");
}
</script>

<template>
  <div class="bg-elevated/50 flex min-h-screen items-center justify-center p-4">
    <UAuthForm
      v-if="siteSettings?.registrationEnabled !== false"
      title="Create an Account"
      description="Enter your details below to get started with Logos."
      icon="i-lucide-user-plus"
      :fields="fields"
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

    <UEmpty
      v-else
      icon="i-lucide-user-round-x"
      title="Registration is disabled"
      description="New account registration is currently unavailable."
    >
      <template #actions>
        <UButton to="/login" icon="i-lucide-arrow-left">
          Back to sign in
        </UButton>
      </template>
    </UEmpty>
  </div>
</template>
