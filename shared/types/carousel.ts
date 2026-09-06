import type { JSONContent } from "@tiptap/core";

export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1440;
export const CAROUSEL_EDITOR_MODE = "carousel" as const;

const MAX_SLIDE_UNITS = 22;
const CHARS_PER_UNIT = 44;

export type CarouselFrame =
  | { kind: "cover"; title: string }
  | { kind: "slide"; index: number; content: JSONContent[] };

function nodeUnits(node: JSONContent): number {
  if (node.type === "image" || node.type === "imageUpload") {
    return 8;
  }

  if (node.text) {
    return Math.max(1, Math.ceil(node.text.length / CHARS_PER_UNIT));
  }

  const childUnits = (node.content || []).reduce(
    (total, child) => total + nodeUnits(child),
    0
  );
  return Math.max(1, childUnits + (node.type === "heading" ? 1 : 0));
}

function splitParagraph(node: JSONContent): JSONContent[] {
  const text = (node.content || [])
    .map((child) => child.text || "")
    .join("")
    .trim();
  if (!text) {
    return [node];
  }

  const words = text.split(/\s+/);
  const chunks: JSONContent[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > MAX_SLIDE_UNITS * CHARS_PER_UNIT) {
      chunks.push({
        ...node,
        content: [
          { type: "text", text: current, marks: node.content?.[0]?.marks },
        ],
      });
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push({
      ...node,
      content: [
        { type: "text", text: current, marks: node.content?.[0]?.marks },
      ],
    });
  }

  return chunks;
}

function paginateGroup(nodes: JSONContent[]): JSONContent[][] {
  const pages: JSONContent[][] = [];
  let current: JSONContent[] = [];
  let units = 0;

  const flush = () => {
    if (current.length > 0) {
      pages.push(current);
      current = [];
      units = 0;
    }
  };

  for (const node of nodes) {
    const parts = node.type === "paragraph" ? splitParagraph(node) : [node];
    for (const part of parts) {
      const partUnits = nodeUnits(part);
      if (current.length > 0 && units + partUnits > MAX_SLIDE_UNITS) {
        flush();
      }
      current.push(part);
      units += partUnits;
      if (units >= MAX_SLIDE_UNITS) {
        flush();
      }
    }
  }

  flush();
  return pages;
}

export function splitCarouselContent(doc: JSONContent): JSONContent[][] {
  const groups: JSONContent[][] = [];
  let group: JSONContent[] = [];

  for (const node of doc.content || []) {
    if (node.type === "carouselSeparator") {
      if (group.length > 0) {
        groups.push(group);
        group = [];
      }
      continue;
    }
    group.push(node);
  }

  if (group.length > 0) {
    groups.push(group);
  }

  return groups.flatMap(paginateGroup);
}

export function buildCarouselFrames(
  title: string,
  doc: JSONContent
): CarouselFrame[] {
  const bodyFrames = splitCarouselContent(doc).map((content, index) => ({
    kind: "slide" as const,
    index: index + 1,
    content,
  }));

  return [{ kind: "cover", title: title.trim() || "Untitled" }, ...bodyFrames];
}
