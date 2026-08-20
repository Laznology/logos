<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const {
  data: posts,
  error,
  pending,
  refresh,
} = await useFetch<PostSelectType[]>("/api/posts", {
  key: "admin-posts-list-page",
  default: () => [],
});
</script>

<template>
  <div class="flex h-full min-h-full flex-1 flex-col p-6 md:p-8">
    <div
      class="mx-auto flex h-full min-h-full w-full max-w-4xl flex-1 flex-col justify-center"
    >
      <div v-if="pending" class="w-full space-y-4">
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="bg-muted h-16 w-full rounded-lg"
        />
      </div>

      <div
        v-else-if="!posts || posts.length === 0"
        class="flex h-full min-h-full flex-1 flex-col items-center justify-center py-12"
      >
        <UEmpty
          icon="i-lucide-file-text"
          title="No posts found"
          description="Get started by creating your first post."
        >
          <template #actions>
            <UButton
              icon="i-lucide-plus"
              @click="navigateTo('/admin/posts/untitled')"
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

      <div v-else class="w-full space-y-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-highlighted text-xl font-bold">Posts</h2>
          <UButton
            icon="i-lucide-plus"
            @click="navigateTo('/admin/posts/untitled')"
          >
            Create New
          </UButton>
        </div>

        <UCard
          v-for="post in posts"
          :key="post.id"
          class="group hover:border-primary cursor-pointer transition"
          @click="navigateTo(`/admin/posts/${post.slug}`)"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3
                class="text-highlighted group-hover:text-primary font-semibold"
              >
                {{ post.title || "Untitled" }}
              </h3>
              <p class="text-muted text-xs">/{{ post.slug }}</p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="text-muted group-hover:text-highlighted size-5 transition"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
