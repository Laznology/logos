<script setup lang="ts">
import type { Content, Editor, JSONContent } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableOfContents } from "@tiptap/extension-table-of-contents";
import { TableRow } from "@tiptap/extension-table-row";
import { TextStyle } from "@tiptap/extension-text-style";
import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import type { CarouselFrame } from "#shared/types/carousel";
import { buildCarouselFrames } from "#shared/types/carousel";
import type { PostGraph } from "#shared/types/graph";
import CarouselSeparator from "~/components/editor/CarouselSeparatorExtension";
import CarouselTemplate from "~/components/editor/CarouselTemplate.vue";
import ImageUpload from "~/components/editor/ImageUploadExtension";
import LinkPopover from "~/components/editor/LinkPopover.vue";
import type { TocItem } from "~/components/editor/TableOfContents.vue";
import TableOfContentsView from "~/components/editor/TableOfContents.vue";
import GraphView from "~/components/GraphView.vue";
import PostNavbarActions from "~/components/studio/PostNavbarActions.vue";

type MarkdownEditor = Editor & {
  markdown?: {
    parse: (value: string) => JSONContent;
  };
};

const editorProps = {
  clipboardTextParser(
    text: string,
    _context: unknown,
    _plain: boolean,
    view: EditorView
  ) {
    const editor = (view.dom as HTMLElement & { editor?: MarkdownEditor })
      .editor;
    const markdown = editor?.markdown;
    if (!markdown) {
      return Slice.empty;
    }
    const node = view.state.schema.nodeFromJSON(markdown.parse(text));
    return new Slice(node.content, 0, 0);
  },
};

const toast = useToast();
const { post, pending, savingStatus, performAutoSave, error } = usePostEditor();
const { $csrfFetch } = useNuxtApp();
const { copy, isSupported } = useClipboard();
const isAddingTag = ref(false);
const newTagInput = ref("");
const tagInputRef = ref<HTMLInputElement | null>(null);
const editorRef = ref<{ editor?: MarkdownEditor } | null>(null);
const carouselRevision = ref(0);
const isExporting = ref(false);

const isCarousel = computed(() => {
  const metadata = (post.value?.metadata as Record<string, unknown>) || {};
  return metadata.editorMode === "carousel";
});

const carouselContent = computed<JSONContent>(() => {
  const metadata = (post.value?.metadata as Record<string, unknown>) || {};
  const stored = metadata.carouselDocument;
  if (
    stored &&
    typeof stored === "object" &&
    (stored as JSONContent).type === "doc"
  ) {
    return stored as JSONContent;
  }
  return { type: "doc", content: [] };
});

const carouselFrames = computed<CarouselFrame[]>(() => {
  void carouselRevision.value;
  return isCarousel.value
    ? buildCarouselFrames(post.value?.title || "", carouselContent.value)
    : [];
});
const editorValue = computed<Content>(() =>
  isCarousel.value ? carouselContent.value : (post.value.content as Content)
);

const currentTags = computed(() => {
  const meta = (post.value?.metadata as Record<string, unknown>) || {};
  return Array.isArray(meta.tags) ? (meta.tags as string[]) : [];
});

const startAddingTag = async () => {
  isAddingTag.value = true;
  await nextTick();
  tagInputRef.value?.focus();
};

const addTag = () => {
  const raw = newTagInput.value.trim().toLowerCase();
  if (!raw || !post.value) {
    isAddingTag.value = false;
    newTagInput.value = "";
    return;
  }
  const currentMeta = (post.value.metadata as Record<string, unknown>) || {};
  const tags = Array.isArray(currentMeta.tags)
    ? [...(currentMeta.tags as string[])]
    : [];

  if (!tags.includes(raw)) {
    tags.push(raw);
    post.value.metadata = { ...currentMeta, tags };
    performAutoSave();
  }

  // Keep input open and empty for continuous multi-tag additions
  newTagInput.value = "";
  tagInputRef.value?.focus();
};

const removeTag = (tagToRemove: string) => {
  if (!post.value) {
    return;
  }
  const currentMeta = (post.value.metadata as Record<string, unknown>) || {};
  const tags = (
    Array.isArray(currentMeta.tags) ? (currentMeta.tags as string[]) : []
  ).filter((t) => t !== tagToRemove);
  post.value.metadata = { ...currentMeta, tags };
  performAutoSave();
};

const onTagInputBlur = () => {
  if (newTagInput.value.trim()) {
    addTag();
  }
  isAddingTag.value = false;
};
const graphOpen = ref(false);
const graphResponse = await useFetch<{ success: boolean; data: PostGraph }>(
  "/api/graph",
  {
    key: "admin-post-graph",
  }
);
const graph = computed(() => graphResponse.data.value?.data);

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

const shikiModule = import.meta.client
  ? await import("tiptap-extension-code-block-shiki")
  : undefined;
const codeBlockShiki = shikiModule?.default.configure({
  defaultTheme: "github-dark",
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
});

