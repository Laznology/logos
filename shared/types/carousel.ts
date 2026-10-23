import type { JSONContent } from "@tiptap/core";

export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1350;
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
  const content = node.content || [];
  const limit = MAX_SLIDE_UNITS * CHARS_PER_UNIT;
  const textLength = content.reduce(
    (total, child) => total + (child.text?.length || 0),
    0
  );
  if (textLength <= limit) {
    return [node];
  }

  const chunks: JSONContent[][] = [];
  let current: JSONContent[] = [];
  let currentLength = 0;

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current);
    }
    current = [];
    currentLength = 0;
  };

  for (const child of content) {
    if (!child.text) {
      current.push(child);
      currentLength += 1;
      continue;
    }

    for (const word of child.text.trim().split(/\s+/).filter(Boolean)) {
      const piece = currentLength === 0 ? word : ` ${word}`;
      if (currentLength > 0 && currentLength + piece.length > limit) {
        flush();
        current.push({ ...child, text: word });
        currentLength = word.length;
        continue;
      }
      const last = current.at(-1);
      if (
        last?.type === "text" &&
        JSON.stringify(last.marks) === JSON.stringify(child.marks)
      ) {
        last.text = `${last.text}${piece}`;
      } else {
        current.push({ ...child, text: piece });
      }
      currentLength += piece.length;
    }
  }

  flush();
  return chunks.map((chunk) => ({ ...node, content: chunk }));
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
