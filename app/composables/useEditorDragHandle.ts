import type { DropdownMenuItem, EditorCustomHandlers } from "@nuxt/ui";
import { mapEditorItems } from "@nuxt/ui/utils/editor";
import type { Editor, JSONContent } from "@tiptap/vue-3";
import { upperFirst } from "scule";

const CONVERTIBLE_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
  "listItem",
  "taskItem",
]);

export function useEditorDragHandle<T extends EditorCustomHandlers>(
  customHandlers?: T
) {
  const selectedNode = ref<{ node: JSONContent | null; pos: number }>();

  const getTypeSpecificItems = (
    editor: Editor,
    nodeType: string
  ): DropdownMenuItem[] => {
    const pos = selectedNode.value?.pos;

    if (CONVERTIBLE_TYPES.has(nodeType)) {
      return [
        {
          children: [
            { icon: "i-lucide-type", kind: "paragraph", label: "Paragraph" },
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
            { icon: "i-lucide-list", kind: "bulletList", label: "Bullet List" },
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
          icon: "i-lucide-repeat-2",
          label: "Turn into",
        },
        {
          icon: "i-lucide-rotate-ccw",
          kind: "clearFormatting",
          label: "Reset formatting",
          pos,
        },
      ];
    }

    if (nodeType === "image") {
      const node = pos === undefined ? null : editor.state.doc.nodeAt(pos);
      return [
        {
          download: true,
          icon: "i-lucide-download",
          label: "Download image",
          to: node?.attrs?.src,
        },
      ];
    }

    if (nodeType === "table") {
      return [
        {
          icon: "i-lucide-square-x",
          label: "Clear all contents",
          onSelect: () => {
            if (pos === undefined) {
              return;
            }
            const tableNode = editor.state.doc.nodeAt(pos);
            if (!tableNode) {
              return;
            }

            const cellRanges: { from: number; to: number }[] = [];

            tableNode.descendants((node, nodePos) => {
              if (
                node.type.name === "tableCell" ||
                node.type.name === "tableHeader"
              ) {
                const cellStart = pos + 1 + nodePos + 1;
                const cellEnd = cellStart + node.content.size;
                if (node.content.size > 0) {
                  cellRanges.push({ from: cellStart, to: cellEnd });
                }
              }
              return true;
            });

            const { tr } = editor.state;
            cellRanges.reverse().forEach(({ from, to }) => {
              tr.delete(from, to);
            });

            editor.view.dispatch(tr);
          },
        },
      ];
    }

    return [];
  };

  const getItems = (editor: Editor): DropdownMenuItem[][] => {
    if (!selectedNode.value?.node?.type) {
      return [];
    }

    const nodeType = selectedNode.value.node.type;
    const typeSpecificItems = getTypeSpecificItems(editor, nodeType);

    return mapEditorItems(
      editor,
      [
        [
          {
            label: upperFirst(nodeType),
            type: "label",
          },
          ...typeSpecificItems,
        ],
        [
          {
            icon: "i-lucide-copy",
            kind: "duplicate",
            label: "Duplicate",
            pos: selectedNode.value?.pos,
          },
          {
            icon: "i-lucide-clipboard",
            label: "Copy to clipboard",
            onSelect: async () => {
              if (!selectedNode.value) {
                return;
              }

              const { pos } = selectedNode.value;
              const node = editor.state.doc.nodeAt(pos);
              if (node) {
                const { copy } = useClipboard();
                await copy(node.textContent);
              }
            },
          },
        ],
        [
          {
            icon: "i-lucide-arrow-up",
            kind: "moveUp",
            label: "Move up",
            pos: selectedNode.value?.pos,
          },
          {
            icon: "i-lucide-arrow-down",
            kind: "moveDown",
            label: "Move down",
            pos: selectedNode.value?.pos,
          },
        ],
        [
          {
            icon: "i-lucide-trash",
            kind: "delete",
            label: "Delete",
            pos: selectedNode.value?.pos,
          },
        ],
      ],
      customHandlers
    ) as DropdownMenuItem[][];
  };

  const onNodeChange = (event: { node: JSONContent | null; pos: number }) => {
    selectedNode.value = event;
  };

  return {
    getItems,
    onNodeChange,
    selectedNode,
  };
}
