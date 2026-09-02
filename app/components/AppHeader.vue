<template>
  <UHeader
    :toggle="false"
    :ui="{
      container: 'sm:px-14!',
      right: 'justify-end-safe overflow-x-auto py-2',
    }"
  >
    <template #left>
      <NuxtLink to="/" class="transition hover:opacity-80">
        <AppLogo />
      </NuxtLink>

      <TemplateMenu />
    </template>

    <template #right>
      <slot />

      <USeparator orientation="vertical" class="h-7" />

      <div role="group" class="flex items-center gap-0.5">
        <UColorModeButton size="sm" />

        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          size="sm"
          to="https://github.com/nuxt-ui-templates/editor"
          target="_blank"
        />
      </div>
    </template>
  </UHeader>
</template>
