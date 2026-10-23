import type { JSONContent } from "@tiptap/core";
import { zipSync } from "fflate";

import { createCarouselRenderer } from "#carousel-renderer";

import type { CarouselFrame } from "../../shared/types/carousel";
import { CAROUSEL_HEIGHT, CAROUSEL_WIDTH } from "../../shared/types/carousel";

type Style = Record<string, string | number>;
type RenderNode =
  | { type: "container"; children?: RenderNode[]; style?: Style }
  | { type: "text"; text: string; style?: Style }
  | { type: "image"; src: string; style?: Style };
const CAROUSEL_BACKGROUND = "#ffffff";
const CAROUSEL_TEXT = "#151515";
const CAROUSEL_TEXT_DIM = "rgba(21, 21, 21, 0.7)";
const CAROUSEL_ACCENT = "#d83a32";
const CAROUSEL_BORDER = "rgba(21, 21, 21, 0.16)";
const CAROUSEL_FONT_HEADING = "Space Grotesk";
const CAROUSEL_FONT_BODY = "Space Mono";

// ponytail: embedded brand mark avoids a Worker self-fetch.
const CAROUSEL_LOGO_SOURCE =
  "data:image/png;base64,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";
// ponytail: inline lucide globe keeps the export free of icon-font dependencies.
const CAROUSEL_GLOBE_SOURCE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTUxNTE1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJNMTIgMmExNC41IDE0LjUgMCAwIDAgMCAyMCAxNC41IDE0LjUgMCAwIDAgMC0yMCIvPjxwYXRoIGQ9Ik0yIDEyaDIwIi8+PC9zdmc+";
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 32_000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCodePoint(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function resolveImageSource(src: string, origin: string): string {
  if (!src || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/")) {
    return `${origin}${src}`;
  }
  return `${origin}/${src}`;
}
function textNode(text: string, style: Style): RenderNode {
  return { type: "text", text, style };
}

function footerNode(page: number): RenderNode {
  return {
    type: "container",
    style: {
      alignItems: "center",
      color: CAROUSEL_TEXT_DIM,
      display: "flex",
      fontFamily: CAROUSEL_FONT_BODY,
      fontSize: 24,
      justifyContent: "space-between",
      marginLeft: -27,
    },
    children: [
      {
        type: "container",
        style: { alignItems: "center", display: "flex", gap: 14 },
        children: [
          {
            type: "image",
            src: CAROUSEL_GLOBE_SOURCE,
            style: { height: 30, width: 30 },
          },
          textNode("pisah.in", { letterSpacing: 0.5 }),
        ],
      },
      textNode(`${String(page).padStart(2, "0")}_`, { letterSpacing: 1 }),
    ],
  };
}

function logoNode(src: string): RenderNode {
  return {
    type: "image",
    src,
    style: { height: 86, marginLeft: -27, width: 86 },
  };
}

const RENDERABLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function resolveLogoSource(
  logo: string | null | undefined,
  origin: string
): Promise<string> {
  if (!logo) {
    return CAROUSEL_LOGO_SOURCE;
  }
  if (logo.startsWith("data:")) {
    return logo;
  }
  try {
    const response = await fetch(resolveImageSource(logo, origin));
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (
      !response.ok ||
      !contentType ||
      !RENDERABLE_IMAGE_TYPES.has(contentType)
    ) {
      return CAROUSEL_LOGO_SOURCE;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 2 * 1024 * 1024) {
      return CAROUSEL_LOGO_SOURCE;
    }
    return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
  } catch {
    return CAROUSEL_LOGO_SOURCE;
  }
}

function textFromNode(node: JSONContent): string {
  if (node.text) {
    return node.text;
  }
  return (node.content || []).map(textFromNode).join(" ");
}

function rawText(node: JSONContent): string {
  if (node.text) {
    return node.text;
  }
  return (node.content || []).map(rawText).join("");
}

function inlineNodes(content: JSONContent[] = []): RenderNode[] {
  const runs: { image?: RenderNode; style?: Style; text?: string }[] = [];

  for (const node of content) {
    if (node.type === "hardBreak") {
      continue;
    }

    if (node.type === "image" || node.type === "imageUpload") {
      runs.push({
        image: {
          type: "image",
          src: String(node.attrs?.src || ""),
          style: { maxWidth: "100%", maxHeight: 500, objectFit: "contain" },
        },
      });
    } else {
      const style: Style = {};
      const decorations: string[] = [];
      for (const mark of node.marks || []) {
        if (mark.type === "bold") {
          style.fontWeight = 700;
        }
        if (mark.type === "italic") {
          style.fontStyle = "italic";
        }
        if (mark.type === "underline") {
          decorations.push("underline");
        }
        if (mark.type === "strike") {
          decorations.push("line-through");
        }
        if (mark.type === "code") {
          style.backgroundColor = "#f5f5f4";
          style.fontFamily = CAROUSEL_FONT_BODY;
        }
        if (mark.type === "highlight") {
          style.backgroundColor = String(mark.attrs?.color || "#fef08a");
        }
        if (mark.type === "link") {
          style.color = CAROUSEL_ACCENT;
          decorations.push("underline");
        }
        if (mark.type === "textStyle" && mark.attrs?.color) {
          style.color = String(mark.attrs.color);
        }
      }
      if (decorations.length > 0) {
        style.textDecoration = decorations.join(" ");
      }

      for (const token of textFromNode(node).match(/\s+|\S+/g) || []) {
        if (/^\s+$/.test(token)) {
          const previous = runs.at(-1);
          if (previous?.text) {
            previous.text += " ";
          }
          continue;
        }
        runs.push({ style, text: token });
      }
    }
  }

  return runs.map((run) => {
    if (run.image) {
      return run.image;
    }
    return textNode(run.text || "", run.style || {});
  });
}

function splitOnHardBreaks(content: JSONContent[] = []): JSONContent[][] {
  const lines: JSONContent[][] = [[]];
  for (const node of content) {
    if (node.type === "hardBreak") {
      lines.push([]);
      continue;
    }
    lines.at(-1)?.push(node);
  }
  return lines;
}

function textBlockNode(node: JSONContent, overrides: Style = {}): RenderNode {
  const level = Number(node.attrs?.level || 0);
  const isHeading = node.type === "heading";
  const marginBottom = overrides.marginBottom ?? (isHeading ? 24 : 20);
  const baseStyle: Style = {
    display: "flex",
    flexWrap: "wrap",
    fontFamily: isHeading ? CAROUSEL_FONT_HEADING : CAROUSEL_FONT_BODY,
    fontSize: isHeading ? Math.max(38, 72 - level * 8) : 36,
    fontWeight: isHeading ? 700 : 400,
    ...(isHeading ? { letterSpacing: "-0.04em" } : {}),
    lineHeight: isHeading ? 1.05 : 1.55,
    ...overrides,
    marginBottom,
  };
  const lines = splitOnHardBreaks(node.content);
  if (lines.length <= 1) {
    return {
      type: "container",
      style: baseStyle,
      children: inlineNodes(node.content),
    };
  }
  return {
    type: "container",
    style: {
      display: "flex",
      flexDirection: "column",
      marginBottom,
    },
    children: lines.map((line) => ({
      type: "container",
      style: { ...baseStyle, marginBottom: 0, width: "100%" },
      children: inlineNodes(line),
    })),
  };
}

function listNode(node: JSONContent, depth = 0): RenderNode {
  const ordered = node.type === "orderedList";
  const start = Number(node.attrs?.start || 1);
  const items = (node.content || []).map((item, index) => {
    const line: RenderNode[] = [];
    const nested: JSONContent[] = [];
    for (const child of item.content || []) {
      if (child.type === "bulletList" || child.type === "orderedList") {
        nested.push(child);
      } else if (child.type === "paragraph") {
        line.push(...inlineNodes(child.content));
      } else {
        line.push(...inlineNodes([child]));
      }
    }
    return {
      type: "container" as const,
      style: {
        display: "flex",
        flexDirection: "column",
        marginBottom: depth === 0 ? 10 : 6,
      },
      children: [
        {
          type: "container" as const,
          style: {
            display: "flex",
            flexWrap: "wrap",
            fontSize: 36,
            lineHeight: 1.55,
          },
          children: [
            textNode(ordered ? `${start + index}. ` : "\u2022 ", {
              fontSize: 36,
            }),
            ...line,
          ],
        },
        ...nested.map((child) => listNode(child, depth + 1)),
      ],
    };
  });

  return {
    type: "container",
    style: {
      display: "flex",
      flexDirection: "column",
      marginBottom: depth === 0 ? 20 : 4,
      marginLeft: depth === 0 ? 0 : 28,
    },
    children: items,
  };
}

function codeBlockNode(node: JSONContent): RenderNode {
  return {
    type: "container",
    style: {
      backgroundColor: "#f5f5f4",
      borderColor: "rgba(21, 21, 21, 0.12)",
      borderRadius: 10,
      borderStyle: "solid",
      borderWidth: 1,
      marginBottom: 20,
      padding: "16px 18px",
    },
    children: [
      {
        type: "text",
        text: (node.content || []).map(rawText).join(""),
        style: {
          color: CAROUSEL_TEXT,
          fontFamily: CAROUSEL_FONT_BODY,
          fontSize: 28,
          lineHeight: 1.45,
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        },
      },
    ],
  };
}

function tableNode(node: JSONContent): RenderNode {
  const rows = node.content || [];
  return {
    type: "container",
    style: {
      borderColor: CAROUSEL_BORDER,
      borderLeftStyle: "solid",
      borderLeftWidth: 1,
      borderTopStyle: "solid",
      borderTopWidth: 1,
      display: "flex",
      flexDirection: "column",
      marginBottom: 20,
      width: "100%",
    },
    children: rows.map((row) => ({
      type: "container",
      style: { display: "flex", flexDirection: "row", width: "100%" },
      children: (row.content || []).map((cell) => {
        const header = cell.type === "tableHeader";
        const blocks = cell.content || [];
        return {
          type: "container",
          style: {
            ...(header ? { backgroundColor: "#f5f5f4" } : {}),
            borderBottomStyle: "solid",
            borderBottomWidth: 1,
            borderColor: CAROUSEL_BORDER,
            borderRightStyle: "solid",
            borderRightWidth: 1,
            display: "block",
            flex: 1,
            padding: "10px 12px",
          },
          children: blocks.map((child, index) =>
            textBlockNode(child, {
              fontFamily: header ? CAROUSEL_FONT_HEADING : CAROUSEL_FONT_BODY,
              fontSize: 30,
              fontWeight: header ? 700 : 400,
              lineHeight: 1.45,
              marginBottom: index === blocks.length - 1 ? 0 : 6,
            })
          ),
        };
      }),
    })),
  };
}

function blockNode(node: JSONContent): RenderNode {
  if (node.type === "image" || node.type === "imageUpload") {
    return {
      type: "image",
      src: String(node.attrs?.src || ""),
      style: {
        width: "100%",
        maxHeight: 500,
        objectFit: "contain",
        marginTop: 24,
        marginBottom: 24,
      },
    };
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return listNode(node);
  }

  if (node.type === "blockquote") {
    return {
      type: "container",
      style: {
        borderLeftColor: CAROUSEL_ACCENT,
        borderLeftStyle: "solid",
        borderLeftWidth: 4,
        color: CAROUSEL_TEXT_DIM,
        fontStyle: "italic",
        marginBottom: 20,
        paddingLeft: 20,
      },
      children: (node.content || []).map((child) =>
        child.type === "paragraph"
          ? textBlockNode(child, { marginBottom: 6 })
          : blockNode(child)
      ),
    };
  }

  if (node.type === "codeBlock") {
    return codeBlockNode(node);
  }

  if (node.type === "horizontalRule") {
    return {
      type: "container",
      style: {
        backgroundColor: CAROUSEL_BORDER,
        height: 1,
        marginBottom: 24,
        marginTop: 4,
        width: "100%",
      },
    };
  }

  if (node.type === "table") {
    return tableNode(node);
  }

  return textBlockNode(node);
}

function flowText(text: string, style: Style): RenderNode {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return {
    type: "container",
    style: { display: "flex", flexWrap: "wrap", ...style },
    children: words.map((word, index) =>
      textNode(index === words.length - 1 ? word : `${word} `, {})
    ),
  };
}

async function toDataUri(src: string, origin: string): Promise<string> {
  if (!src || src.startsWith("data:")) {
    return src;
  }
  const url = src.startsWith("/") ? `${origin}${src}` : src;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return src;
  }
  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (!response.ok || !contentType?.startsWith("image/")) {
      return src;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 4 * 1024 * 1024) {
      return src;
    }
    return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
  } catch {
    return src;
  }
}

