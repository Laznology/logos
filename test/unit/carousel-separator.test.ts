// @vitest-environment happy-dom

import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import CarouselSeparator from "../../app/components/editor/CarouselSeparatorExtension";
import { editorSuggestionItems } from "../../app/utils/editor";

describe("CarouselSeparator", () => {
  it("inserts and serializes one block separator", () => {
    const editor = new Editor({ extensions: [StarterKit, CarouselSeparator] });
    editor.commands.setContent({
      type: "doc",
      content: [{ type: "paragraph" }],
    });

    expect(editor.chain().focus().insertCarouselSeparator().run()).toBe(true);
    const nodeTypes = editor.getJSON().content?.map((node) => node.type);
    expect(nodeTypes).toContain("paragraph");
    expect(nodeTypes).toContain("carouselSeparator");
    expect(
      nodeTypes?.filter((type) => type === "carouselSeparator")
    ).toHaveLength(1);
  });
  it("deletes a selected slide break without touching neighboring blocks", () => {
    const editor = new Editor({ extensions: [StarterKit, CarouselSeparator] });
    editor.commands.setContent({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Before" }] },
        { type: "carouselSeparator" },
        { type: "paragraph", content: [{ type: "text", text: "After" }] },
      ],
    });

    let separatorPos: number | undefined;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "carouselSeparator") {
        separatorPos = pos;
        return false;
      }
      return true;
    });

    expect(separatorPos).toBeDefined();
    expect(editor.commands.setNodeSelection(separatorPos as number)).toBe(true);
    expect(editor.commands.deleteSelection()).toBe(true);
    expect(editor.getJSON()).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Before" }] },
        { type: "paragraph", content: [{ type: "text", text: "After" }] },
      ],
    });
  });

  it("exposes Slide in the slash command menu", () => {
    const items = editorSuggestionItems.flat();
    expect(items).toContainEqual(
      expect.objectContaining({ kind: "carouselSeparator", label: "Slide" })
    );
  });
});