const editorExtensions = [
  tocExtension,
  CarouselSeparator,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  ...(codeBlockShiki ? [codeBlockShiki] : []),
  ImageUpload,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

const customEditorHandlers = {
  table: {
    canExecute: () => true,
    execute: (ed: Editor) =>
      ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    isActive: () => false,
    isDisabled: () => false,
  },
  image: {
    canExecute: () => true,
    execute: (ed: Editor) => ed.chain().focus().insertImageUpload(),
    isActive: () => false,
    isDisabled: () => false,
  },
  carouselSeparator: {
    canExecute: (ed: Editor) => ed.can().insertCarouselSeparator(),
    execute: (ed: Editor) => ed.chain().focus().insertCarouselSeparator(),
    isActive: (ed: Editor) => ed.isActive("carouselSeparator"),
    isDisabled: () => false,
  },
};

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
const updateCarouselDocument = () => {
  const document = editorRef.value?.editor?.getJSON();
  if (!document || !post.value) {
    return;
  }
  const metadata = (post.value.metadata as Record<string, unknown>) || {};
  post.value.metadata = { ...metadata, carouselDocument: document };
  carouselRevision.value += 1;
};

const toggleCarouselMode = () => {
  if (!post.value) {
    return;
  }
  if (!isCarousel.value) {
    updateCarouselDocument();
  }
  const metadata = (post.value.metadata as Record<string, unknown>) || {};
  post.value.metadata = {
    ...metadata,
    editorMode: isCarousel.value ? "article" : "carousel",
  };
  performAutoSave();
};

const exportCarousel = async () => {
  if (!post.value?.slug || !isCarousel.value || isExporting.value) {
    return;
  }
  isExporting.value = true;
  try {
    updateCarouselDocument();
    post.value.content = carouselContent.value || {
      type: "doc",
      content: [],
    };
    await performAutoSave.flush();
    if (!post.value.id || post.value.slug === "untitled") {
      await performAutoSave();
    }
    const response = await window.fetch(
      `/api/studio/posts/${post.value.slug}/carousel-export`
    );
    if (!response.ok) {
      const errText = await response.text();
      console.error("Carousel export failed:", response.status, errText);
      throw new Error(`Carousel export failed: ${response.status} ${errText}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${post.value.slug}-carousel.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: "Carousel exported",
      icon: "i-lucide-download",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Failed to export carousel",
      color: "error",
    });
  } finally {
    isExporting.value = false;
  }
};

const onContentUpdate = (val: Content) => {
  if (!post.value) {
    return;
  }
  if (isCarousel.value) {
    updateCarouselDocument();
    post.value.content = carouselContent.value || {
      type: "doc",
      content: [],
    };
  } else {
    post.value.content = val;
  }
  performAutoSave();
};
const inputColor = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  return target?.value ?? "";
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
    await navigateTo("/studio");
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
        <div class="flex items-center gap-2">
          <UButton
            :label="isCarousel ? 'Article' : 'Carousel'"
            :icon="
              isCarousel ? 'i-lucide-file-text' : 'i-lucide-panels-top-left'
            "
            color="neutral"
            variant="outline"
            size="sm"
            @click="toggleCarouselMode"
          />
          <UButton
            v-if="isCarousel"
            label="Export Carousel"
            icon="i-lucide-download"
            color="primary"
            size="sm"
            :loading="isExporting"
            :disabled="isExporting"
            @click="exportCarousel"
          />
          <PostNavbarActions
            v-if="post"
            :post="post"
            :status-text="statusText"
            @copy-link="copyLink"
            @copy-content="copyContent"
            @delete-post="deletePost"
            @update-post="(updated) => Object.assign(post, updated)"
          />
          <UButton
            :label="isCarousel ? 'Article' : 'Carousel'"
            :icon="
              isCarousel ? 'i-lucide-file-text' : 'i-lucide-panels-top-left'
            "
            color="neutral"
            variant="outline"
            size="sm"
            @click="toggleCarouselMode"
          />
          <UButton
            v-if="isCarousel"
            label="Export Carousel"
            icon="i-lucide-download"
            color="primary"
            size="sm"
            :loading="isExporting"
            :disabled="isExporting"
            @click="exportCarousel"
          />
          <PostNavbarActions
            v-if="post"
            :post="post"
            :status-text="statusText"
            @copy-link="copyLink"
            @copy-content="copyContent"
            @delete-post="deletePost"
            @update-post="(updated) => Object.assign(post, updated)"
          />
        </div>
      </Teleport>
    </ClientOnly>
    <Teleport to="body">
      <UButton
        class="!fixed right-6 bottom-6 z-[100] shadow-lg"
        icon="i-lucide-share-2"
        label="Graph"
        color="primary"
        @click="graphOpen = true"
      />
    </Teleport>

    <UModal
      v-model:open="graphOpen"
      title="Post graph"
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <GraphView
          v-if="graph"
          :graph="graph"
          :active-slug="post?.slug"
          @select="navigateTo(`/studio/posts/${$event}`)"
        />
      </template>
    </UModal>

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
              to="/studio"
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
          aria-label="Post title"
          placeholder="Untitled"
          class="text-highlighted placeholder:text-muted/40 mb-3 w-full border-none bg-transparent text-4xl font-extrabold outline-none focus:ring-0 focus:outline-none sm:pl-8 sm:text-5xl"
          @input="performAutoSave"
        />

        <!-- Tags below title -->
        <div class="mb-8 flex flex-wrap items-center gap-2 sm:pl-8">
          <span
            v-for="tag in currentTags"
            :key="tag"
            class="border-default bg-elevated/60 text-muted hover:text-highlighted group inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition"
          >
            <span class="text-primary/70 font-semibold">#</span>{{ tag }}
            <button
              type="button"
              class="text-muted/60 hover:text-error ml-0.5 inline-flex cursor-pointer items-center transition"
              aria-label="Remove tag"
              @click="removeTag(tag)"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </span>

          <div
            v-if="isAddingTag"
            class="border-default bg-elevated/80 inline-flex items-center rounded-full border px-2 py-0.5"
          >
            <span class="text-primary/70 text-xs font-semibold">#</span>
            <input
              ref="tagInputRef"
              v-model="newTagInput"
              type="text"
              placeholder="tag-name"
              class="text-highlighted placeholder:text-muted/40 h-5 w-24 border-none bg-transparent px-1 text-xs outline-none focus:ring-0 focus:outline-none"
              @keydown.enter.prevent="addTag"
              @keydown.esc="isAddingTag = false"
              @blur="onTagInputBlur"
            />
          </div>

          <button
            v-else
            type="button"
            class="border-default/60 hover:border-primary/50 text-muted hover:text-highlighted inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium transition"
            @click="startAddingTag"
          >
            <UIcon name="i-lucide-plus" class="size-3" />
            <span>Add tag</span>
          </button>
        </div>

        <UEditor
          ref="editorRef"
          v-slot="{ editor }"
          :model-value="editorValue"
          :content-type="isCarousel ? 'json' : 'markdown'"
          :starter-kit="{ codeBlock: false }"
          :extensions="editorExtensions"
          :handlers="customEditorHandlers"
          :editor-props="editorProps"
          @update:model-value="onContentUpdate"
        >
          <UEditorDragHandle :editor="editor" />
          <UEditorToolbar
            :editor="editor"
            layout="bubble"
            :items="editorToolbarItems"
          >
            <template #link>
              <LinkPopover :editor="editor" />
            </template>
            <template #color>
              <UPopover :ui="{ content: 'p-2' }">
                <UTooltip text="Text color">
                  <UButton
                    icon="i-lucide-palette"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Text color"
                  />
                </UTooltip>
                <template #content>
                  <div class="flex items-center gap-2">
                    <label class="text-muted text-xs" for="editor-text-color">
                      Text color
                    </label>
                    <input
                      id="editor-text-color"
                      type="color"
                      class="size-7 cursor-pointer rounded-md border-0 p-0"
                      @input="
                        editor
                          .chain()
                          .focus()
                          .setColor(inputColor($event))
                          .run()
                      "
                    />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      aria-label="Reset text color"
                      @click="editor.chain().focus().unsetColor().run()"
                    />
                    " />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      aria-label="Reset text color"
                      @click="editor.chain().focus().unsetColor().run()"
                    />
                  </div>
                </template>
              </UPopover>
            </template>
            <template #highlight>
              <UPopover :ui="{ content: 'p-2' }">
                <UTooltip text="Highlight color">
                  <UButton
                    icon="i-lucide-highlighter"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Highlight color"
                  />
                </UTooltip>
                <template #content>
                  <div class="flex items-center gap-2">
                    <label
                      class="text-muted text-xs"
                      for="editor-highlight-color"
                    >
                      Highlight
                    </label>
                    <input
                      id="editor-highlight-color"
                      type="color"
                      class="size-7 cursor-pointer rounded-md border-0 p-0"
                      @input="
                        editor
                          .chain()
                          .focus()
                          .toggleHighlight({ color: inputColor($event) })
                          .run()
                      "
                    />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      aria-label="Reset highlight"
                      @click="editor.chain().focus().unsetHighlight().run()"
                    />
                    " />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      aria-label="Reset highlight"
                      @click="editor.chain().focus().unsetHighlight().run()"
                    />
                  </div>
                </template>
              </UPopover>
            </template>
          </UEditorToolbar>
          <UEditorSuggestionMenu
            :editor="editor"
            :items="editorSuggestionItems"
          />
        </UEditor>
        <div v-if="isCarousel && carouselFrames.length" class="mt-10 space-y-6">
          <div class="text-muted text-sm font-medium">Carousel preview</div>
          <CarouselTemplate
            v-for="frame in carouselFrames"
            :key="frame.kind === 'cover' ? 'cover' : `slide-${frame.index}`"
            :frame="frame"
            editable
          />
        </div>
      </div>
    </div>
  </div>
</template>