async function embedImages(node: RenderNode, origin: string): Promise<void> {
  if (node.type === "image") {
    node.src = await toDataUri(node.src, origin);
    return;
  }
  if (node.type === "container") {
    await Promise.all(
      (node.children || []).map((child) => embedImages(child, origin))
    );
  }
}

function frameNode(frame: CarouselFrame, logoSrc: string): RenderNode {
  const surface: Style = {
    boxSizing: "border-box",
    color: CAROUSEL_TEXT,
    display: "flex",
    flexDirection: "column",
    fontFamily: CAROUSEL_FONT_BODY,
    backgroundColor: CAROUSEL_BACKGROUND,
    height: "100%",
    padding: "54px 86px 43px",
    width: "100%",
  };

  if (frame.kind === "cover") {
    return {
      type: "container",
      style: surface,
      children: [
        logoNode(logoSrc),
        {
          type: "container",
          style: {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          },
          children: [
            flowText(frame.title, {
              fontFamily: CAROUSEL_FONT_HEADING,
              fontSize: 67,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }),
          ],
        },
        footerNode(1),
      ],
    };
  }

  const children = frame.content.map((node) => blockNode(node));

  return {
    type: "container",
    style: surface,
    children: [
      logoNode(logoSrc),
      {
        type: "container",
        style: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          overflow: "hidden",
          width: "100%",
        },
        children,
      },
      footerNode(frame.index + 1),
    ],
  };
}

