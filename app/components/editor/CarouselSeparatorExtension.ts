import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    carouselSeparator: {
      insertCarouselSeparator: () => ReturnType;
    };
  }
}

const CarouselSeparator = Node.create({
  name: "carouselSeparator",
  group: "block",
  atom: true,
  selectable: true,
  markdownTokenName: "carouselSeparator",
  markdownTokenizer: {
    name: "carouselSeparator",
    level: "block",
    start: "<!-- slide -->",
    tokenize(src) {
      const match = src.match(/^<!--\s*slide\s*-->\s*(?:\n|$)/);
      if (!match) {
        return undefined;
      }
      return { type: "carouselSeparator", raw: match[0] };
    },
  },
  parseMarkdown(_token, { createNode }) {
    return createNode("carouselSeparator");
  },
  renderMarkdown() {
    return "<!-- slide -->";
  },

  addCommands() {
    return {
      insertCarouselSeparator:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="carousel-separator"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "carousel-separator",
        "aria-label": "Slide separator",
        class:
          "carousel-separator my-8 flex h-8 items-center justify-center rounded border border-dashed border-primary/40 bg-primary/5 text-xs font-medium text-primary/60 select-none",
      }),
      "--- Slide Break ---",
    ];
  },
});

export default CarouselSeparator;
