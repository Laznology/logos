<script setup lang="ts">
import type { Editor } from "@tiptap/core";

import {
  editorHighlightColorPresets,
  editorTextColorPresets,
} from "~/utils/editor";

type DrawerName = "format" | "color" | "insert" | "more" | null;

type BlockType =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "ordered-list"
  | "task-list"
  | "blockquote"
  | "code-block";

type ToolbarEvent =
  | "insertImage"
  | "insertTable"
  | "insertCarouselSeparator"
  | "toggleCarouselMode"
  | "exportCarousel";

type MarkName = "bold" | "italic" | "underline" | "strike" | "code";

const props = defineProps<{
  editor: Editor;
  isCarousel: boolean;
  isExporting: boolean;
}>();

const emit = defineEmits<{
  (event: ToolbarEvent): void;
  (event: "drawerChange", open: boolean): void;
}>();

const drawer = ref<DrawerName>(null);
const linkUrl = ref("");
const editorVersion = ref(0);

const drawerOpen = computed({
  get: () => drawer.value !== null,
  set: (open: boolean) => {
    if (!open) {
      drawer.value = null;
    }
  },
});

const drawerTitle = computed(() => {
  switch (drawer.value) {
    case "format": {
      return "Format text";
    }
    case "color": {
      return "Color";
    }
    case "insert": {
      return "Insert";
    }
    case "more": {
      return "More tools";
    }
    default: {
      return "Editor tools";
    }
  }
});

const refreshEditorState = () => {
  editorVersion.value += 1;
};

const setEditor = (editor: Editor | undefined) => {
  if (!editor) {
    return;
  }

  editor.on("selectionUpdate", refreshEditorState);
  editor.on("transaction", refreshEditorState);

  onBeforeUnmount(() => {
    editor.off("selectionUpdate", refreshEditorState);
    editor.off("transaction", refreshEditorState);
  });
};

watch(() => props.editor, setEditor, { immediate: true });
watch(
  drawer,
  (value) => {
    emit("drawerChange", value !== null);
  },
  { immediate: true }
);

const isActive = (name: string, attributes?: Record<string, unknown>) => {
  void editorVersion.value;
  return props.editor.isActive(name, attributes);
};

const run = (command: () => boolean, close = true) => {
  command();
  if (close) {
    drawer.value = null;
  }
};

const setBlockType = (type: BlockType) => {
  const editor = props.editor.chain().focus();
  switch (type) {
    case "heading-1": {
      run(() => editor.toggleHeading({ level: 1 }).run());
      break;
    }
    case "heading-2": {
      run(() => editor.toggleHeading({ level: 2 }).run());
      break;
    }
    case "heading-3": {
      run(() => editor.toggleHeading({ level: 3 }).run());
      break;
    }
    case "bullet-list": {
      run(() => editor.toggleBulletList().run());
      break;
    }
    case "ordered-list": {
      run(() => editor.toggleOrderedList().run());
      break;
    }
    case "task-list": {
      run(() => editor.toggleTaskList().run());
      break;
    }
    case "blockquote": {
      run(() => editor.toggleBlockquote().run());
      break;
    }
    case "code-block": {
      run(() => editor.toggleCodeBlock().run());
      break;
    }
    default: {
      run(() => editor.setParagraph().run());
    }
  }
};

const setMark = (mark: MarkName) => {
  const editor = props.editor.chain().focus();
  run(() => {
    switch (mark) {
      case "bold": {
        return editor.toggleBold().run();
      }
      case "italic": {
        return editor.toggleItalic().run();
      }
      case "underline": {
        return editor.toggleUnderline().run();
      }
      case "strike": {
        return editor.toggleStrike().run();
      }
      default: {
        return editor.toggleCode().run();
      }
    }
  });
};

const openColorDrawer = () => {
  drawer.value = "color";
};

const isTextColorActive = (color: string | null) => {
  void editorVersion.value;
  const current = props.editor.getAttributes("textStyle").color;
  return color ? current === color : !current;
};

const isHighlightColorActive = (color: string | null) => {
  void editorVersion.value;
  const current = props.editor.getAttributes("highlight").color;
  return color ? current === color : !current;
};

const applyTextColor = (color: string | null) => {
  if (color) {
    props.editor.chain().focus().setColor(color).run();
    return;
  }
  props.editor.chain().focus().unsetColor().run();
};

const applyHighlightColor = (color: string | null) => {
  if (color) {
    props.editor.chain().focus().toggleHighlight({ color }).run();
    return;
  }
  props.editor.chain().focus().unsetHighlight().run();
};

const openMoreDrawer = () => {
  linkUrl.value = props.editor.getAttributes("link").href || "";
  drawer.value = "more";
};

const applyLink = () => {
  const url = linkUrl.value.trim();
  run(() =>
    url
      ? props.editor.chain().focus().setLink({ href: url }).run()
      : props.editor.chain().focus().unsetLink().run()
  );
};

const insert = (
  event: "insertImage" | "insertTable" | "insertCarouselSeparator"
) => {
  emit(event);
  drawer.value = null;
};
</script>

