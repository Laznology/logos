// @vitest-environment happy-dom

import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import CarouselSeparator from "../../app/components/editor/CarouselSeparatorExtension";

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
});
