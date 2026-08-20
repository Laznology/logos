<script setup lang="ts">
import type { Content } from "@tiptap/core";
import { TableOfContents } from "@tiptap/extension-table-of-contents";

import PostNavbarActions from "~/components/admin/PostNavbarActions.vue";
import TableOfContentsView from "~/components/editor/TableOfContents.vue";
import type { TocItem } from "~/components/editor/TableOfContents.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const toast = useToast();
const { post, pending, savingStatus, performAutoSave, error } = usePostEditor();
const { $csrfFetch } = useNuxtApp();
const { copy, isSupported } = useClipboard();

const adminTocItems = ref<TocItem[]>([]);
const activeTocId = ref<string>("");

const tocExtension = TableOfContents.configure({
  onUpdate(content) {
    if (Array.isArray(content)) {
      adminTocItems.value = content
        .map(
          (item: {
            id?: string;
            textContent?: string;
            content?: string;
            level?: number;
            originalLevel?: number;
            isActive?: boolean;
          }) => ({
            id: String(item.id || ""),
            text: String(item.textContent || item.content || ""),
            level: Number(item.level || item.originalLevel || 1),
            isActive: Boolean(item.isActive),
          })
        )
        .filter((item) => item.text.trim().length > 0);
    }
  },
});

const editorExtensions = [tocExtension];

const handleTocSelect = (item: TocItem) => {
  activeTocId.value = item.id;
  const el = document.querySelector(
    `[data-toc-id="${item.id}"], [id="${item.id}"]`
  );
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const statusText = computed(() => {
  if (savingStatus.value === "saving") {
    return "Saving...";
  }
  if (savingStatus.value === "saved") {
    return "Saved";
  }
  if (savingStatus.value === "error") {
    return "Error saving";
  }
  return "Draft";
});

const onContentUpdate = (val: Content) => {
  if (post.value) {
    post.value.content = val as unknown as typeof post.value.content;
    performAutoSave();
  }
};

const copyLink = async () => {
  if (!isSupported.value) {
    return;
  }
  await copy(window.location.href);
  toast.add({
    title: "Link copied to clipboard",
    icon: "i-lucide-check-circle",
    color: "neutral",
  });
};

const copyContent = async () => {
  if (!isSupported.value || !post.value?.content) {
    return;
  }
  const contentVal = post.value.content;
  const contentStr =
    typeof contentVal === "string" ? contentVal : JSON.stringify(contentVal);
  await copy(contentStr);
  toast.add({
    title: "Content copied to clipboard",
    icon: "i-lucide-copy-check",
    color: "success",
  });
};

const deletePost = async () => {
  if (!post.value?.slug) {
    return;
  }
  try {
    await $csrfFetch(`/api/posts/${post.value.slug}`, {
      method: "DELETE",
    });
    toast.add({
      title: "Post deleted",
      color: "neutral",
      icon: "i-lucide-trash-2",
    });
    await navigateTo("/admin");
  } catch {
    toast.add({
      title: "Failed to delete",
      color: "error",
    });
  }
};
</script>

<template>
  <div class="bg-default relative flex h-full flex-col">
    <ClientOnly>
      <Teleport to="#navbar-actions">
        <PostNavbarActions
          v-if="post"
          :post="post"
          :status-text="statusText"
          @copy-link="copyLink"
          @copy-content="copyContent"
          @delete-post="deletePost"
          @update-post="(updated) => Object.assign(post, updated)"
        />
      </Teleport>
    </ClientOnly>

    <TableOfContentsView
      :items="adminTocItems"
      :active-id="activeTocId"
      @select="handleTocSelect"
    />

    <div class="flex-1 overflow-y-auto">
      <div v-if="pending" class="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <USkeleton class="bg-muted h-14 w-3/4 rounded-lg" />
        <USkeleton class="bg-muted h-96 w-full rounded-lg" />
      </div>

      <div
        v-else-if="error"
        class="mx-auto flex max-w-4xl flex-col items-center justify-center py-24 text-center"
      >
        <UEmpty
          icon="i-lucide-file-x"
          title="Post not found"
          description="The post you are trying to edit could not be found or you do not have permission."
        >
          <template #actions>
            <UButton
              to="/admin"
              icon="i-lucide-arrow-left"
              label="Back to Posts"
            />
          </template>
        </UEmpty>
      </div>

      <div v-else class="mx-auto max-w-4xl px-6 py-12">
        <input
          v-model="post.title"
          type="text"
          placeholder="Untitled"
          class="text-highlighted placeholder:text-muted/40 mb-6 w-full border-none bg-transparent text-4xl font-extrabold outline-none focus:ring-0 focus:outline-none sm:pl-8 sm:text-5xl"
          @input="performAutoSave"
        />

        <UEditor
          v-slot="{ editor }"
          :model-value="post.content as Content"
          content-type="markdown"
          :starter-kit="true"
          :extensions="editorExtensions"
          class="min-h-125"
          autofocus
          placeholder="Press '/' for commands..."
          @update:model-value="onContentUpdate"
        >
          <UEditorDragHandle :editor="editor" />
          <UEditorToolbar
            :editor="editor"
            layout="bubble"
            :items="editorToolbarItems"
          />
          <UEditorSuggestionMenu
            :editor="editor"
            :items="editorSuggestionItems"
          />
        </UEditor>
      </div>
    </div>
  </div>
</template>