<template>
  <div class="sm:hidden">
    <nav
      aria-label="Mobile editor tools"
      class="border-default bg-default/95 fixed inset-x-0 bottom-0 z-[110] border-t px-3 pt-1.5 shadow-[0_-8px_24px_rgb(0_0_0/0.08)] backdrop-blur-md"
      style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
    >
      <div class="mx-auto grid max-w-lg grid-cols-6 gap-1">
        <UButton
          class="min-h-11 min-w-11 flex-col gap-0.5 px-1"
          color="neutral"
          variant="ghost"
          icon="i-lucide-undo-2"
          label="Undo"
          :disabled="!props.editor.can().undo()"
          @click="props.editor.chain().focus().undo().run()"
        />
        <UButton
          class="min-h-11 min-w-11 flex-col gap-0.5 px-1"
          color="neutral"
          variant="ghost"
          icon="i-lucide-redo-2"
          label="Redo"
          :disabled="!props.editor.can().redo()"
          @click="props.editor.chain().focus().redo().run()"
        />
        <UButton
          class="min-h-11 min-w-11 flex-col gap-0.5 px-1"
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
          label="Insert"
          :active="drawer === 'insert'"
          active-variant="soft"
          @mousedown.prevent
          @click="drawer = 'insert'"
        />
        <UButton
          class="min-h-11 min-w-11 flex-col gap-0.5 px-1"
          color="neutral"
          variant="ghost"
          icon="i-lucide-type"
          label="Format"
          :active="drawer === 'format'"
          active-variant="soft"
          @mousedown.prevent
          @click="drawer = 'format'"
        />
        <UButton
          class="min-h-11 min-w-11 flex-col gap-0.5 px-1"
          color="neutral"
          variant="ghost"
          icon="i-lucide-palette"
          label="Color"
          :active="drawer === 'color'"
          active-variant="soft"
          @mousedown.prevent
          @click="openColorDrawer"
        />
        <UButton
          class="min-h-11 min-w-11 flex-col gap-0.5 px-1"
          color="neutral"
          variant="ghost"
          icon="i-lucide-ellipsis"
          label="More"
          :active="drawer === 'more'"
          active-variant="soft"
          @mousedown.prevent
          @click="openMoreDrawer"
        />
      </div>
    </nav>

    <UDrawer v-model:open="drawerOpen" :title="drawerTitle">
      <template #content>
        <div
          class="mx-auto max-h-[76dvh] w-full max-w-lg overflow-y-auto px-4 pt-3"
          style="padding-bottom: max(1.5rem, env(safe-area-inset-bottom))"
        >
          <div v-if="drawer === 'format'" class="space-y-5">
            <section aria-labelledby="mobile-marks-heading">
              <h3
                id="mobile-marks-heading"
                class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase"
              >
                Marks
              </h3>
              <div class="grid grid-cols-5 gap-2">
                <UButton
                  v-for="mark in [
                    { name: 'bold', label: 'Bold', icon: 'i-lucide-bold' },
                    {
                      name: 'italic',
                      label: 'Italic',
                      icon: 'i-lucide-italic',
                    },
                    {
                      name: 'underline',
                      label: 'Underline',
                      icon: 'i-lucide-underline',
                    },
                    {
                      name: 'strike',
                      label: 'Strike',
                      icon: 'i-lucide-strikethrough',
                    },
                    { name: 'code', label: 'Code', icon: 'i-lucide-code' },
                  ]"
                  :key="mark.name"
                  class="min-h-12 flex-col gap-1 px-1"
                  color="neutral"
                  variant="outline"
                  :icon="mark.icon"
                  :label="mark.label"
                  :active="isActive(mark.name)"
                  active-color="primary"
                  active-variant="soft"
                  @click="setMark(mark.name as MarkName)"
                />
              </div>
            </section>

            <section aria-labelledby="mobile-blocks-heading">
              <h3
                id="mobile-blocks-heading"
                class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase"
              >
                Block style
              </h3>
              <div class="grid grid-cols-2 gap-2">
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-type"
                  label="Paragraph"
                  :active="isActive('paragraph')"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('paragraph')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-heading-1"
                  label="Heading 1"
                  :active="isActive('heading', { level: 1 })"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('heading-1')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-heading-2"
                  label="Heading 2"
                  :active="isActive('heading', { level: 2 })"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('heading-2')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-heading-3"
                  label="Heading 3"
                  :active="isActive('heading', { level: 3 })"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('heading-3')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-list"
                  label="Bullet list"
                  :active="isActive('bulletList')"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('bullet-list')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-list-ordered"
                  label="Numbered list"
                  :active="isActive('orderedList')"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('ordered-list')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-list-check"
                  label="Task list"
                  :active="isActive('taskList')"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('task-list')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-text-quote"
                  label="Quote"
                  :active="isActive('blockquote')"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('blockquote')"
                />
                <UButton
                  class="min-h-11 justify-start"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-square-code"
                  label="Code block"
                  :active="isActive('codeBlock')"
                  active-color="primary"
                  active-variant="soft"
                  @click="setBlockType('code-block')"
                />
              </div>
            </section>
          </div>

          <div v-else-if="drawer === 'color'" class="space-y-5">
            <section aria-labelledby="mobile-text-color-heading">
              <h3
                id="mobile-text-color-heading"
                class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase"
              >
                Text color
              </h3>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="preset in editorTextColorPresets"
                  :key="preset.label"
                  type="button"
                  class="flex min-h-11 items-center gap-2 rounded-lg border px-2 text-left text-xs font-medium transition"
                  :class="
                    isTextColorActive(preset.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-default bg-default hover:bg-muted/60'
                  "
                  :aria-label="preset.label"
                  :aria-pressed="isTextColorActive(preset.value)"
                  @mousedown.prevent
                  @click="applyTextColor(preset.value)"
                >
                  <span
                    class="border-default bg-default flex size-5 shrink-0 items-center justify-center rounded-full border"
                    :style="
                      preset.value
                        ? { backgroundColor: preset.value }
                        : undefined
                    "
                  >
                    <UIcon
                      v-if="!preset.value"
                      name="i-lucide-ban"
                      class="text-muted size-3"
                    />
                  </span>
                  <span class="truncate">{{ preset.label }}</span>
                </button>
              </div>
            </section>

            <section aria-labelledby="mobile-highlight-color-heading">
              <h3
                id="mobile-highlight-color-heading"
                class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase"
              >
                Highlight
              </h3>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="preset in editorHighlightColorPresets"
                  :key="preset.label"
                  type="button"
                  class="flex min-h-11 items-center gap-2 rounded-lg border px-2 text-left text-xs font-medium transition"
                  :class="
                    isHighlightColorActive(preset.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-default bg-default hover:bg-muted/60'
                  "
                  :aria-label="preset.label"
                  :aria-pressed="isHighlightColorActive(preset.value)"
                  @mousedown.prevent
                  @click="applyHighlightColor(preset.value)"
                >
                  <span
                    class="border-default bg-default flex size-5 shrink-0 items-center justify-center rounded-full border"
                    :style="
                      preset.value
                        ? { backgroundColor: preset.value }
                        : undefined
                    "
                  >
                    <UIcon
                      v-if="!preset.value"
                      name="i-lucide-ban"
                      class="text-muted size-3"
                    />
                  </span>
                  <span class="truncate">{{ preset.label }}</span>
                </button>
              </div>
            </section>
          </div>

          <div v-else-if="drawer === 'insert'" class="grid grid-cols-2 gap-2">
            <UButton
              class="min-h-14 justify-start"
              color="neutral"
              variant="outline"
              icon="i-lucide-image"
              label="Image"
              @click="insert('insertImage')"
            />
            <UButton
              class="min-h-14 justify-start"
              color="neutral"
              variant="outline"
              icon="i-lucide-table-2"
              label="Table"
              @click="insert('insertTable')"
            />
            <UButton
              class="min-h-14 justify-start"
              color="neutral"
              variant="outline"
              icon="i-lucide-panels-top-left"
              label="Carousel slide"
              @click="insert('insertCarouselSeparator')"
            />
            <UButton
              class="min-h-14 justify-start"
              color="neutral"
              variant="outline"
              icon="i-lucide-at-sign"
              label="Mention"
              @click="
                drawer = null;
                props.editor.chain().focus().insertContent('@').run();
              "
            />
          </div>

          <div v-else-if="drawer === 'more'" class="space-y-4">
            <div class="space-y-2">
              <label
                for="mobile-link-url"
                class="text-muted text-xs font-semibold tracking-wide uppercase"
                >Link</label
              >
              <div class="flex gap-2">
                <UInput
                  id="mobile-link-url"
                  v-model="linkUrl"
                  class="min-w-0 flex-1"
                  placeholder="https://example.com"
                  type="url"
                  @keydown.enter.prevent="applyLink"
                />
                <UButton
                  class="min-h-11 min-w-11"
                  color="primary"
                  icon="i-lucide-check"
                  aria-label="Apply link"
                  :disabled="!linkUrl.trim() && !isActive('link')"
                  @click="applyLink"
                />
              </div>
              <UButton
                class="min-h-11 w-full justify-start"
                color="neutral"
                variant="ghost"
                icon="i-lucide-link-2-off"
                label="Remove link"
                :disabled="!isActive('link')"
                @click="
                  run(() => props.editor.chain().focus().unsetLink().run())
                "
              />
            </div>

            <USeparator />

            <div class="grid grid-cols-2 gap-2">
              <UButton
                class="min-h-12 justify-start"
                color="neutral"
                variant="outline"
                icon="i-lucide-panels-top-left"
                :label="
                  props.isCarousel ? 'Switch to article' : 'Carousel mode'
                "
                @click="
                  emit('toggleCarouselMode');
                  drawer = null;
                "
              />
              <UButton
                v-if="props.isCarousel"
                class="min-h-12 justify-start"
                color="primary"
                variant="soft"
                icon="i-lucide-download"
                label="Export carousel"
                :loading="props.isExporting"
                :disabled="props.isExporting"
                @click="
                  emit('exportCarousel');
                  drawer = null;
                "
              />
            </div>
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
