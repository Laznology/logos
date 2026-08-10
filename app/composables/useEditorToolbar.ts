import type { EditorToolbarItem, EditorCustomHandlers } from "@nuxt/ui";
import type { Editor } from "@tiptap/vue-3";

interface UseEditorToolbarOptions {
  aiLoading?: Ref<boolean | undefined>;
}

export function useEditorToolbar<T extends EditorCustomHandlers>(
  _customHandlers?: T,
  options: UseEditorToolbarOptions = {}
) {
  const { aiLoading } = options;

  const toolbarItems: EditorToolbarItem<T>[][] = [
    [
      {
        icon: "i-lucide-undo",
        kind: "undo",
        tooltip: { text: "Undo" },
      },
      {
        icon: "i-lucide-redo",
        kind: "redo",
        tooltip: { text: "Redo" },
      },
    ],
    [
      {
        icon: "i-lucide-image",
        kind: "imageUpload",
        label: "Add",
        tooltip: { text: "Add image" },
      },
    ],
  ];

  const bubbleToolbarItems = computed(
    () =>
      [
        [
          {
            activeColor: "neutral",
            activeVariant: "ghost",
            content: {
              align: "start",
            },
            icon: "i-lucide-sparkles",
            items: [
              {
                icon: "i-lucide-spell-check",
                kind: "aiFix",
                label: "Fix spelling & grammar",
              },
              {
                icon: "i-lucide-unfold-vertical",
                kind: "aiExtend",
                label: "Extend text",
              },
              {
                icon: "i-lucide-fold-vertical",
                kind: "aiReduce",
                label: "Reduce text",
              },
              {
                icon: "i-lucide-lightbulb",
                kind: "aiSimplify",
                label: "Simplify text",
              },
              {
                icon: "i-lucide-text",
                kind: "aiContinue",
                label: "Continue sentence",
              },
              {
                icon: "i-lucide-list",
                kind: "aiSummarize",
                label: "Summarize",
              },
              {
                children: [
                  {
                    kind: "aiTranslate",
                    language: "English",
                    label: "English",
                  },
                  {
                    kind: "aiTranslate",
                    language: "French",
                    label: "French",
                  },
                  {
                    kind: "aiTranslate",
                    language: "Spanish",
                    label: "Spanish",
                  },
                  {
                    kind: "aiTranslate",
                    language: "German",
                    label: "German",
                  },
                ],
                icon: "i-lucide-languages",
                label: "Translate",
              },
            ],
            label: "Improve",
            loading: aiLoading?.value,
          },
        ],
        [
          {
            activeColor: "neutral",
            activeVariant: "ghost",
            content: {
              align: "start",
            },
            items: [
              {
                label: "Turn into",
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
                icon: "i-lucide-heading-4",
                kind: "heading",
                label: "Heading 4",
                level: 4,
              },
              {
                icon: "i-lucide-list",
                kind: "bulletList",
                label: "Bullet List",
              },
              {
                icon: "i-lucide-list-ordered",
                kind: "orderedList",
                label: "Ordered List",
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
            label: "Turn into",
            tooltip: { text: "Turn into" },
            trailingIcon: "i-lucide-chevron-down",
            ui: {
              label: "text-xs",
            },
          },
        ],
        [
          {
            icon: "i-lucide-bold",
            kind: "mark",
            mark: "bold",
            tooltip: { text: "Bold" },
          },
          {
            icon: "i-lucide-italic",
            kind: "mark",
            mark: "italic",
            tooltip: { text: "Italic" },
          },
          {
            icon: "i-lucide-underline",
            kind: "mark",
            mark: "underline",
            tooltip: { text: "Underline" },
          },
          {
            icon: "i-lucide-strikethrough",
            kind: "mark",
            mark: "strike",
            tooltip: { text: "Strikethrough" },
          },
          {
            icon: "i-lucide-code",
            kind: "mark",
            mark: "code",
            tooltip: { text: "Code" },
          },
        ],
        [
          {
            icon: "i-lucide-link",
            slot: "link" as const,
          },
          {
            icon: "i-lucide-image",
            kind: "imageUpload",
            tooltip: { text: "Image" },
          },
        ],
      ] satisfies EditorToolbarItem<T>[][]
  );

  const getImageToolbarItems = (editor: Editor): EditorToolbarItem<T>[][] => {
    const node = editor.state.doc.nodeAt(editor.state.selection.from);

    return [
      [
        {
          download: true,
          icon: "i-lucide-download",
          to: node?.attrs?.src,
          tooltip: { text: "Download" },
        },
        {
          icon: "i-lucide-refresh-cw",
          onClick: () => {
            const { state } = editor;
            const { selection } = state;

            const pos = selection.from;
            const node = state.doc.nodeAt(pos);

            if (node && node.type.name === "image") {
              editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .insertContentAt(pos, { type: "imageUpload" })
                .run();
            }
          },
          tooltip: { text: "Replace" },
        },
      ],
      [
        {
          icon: "i-lucide-trash",
          onClick: () => {
            const { state } = editor;
            const { selection } = state;

            const pos = selection.from;
            const node = state.doc.nodeAt(pos);

            if (node && node.type.name === "image") {
              editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .run();
            }
          },
          tooltip: { text: "Delete" },
        },
      ],
    ];
  };

  const getTableToolbarItems = (editor: Editor): EditorToolbarItem<T>[][] => [
    [
      {
        icon: "i-lucide-between-vertical-start",
        onClick: () => {
          editor.chain().focus().addRowBefore().run();
        },
        tooltip: { text: "Add row above" },
      },
      {
        icon: "i-lucide-between-vertical-end",
        onClick: () => {
          editor.chain().focus().addRowAfter().run();
        },
        tooltip: { text: "Add row below" },
      },
      {
        icon: "i-lucide-between-horizontal-start",
        onClick: () => {
          editor.chain().focus().addColumnBefore().run();
        },
        tooltip: { text: "Add column before" },
      },
      {
        icon: "i-lucide-between-horizontal-end",
        onClick: () => {
          editor.chain().focus().addColumnAfter().run();
        },
        tooltip: { text: "Add column after" },
      },
    ],
    [
      {
        icon: "i-lucide-rows-3",
        onClick: () => {
          editor.chain().focus().deleteRow().run();
        },
        tooltip: { text: "Delete row" },
      },
      {
        icon: "i-lucide-columns-3",
        onClick: () => {
          editor.chain().focus().deleteColumn().run();
        },
        tooltip: { text: "Delete column" },
      },
    ],
    [
      {
        icon: "i-lucide-trash",
        onClick: () => {
          editor.chain().focus().deleteTable().run();
        },
        tooltip: { text: "Delete table" },
      },
    ],
  ];

  return {
    bubbleToolbarItems,
    getImageToolbarItems,
    getTableToolbarItems,
    toolbarItems,
  };
}
