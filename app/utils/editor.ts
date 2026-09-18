import type { EditorSuggestionMenuItem, EditorToolbarItem } from "@nuxt/ui";
import type { JSONContent } from "@tiptap/core";

export const editorToolbarItems: EditorToolbarItem[][] = [
  [
    {
      icon: "i-lucide-heading",
      tooltip: { text: "Headings" },
      content: {
        align: "start",
      },
      items: [
        {
          kind: "heading",
          level: 1,
          icon: "i-lucide-heading-1",
          label: "Heading 1",
        },
        {
          kind: "heading",
          level: 2,
          icon: "i-lucide-heading-2",
          label: "Heading 2",
        },
        {
          kind: "heading",
          level: 3,
          icon: "i-lucide-heading-3",
          label: "Heading 3",
        },
        {
          kind: "heading",
          level: 4,
          icon: "i-lucide-heading-4",
          label: "Heading 4",
        },
      ],
    },
  ],
  [
    {
      kind: "mark",
      mark: "bold",
      icon: "i-lucide-bold",
      tooltip: { text: "Bold" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-lucide-italic",
      tooltip: { text: "Italic" },
    },
    {
      kind: "mark",
      mark: "underline",
      icon: "i-lucide-underline",
      tooltip: { text: "Underline" },
    },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-lucide-strikethrough",
      tooltip: { text: "Strikethrough" },
    },
    {
      kind: "mark",
      mark: "code",
      icon: "i-lucide-code",
      tooltip: { text: "Code" },
    },
  ],
  [
    { slot: "color", tooltip: { text: "Text Color" } },
    { slot: "highlight", tooltip: { text: "Background Color" } },
    { slot: "link", tooltip: { text: "Link" } },
  ],
];

export const editorTextColorPresets = [
  { label: "Default", value: null },
  { label: "Gray", value: "#5f5e5b" },
  { label: "Red", value: "#c43d36" },
  { label: "Orange", value: "#b8610a" },
  { label: "Yellow", value: "#8f6b00" },
  { label: "Green", value: "#0b6e4f" },
  { label: "Blue", value: "#0b5cad" },
  { label: "Purple", value: "#6940a5" },
  { label: "Pink", value: "#a61e4d" },
] as const;

export const editorHighlightColorPresets = [
  { label: "None", value: null },
  { label: "Gray", value: "#e5e7eb" },
  { label: "Red", value: "#fecaca" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#ddd6fe" },
  { label: "Pink", value: "#fbcfe8" },
] as const;

export const editorSuggestionItems: EditorSuggestionMenuItem[][] = [
  [
    {
      type: "label",
      label: "Text",
    },
    {
      kind: "paragraph",
      label: "Paragraph",
      icon: "i-lucide-type",
    },
    {
      kind: "heading",
      level: 1,
      label: "Heading 1",
      icon: "i-lucide-heading-1",
    },
    {
      kind: "heading",
      level: 2,
      label: "Heading 2",
      icon: "i-lucide-heading-2",
    },
    {
      kind: "heading",
      level: 3,
      label: "Heading 3",
      icon: "i-lucide-heading-3",
    },
  ],
  [
    {
      type: "label",
      label: "Lists",
    },
    {
      kind: "bulletList",
      label: "Bullet List",
      icon: "i-lucide-list",
    },
    {
      kind: "orderedList",
      label: "Numbered List",
      icon: "i-lucide-list-ordered",
    },
  ],
  [
    {
      type: "label",
      label: "Insert",
    },
    {
      kind: "blockquote",
      label: "Blockquote",
      icon: "i-lucide-text-quote",
    },
    {
      kind: "codeBlock",
      label: "Code Block",
      icon: "i-lucide-square-code",
    },
    {
      kind: "image",
      label: "Image",
      icon: "i-lucide-image",
    },
    {
      kind: "carouselSeparator",
      label: "Slide",
      icon: "i-lucide-panel-top",
    },
    {
      kind: "table",
      label: "Table",
      icon: "i-lucide-table",
    },
  ],
];

interface MarkdownPasteEditor {
  markdown?: {
    parse: (value: string) => JSONContent;
  };
  commands: {
    insertContent: (content: JSONContent) => unknown;
  };
}

export const handleMarkdownPaste = (
  editor: MarkdownPasteEditor | undefined,
  text: string | undefined
): boolean => {
  if (!text || !editor?.markdown) {
    return false;
  }
  editor.commands.insertContent(editor.markdown.parse(text));
  return true;
};
