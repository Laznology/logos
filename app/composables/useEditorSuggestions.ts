import type { EditorSuggestionMenuItem, EditorCustomHandlers } from "@nuxt/ui";

export function useEditorSuggestions<T extends EditorCustomHandlers>(
  _customHandlers?: T
) {
  const items = [
    [
      {
        label: "AI",
        type: "label",
      },
      {
        icon: "i-lucide-sparkles",
        kind: "aiContinue",
        label: "Continue writing",
      },
    ],
    [
      {
        label: "Style",
        type: "label",
      },
      {
        icon: "i-lucide-type",
        kind: "paragraph",
        label: "Paragraph",
      },
      {
        icon: "i-lucide-heading-1",
        kind: "heading",
        label: "Heading 1",
        level: 1,
      },
      {
        icon: "i-lucide-heading-2",
        kind: "heading",
        label: "Heading 2",
        level: 2,
      },
      {
        icon: "i-lucide-heading-3",
        kind: "heading",
        label: "Heading 3",
        level: 3,
      },
      {
        icon: "i-lucide-list",
        kind: "bulletList",
        label: "Bullet List",
      },
      {
        icon: "i-lucide-list-ordered",
        kind: "orderedList",
        label: "Numbered List",
      },
      {
        icon: "i-lucide-list-check",
        kind: "taskList",
        label: "Task List",
      },
      {
        icon: "i-lucide-text-quote",
        kind: "blockquote",
        label: "Blockquote",
      },
      {
        icon: "i-lucide-square-code",
        kind: "codeBlock",
        label: "Code Block",
      },
    ],
    [
      {
        label: "Insert",
        type: "label",
      },
      {
        icon: "i-lucide-at-sign",
        kind: "mention",
        label: "Mention",
      },
      {
        icon: "i-lucide-smile-plus",
        kind: "emoji",
        label: "Emoji",
      },
      {
        icon: "i-lucide-image",
        kind: "imageUpload",
        label: "Image",
      },
      {
        icon: "i-lucide-table",
        kind: "table",
        label: "Table",
      },
      {
        icon: "i-lucide-separator-horizontal",
        kind: "horizontalRule",
        label: "Horizontal Rule",
      },
    ],
  ] satisfies EditorSuggestionMenuItem<T>[][];

  return {
    items,
  };
}
