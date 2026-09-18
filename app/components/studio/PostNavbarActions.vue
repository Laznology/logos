<script setup lang="ts">
import type { PostStatus } from "~~/shared/types/post-status";

const props = defineProps<{
  post: PostSelectType;
  statusText: string;
  savePost: (metadata: PostSelectType["metadata"]) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "copyLink" | "copyContent" | "deletePost"): void;
}>();

const toast = useToast();
const { copy, isSupported } = useClipboard();
const isUpdatingPublish = ref(false);
const tagsInput = ref("");

watch(
  () => props.post.metadata,
  (meta) => {
    const record = (meta as Record<string, unknown>) || {};
    tagsInput.value = Array.isArray(record.tags)
      ? (record.tags as string[]).join(", ")
      : "";
  },
  { immediate: true }
);

const saveTags = async () => {
  if (!props.post.slug) {
    return;
  }
  try {
    const currentMeta = (props.post.metadata as Record<string, unknown>) || {};
    const tags = tagsInput.value
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const updatedMetadata = { ...currentMeta, tags };

    await props.savePost(updatedMetadata);
  } catch {
    toast.add({
      title: "Failed to update tags",
      color: "error",
    });
  }
};
const currentStatus = computed<PostStatus>(() => {
  const metadata = (props.post.metadata as Record<string, unknown>) || {};
  const status = metadata.status;
  return status === "published" || status === "private" || status === "archive"
    ? status
    : "draft";
});
const isPublished = computed(() => currentStatus.value === "published");

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

const updateStatus = async (status: PostStatus) => {
  if (!props.post.slug || status === currentStatus.value) {
    return;
  }
  isUpdatingPublish.value = true;
  try {
    const currentMeta = (props.post.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMeta,
      status,
      ...(status === "published"
        ? { publishedAt: new Date().toISOString() }
        : {}),
    };

    await props.savePost(updatedMetadata);
    toast.add({
      title:
        status === "published" ? "Published to web!" : `Moved to ${status}`,
      icon: status === "published" ? "i-lucide-globe" : "i-lucide-check",
      color: status === "published" ? "success" : "neutral",
    });
  } catch {
    toast.add({
      title: "Failed to update post status",
      color: "error",
    });
  } finally {
    isUpdatingPublish.value = false;
  }
};

const togglePublish = () =>
  updateStatus(isPublished.value ? "draft" : "published");

const dropdownItems = computed(() => [
  [
    {
      label: isPublished.value ? "Unpublish" : "Publish",
      icon: isPublished.value ? "i-lucide-lock" : "i-lucide-globe",
      onSelect: () => togglePublish(),
    },
    {
      label: "Private",
      icon: "i-lucide-lock-keyhole",
      onSelect: () => updateStatus("private"),
    },
    {
      label: "Archive",
      icon: "i-lucide-archive",
      onSelect: () => updateStatus("archive"),
    },
  ],
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
  <div class="flex shrink-0 items-center gap-2">
    <div class="hidden items-center gap-2 sm:flex">
      <span class="text-muted mr-1 text-xs">{{ statusText }}</span>

      <UPopover
        :content="{ onOpenAutoFocus: (event) => event.preventDefault() }"
      >
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
              class="border-default bg-elevated flex h-32 flex-col items-center justify-center overflow-hidden rounded-lg border p-4 text-center shadow-inner"
            >
              <UIcon
                name="i-lucide-file-text"
                class="text-muted mb-2 size-8 opacity-50"
              />
              <span class="text-highlighted line-clamp-2 text-sm font-semibold">
                {{ post.title || "Untitled" }}
              </span>
              <span class="text-muted mt-1 text-xs">/{{ post.slug }}</span>
            </div>

            <div class="space-y-1.5 text-left">
              <label class="text-highlighted text-xs font-medium"
                >Tags (comma-separated)</label
              >
              <UInput
                v-model="tagsInput"
                placeholder="essay, tech, design"
                size="sm"
                class="text-xs"
                @blur="saveTags"
                @keydown.enter.prevent="saveTags"
              />
            </div>
            <div v-if="!isPublished" class="space-y-3">
              <UButton
                block
                color="primary"
                size="md"
                label="Publish"
                :loading="isUpdatingPublish"
                @click="updateStatus('published')"
              />
              <div class="text-muted flex items-start gap-2 text-xs">
                <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
                <span>
                  When published to web, anyone with the link can view this
                  page's content.
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
                  @click="updateStatus('draft')"
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
    </div>
    <UDropdownMenu :items="dropdownItems">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-ellipsis"
        aria-label="More actions"
      />
    </UDropdownMenu>
  </div>
</template>
