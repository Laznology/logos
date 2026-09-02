<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{
  error: NuxtError;
}>();

const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const statusCode = computed(() => props.error?.statusCode || 500);

const errorTitle = computed(() => {
  if (statusCode.value === 404) {
    return "Page not found";
  }
  if (statusCode.value === 403) {
    return "Access forbidden";
  }
  return "Something went wrong";
});

const errorDescription = computed(() => {
  if (statusCode.value === 404) {
    return "The page or post you are looking for doesn't exist, was moved, or has been unpublished.";
  }
  if (statusCode.value === 403) {
    return "You don't have permission to view or edit this resource.";
  }
  return (
    props.error?.message ||
    "An unexpected error occurred while loading this page. Please try again later."
  );
});

const handleClearError = () => {
  clearError({ redirect: "/" });
};
</script>

<template>
  <UApp>
    <div
      class="bg-default text-default selection:bg-primary/20 flex min-h-screen flex-col font-sans"
    >
      <header
        class="border-default bg-default/80 sticky top-0 z-30 border-b backdrop-blur-md"
      >
        <div
          class="mx-auto flex h-14 max-w-4xl items-center justify-between px-6"
        >
          <NuxtLink to="/" class="transition hover:opacity-80">
            <AppLogo />
          </NuxtLink>

          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            :icon="
              colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
            "
            aria-label="Toggle theme"
            @click="toggleTheme"
          />
        </div>
      </header>

      <main
        class="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center"
      >
        <div class="mx-auto max-w-md space-y-6">
          <div
            class="border-default bg-elevated/60 mx-auto flex size-20 items-center justify-center rounded-2xl border shadow-sm"
          >
            <UIcon
              :name="
                statusCode === 404
                  ? 'i-lucide-compass'
                  : 'i-lucide-alert-triangle'
              "
              class="text-primary size-10"
            />
          </div>

          <div class="space-y-2">
            <span
              class="text-primary bg-primary/10 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase"
            >
              Error {{ statusCode }}
            </span>
            <h1
              class="text-highlighted pt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              {{ errorTitle }}
            </h1>
            <p class="text-muted text-sm leading-relaxed">
              {{ errorDescription }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
            <UButton
              color="primary"
              size="md"
              icon="i-lucide-house"
              label="Back to Home"
              @click="handleClearError"
            />
            <UButton
              variant="outline"
              color="neutral"
              size="md"
              icon="i-lucide-refresh-cw"
              label="Reload page"
              @click="() => reloadNuxtApp()"
            />
          </div>
        </div>
      </main>

      <footer
        class="border-default text-muted border-t py-6 text-center text-xs"
      >
        <span>Logos — Minimal Editorial Platform</span>
      </footer>
    </div>
  </UApp>
</template>
