<script setup lang="ts">
const props = defineProps<{
  post: PostSelectType;
  statusText: string;
}>();

const emit = defineEmits<{
  (e: "copyLink" | "copyContent" | "deletePost"): void;
  (e: "updatePost", updated: Partial<PostSelectType>): void;
}>();

const toast = useToast();
const { copy, isSupported } = useClipboard();
const { $csrfFetch } = useNuxtApp();
const isUpdatingPublish = ref(false);

const isPublished = computed(() => {
  const metadata = (props.post.metadata as Record<string, unknown>) || {};
  return metadata.status === "published";
});

const publicUrl = computed(() => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/posts/${props.post.slug}`;
  }
  return `/posts/${props.post.slug}`;
});

const copyPublicUrl = async () => {
  if (!isSupported.value) {
    return;
  }
  await copy(publicUrl.value);
  toast.add({
    title: "Web link copied to clipboard",
    icon: "i-lucide-check-circle",
    color: "success",
  });
};

const togglePublish = async (publish: boolean) => {
  if (!props.post.slug) {
    return;
  }
  isUpdatingPublish.value = true;
  try {
    const currentMeta = (props.post.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMeta,
      status: publish ? "published" : "draft",
      [publish ? "publishedAt" : "unpublishedAt"]: new Date().toISOString(),
    };

    const response = await $csrfFetch<{
      success: boolean;
      data: PostSelectType;
    }>(`/api/posts/${props.post.slug}`, {
      method: "PUT",
      body: {
        title: props.post.title,
        content: props.post.content,
        metadata: updatedMetadata,
      },
    });

    if (response.data) {
      emit("updatePost", response.data);
      toast.add({
        title: publish ? "Published to web!" : "Post unpublished",
        icon: publish ? "i-lucide-globe" : "i-lucide-lock",
        color: publish ? "success" : "neutral",
      });
    }
  } catch {
    toast.add({
      title: "Failed to update publish status",
      color: "error",
    });
  } finally {
    isUpdatingPublish.value = false;
  }
};

const dropdownItems = computed(() => [
  [
    {
      label: "Copy Link",
      icon: "i-lucide-link",
      onSelect: () => emit("copyLink"),
    },
    {
      label: "Copy Post Content",
      icon: "i-lucide-copy",
      onSelect: () => emit("copyContent"),
    },
  ],
  [
    {
      label: "Delete",
      icon: "i-lucide-trash-2",
      color: "error" as const,
      onSelect: () => emit("deletePost"),
    },
  ],
]);
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-muted mr-1 text-xs">{{ statusText }}</span>

    <UPopover>
      <UButton
        :icon="isPublished ? 'i-lucide-globe' : 'i-lucide-lock'"
        :variant="isPublished ? 'subtle' : 'outline'"
        :color="isPublished ? 'primary' : 'neutral'"
        size="sm"
        :label="isPublished ? 'Published' : 'Publish'"
      />

      <template #content>
        <div class="w-80 space-y-4 p-4 sm:w-96">
          <div class="space-y-1 text-center">
            <h4 class="text-highlighted text-sm font-semibold">
              Publish to web
            </h4>
            <p class="text-muted text-xs">
              Create a live public link for this post
            </p>
          </div>

          <div
            class="border-default bg-elevated space-y-3 rounded-lg border p-4 shadow-inner"
          >
            <div class="flex items-center justify-between text-xs opacity-60">
              <span class="max-w-[150px] truncate">{{
                post.title || "Untitled"
              }}</span>
              <div class="flex items-center gap-1">
                <span class="bg-muted size-1.5 rounded-full" />
                <span class="bg-muted size-1.5 rounded-full" />
                <span class="bg-muted size-1.5 rounded-full" />
              </div>
            </div>
            <div class="py-4 text-center">
              <h5 class="text-highlighted line-clamp-2 text-base font-bold">
                {{ post.title || "Untitled" }}
              </h5>
            </div>
          </div>

          <div v-if="!isPublished" class="space-y-3">
            <UButton
              block
              color="primary"
              size="md"
              label="Publish"
              :loading="isUpdatingPublish"
              @click="togglePublish(true)"
            />
            <div class="text-muted flex items-start gap-2 text-xs">
              <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
              <span>
                When published to web, anyone with the link can view this page's
                content.
              </span>
            </div>
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-center gap-1.5">
              <UInput
                readonly
                :model-value="publicUrl"
                size="sm"
                class="flex-1 text-xs"
              />
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-copy"
                @click="copyPublicUrl"
              />
            </div>

            <div class="flex items-center justify-between pt-1">
              <UButton
                size="xs"
                color="primary"
                variant="ghost"
                icon="i-lucide-external-link"
                label="View site"
                :to="publicUrl"
                target="_blank"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                label="Unpublish"
                :loading="isUpdatingPublish"
                @click="togglePublish(false)"
              />
            </div>
          </div>
        </div>
      </template>
    </UPopover>

    <UButton
      variant="ghost"
      color="neutral"
      icon="i-lucide-link"
      size="sm"
      aria-label="Copy Link"
      @click="emit('copyLink')"
    />

    <UDropdownMenu :items="dropdownItems">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-more-horizontal"
        aria-label="More actions"
      />
    </UDropdownMenu>
  </div>
</template>
