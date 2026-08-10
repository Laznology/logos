import { Node, mergeAttributes } from "@tiptap/core";
import type { NodeViewRenderer } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";

import ImageUploadNodeComponent from "./ImageUploadNode.vue";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageUpload: {
      insertImageUpload: () => ReturnType;
    };
  }
}

export const ImageUpload = Node.create({
  addAttributes() {
    return {};
  },
  addCommands() {
    return {
      insertImageUpload:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(ImageUploadNodeComponent);
  },
  atom: true,
  draggable: true,
  group: "block",
  name: "imageUpload",
  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "image-upload" }),
    ];
  },
});

export default ImageUpload;
