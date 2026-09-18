import { describe, expect, it, vi } from "vitest";

import { handleMarkdownPaste } from "../../app/utils/editor";

describe("editor markdown paste", () => {
  it("inserts clipboard text through the ready markdown parser", () => {
    const parsed = { type: "doc", content: [] };
    const parse = vi.fn(() => parsed);
    const insertContent = vi.fn();

    expect(
      handleMarkdownPaste(
        { markdown: { parse }, commands: { insertContent } },
        "# Pasted heading"
      )
    ).toBe(true);
    expect(parse).toHaveBeenCalledWith("# Pasted heading");
    expect(insertContent).toHaveBeenCalledWith(parsed);
  });

  it("falls back to native paste when the parser is unavailable", () => {
    expect(handleMarkdownPaste(undefined, "# Pasted heading")).toBe(false);
  });
});
