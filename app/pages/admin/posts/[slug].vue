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
import CodeBlockShiki from "tiptap-extension-code-block-shiki";

import type { PostGraph } from "#shared/types/graph";
import PostNavbarActions from "~/components/admin/PostNavbarActions.vue";
import ImageUpload from "~/components/editor/ImageUploadExtension";
import LinkPopover from "~/components/editor/LinkPopover.vue";
import TableOfContentsView from "~/components/editor/TableOfContents.vue";
import type { TocItem } from "~/components/editor/TableOfContents.vue";
import GraphView from "~/components/GraphView.vue";

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

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

const toast = useToast();
const { post, pending, savingStatus, performAutoSave, error } = usePostEditor();
const { $csrfFetch } = useNuxtApp();
const { copy, isSupported } = useClipboard();
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

const editorExtensions = [
  tocExtension,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  CodeBlockShiki.configure({
    defaultTheme: "github-dark",
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  }),
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

const onContentUpdate = (val: Content) => {
  if (post.value) {
    post.value.content = val as typeof post.value.content;
    performAutoSave();
  }
};
const inputColor = (event: Event) =>
  (event.currentTarget as HTMLInputElement).value;

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
          @select="navigateTo(`/admin/posts/${$event}`)"
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
            <template #link="{ item }">
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
                    <label class="text-muted text-xs" for="editor-text-color"
                      >Text color</label
                    >
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
                      >Highlight</label
                    >
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
      </div>
    </div>
  </div>
</template>
