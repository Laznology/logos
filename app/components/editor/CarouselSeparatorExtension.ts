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
        class: "carousel-separator",
      }),
    ];
  },
});

export default CarouselSeparator;
