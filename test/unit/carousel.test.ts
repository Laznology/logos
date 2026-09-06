import { describe, expect, it } from "vitest";

import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
  buildCarouselFrames,
  splitCarouselContent,
} from "../../shared/types/carousel";

const paragraph = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

describe("carousel pagination", () => {
  it("uses 1080x1440 and creates a title cover", () => {
    const frames = buildCarouselFrames("My story", {
      type: "doc",
      content: [paragraph("Body")],
    });

    expect([CAROUSEL_WIDTH, CAROUSEL_HEIGHT]).toEqual([1080, 1440]);
    expect(frames.map((frame) => frame.kind)).toEqual(["cover", "slide"]);
    expect(frames[0]).toMatchObject({ kind: "cover", title: "My story" });
  });

  it("uses Untitled and skips empty separator groups", () => {
    const frames = buildCarouselFrames("", {
      type: "doc",
      content: [
        { type: "carouselSeparator" },
        { type: "carouselSeparator" },
        paragraph("Body"),
        { type: "carouselSeparator" },
      ],
    });

    expect(frames.map((frame) => frame.kind)).toEqual(["cover", "slide"]);
    expect(frames[0]).toMatchObject({ title: "Untitled" });
  });

  it("preserves separator order and makes oversized text continuation slides", () => {
    const longText = "word ".repeat(500);
    const doc = {
      type: "doc",
      content: [
        paragraph(longText),
        { type: "carouselSeparator" },
        paragraph("Last"),
      ],
    };
    const groups = splitCarouselContent(doc);

    expect(groups.length).toBeGreaterThan(2);
    const frames = buildCarouselFrames("Title", doc);
    expect(frames.length).toBeGreaterThan(3);
    expect(frames.at(-1)).toMatchObject({ kind: "slide" });
  });
});