export async function renderCarouselFrames(
  frames: CarouselFrame[],
  origin: string,
  logo?: string | null
): Promise<Uint8Array[]> {
  const logoSrc = await resolveLogoSource(logo, origin);
  const images: Uint8Array[] = [];
  // Takumi can return another frame's buffer when a renderer is reused.
  for (const frame of frames) {
    // oxlint-disable-next-line no-await-in-loop -- isolated renderers preserve frame order.
    const renderer = await createCarouselRenderer();
    // oxlint-disable-next-line no-await-in-loop -- isolated renderers preserve frame order.
    const node = frameNode(frame, logoSrc);
    // oxlint-disable-next-line no-await-in-loop -- image fetch is per frame.
    await embedImages(node, origin);
    // oxlint-disable-next-line no-await-in-loop -- isolated renderers preserve frame order.
    const rendered = await renderer.render(node, {
      width: CAROUSEL_WIDTH,
      height: CAROUSEL_HEIGHT,
      format: "png",
    });
    images.push(Uint8Array.from(new Uint8Array(rendered)));
  }
  return images;
}

export function createCarouselZip(
  files: { name: string; data: Uint8Array }[]
): Uint8Array {
  const archive = Object.fromEntries(
    files.map(({ name, data }) => [
      name,
      [data, { level: 0 }] as [Uint8Array, { level: 0 }],
    ])
  );
  return zipSync(archive);
}
