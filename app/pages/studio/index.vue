<script setup lang="ts">
definePageMeta({
  layout: "studio",
  middleware: "auth",
});

const {
  data: posts,
  error,
  pending,
  refresh,
} = await useFetch<PostSelectType[]>("/api/posts", {
  key: "studio-posts-list-page",
  default: () => [],
});
const MAX_RECENT_POSTS = 5;
const isCommandPaletteOpen = useState(
  "studio-command-palette-open",
  () => false
);
const recentPosts = computed(() =>
  (posts.value || []).slice(0, MAX_RECENT_POSTS)
);
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col p-6 md:p-8">
    <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
      <div v-if="pending" class="w-full space-y-3">
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="bg-muted h-14 w-full rounded-lg"
        />
      </div>

      <div
        v-else-if="!posts || posts.length === 0"
        class="flex min-h-full flex-1 flex-col items-center justify-center py-12"
      >
        <UEmpty
          icon="i-lucide-file-text"
          title="No posts found"
          description="Get started by creating your first post."
        >
          <template #actions>
            <UButton
              icon="i-lucide-plus"
              @click="navigateTo('/studio/posts/untitled')"
            >
              Create New
            </UButton>
            <UButton
              icon="i-lucide-refresh-cw"
              variant="subtle"
              color="neutral"
              :loading="pending"
              :disabled="pending"
              @click="refresh()"
            >
              Refresh
            </UButton>
          </template>
        </UEmpty>
      </div>

      <div v-else class="w-full space-y-6">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-muted text-sm">Your writing space</p>
            <h1 class="text-highlighted text-2xl font-bold tracking-tight">
              Recent posts
            </h1>
          </div>
          <UButton
            icon="i-lucide-plus"
            class="shrink-0"
            @click="navigateTo('/studio/posts/untitled')"
          >
            New post
          </UButton>
        </div>

        <UButton
          color="neutral"
          variant="outline"
          class="border-default/70 text-muted hover:text-highlighted flex w-full items-center justify-between rounded-xl px-4 py-3"
          @click="isCommandPaletteOpen = true"
        >
          <span class="flex items-center gap-2">
            <UIcon name="i-lucide-search" class="size-4" />
            <span>Search or jump to a post</span>
          </span>
          <span class="flex items-center gap-1">
            <UKbd value="meta" size="sm" />
            <UKbd value="K" size="sm" />
          </span>
        </UButton>

        <section aria-labelledby="recent-posts-heading">
          <h2 id="recent-posts-heading" class="sr-only">Recent posts</h2>
          <div
            class="border-default divide-default overflow-hidden rounded-xl border"
          >
            <NuxtLink
              v-for="post in recentPosts"
              :key="post.id"
              :to="`/studio/posts/${post.slug}`"
              class="group hover:bg-muted/40 flex items-center justify-between gap-4 px-4 py-3.5 transition"
            >
              <span class="min-w-0">
                <span
                  class="text-highlighted group-hover:text-primary block truncate font-semibold transition"
                >
                  {{ post.title || "Untitled" }}
                </span>
                <span class="text-muted block truncate text-xs">
                  /{{ post.slug }}
                </span>
              </span>
              <UIcon
                name="i-lucide-arrow-up-right"
                class="text-muted group-hover:text-primary size-4 shrink-0 transition"
              />
            </NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
