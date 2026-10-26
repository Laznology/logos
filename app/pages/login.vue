<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SiteSettings } from "~~/shared/types/settings";

definePageMeta({
  middleware: "guest",
});

const route = useRoute();
const { signIn } = authClient;
const session = authClient.useSession();
const activeOrganization = authClient.useActiveOrganization();
const toast = useToast();
const isLoading = ref(false);

const { data: siteSettings } = await useFetch<SiteSettings>(
  "/api/public/settings",
  { key: "public-site-settings" }
);

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

async function onSubmit(event: FormSubmitEvent<SignInType>) {
  isLoading.value = true;
  const { identifier, password } = event.data;
  // ponytail: the username plugin adds its own endpoint, so pick based on shape.
  const { error } = identifier.includes("@")
    ? await signIn.email({ email: identifier, password })
    : await signIn.username({ username: identifier, password });
  isLoading.value = false;

  if (error) {
    toast.add({
      title: "Authentication Failed",
      description: error.message || "Invalid credentials",
      color: "error",
    });
    return;
  }

  await session.value.refetch();
  toast.add({
    title: "Welcome back!",
    description: "You have signed in successfully.",
    color: "success",
  });
  const redirect =
    typeof route.query.redirect === "string" ? route.query.redirect : "";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) {
    await navigateTo(redirect);
    return;
  }
  const workspaceSlug = activeOrganization.value.data?.slug;
  await navigateTo(workspaceSlug ? `/${workspaceSlug}` : "/");
}
</script>

<template>
  <div class="bg-elevated/50 flex min-h-screen items-center justify-center p-4">
    <UAuthForm
      title="Sign in to Logos"
      description="Enter your credentials or use a social provider to access your workspace."
      icon="i-lucide-lock"
      :fields="fields"
      :schema="signInSchema"
      :loading="isLoading"
      submit-button-label="Sign In"
      class="w-full max-w-md"
      @submit="onSubmit"
    >
      <template #footer>
        <p
          v-if="siteSettings?.registrationEnabled !== false"
          class="text-muted text-center text-xs"
        >
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
