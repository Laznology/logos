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
          "carousel-separator my-8 h-10 rounded border border-dashed border-primary/40 bg-primary/5",
      }),
    ];
  },
});

export default CarouselSeparator;
