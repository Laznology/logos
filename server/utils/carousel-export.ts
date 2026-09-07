import { Renderer } from "@takumi-rs/core";
import type { JSONContent } from "@tiptap/core";
import { zipSync } from "fflate";

import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
  type CarouselFrame,
} from "../../shared/types/carousel";

type Style = Record<string, string | number>;
type RenderNode =
  | { type: "container"; children?: RenderNode[]; style?: Style }
  | { type: "text"; text: string; style?: Style }
  | { type: "image"; src: string; style?: Style };

function textFromNode(node: JSONContent): string {
  if (node.text) {
    return node.text;
  }
  return (node.content || []).map(textFromNode).join(" ");
}

function inlineNodes(content: JSONContent[] = []): RenderNode[] {
  return content.map((node) => {
    if (node.type === "image" || node.type === "imageUpload") {
      return {
        type: "image",
        src: String(node.attrs?.src || ""),
        style: { maxWidth: "100%", maxHeight: 500, objectFit: "contain" },
      };
    }

    const style: Style = {};
    for (const mark of node.marks || []) {
      if (mark.type === "bold") style.fontWeight = 700;
      if (mark.type === "italic") style.fontStyle = "italic";
      if (mark.type === "strike") style.textDecoration = "line-through";
      if (mark.type === "textStyle" && mark.attrs?.color) {
        style.color = String(mark.attrs.color);
      }
    }

    return { type: "text", text: textFromNode(node), style };
  });
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
    const items = (node.content || []).map((item, index) => ({
      type: "container" as const,
      style: { display: "flex", marginBottom: 12 },
      children: inlineNodes([
        {
          type: "text",
          text: node.type === "bulletList" ? "• " : `${index + 1}. `,
        },
        ...(item.content || []),
      ]),
    }));
    return { type: "container", children: items, style: { marginBottom: 24 } };
  }

  const level = Number(node.attrs?.level || 0);
  const isHeading = node.type === "heading";
  return {
    type: "container",
    style: {
      display: "flex",
      marginBottom: isHeading ? 24 : 20,
      fontSize: isHeading ? Math.max(38, 72 - level * 8) : 36,
      fontWeight: isHeading ? 700 : 400,
      lineHeight: isHeading ? 1.05 : 1.25,
    },
    children: inlineNodes(node.content),
  };
}

function resolveImageSource(src: string, origin: string): string {
  if (!src || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return `${origin}${src.startsWith("/") ? src : `/${src}`}`;
}

function frameNode(frame: CarouselFrame, origin: string): RenderNode {
  const surface: Style = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f7f5f0",
    color: "#191a1c",
    padding: 120,
    boxSizing: "border-box",
  };

  if (frame.kind === "cover") {
    return {
      type: "container",
      style: { ...surface, justifyContent: "space-between" },
      children: [
        {
          type: "text",
          text: "LOGOS",
          style: {
            color: "#6f716f",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
          },
        },
        {
          type: "text",
          text: frame.title,
          style: { fontSize: 82, fontWeight: 700, lineHeight: 1.02 },
        },
        {
          type: "text",
          text: "CAROUSEL",
          style: {
            color: "#6f716f",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
          },
        },
      ],
    };
  }

  const children = frame.content.map((node) => blockNode(node));
  for (const child of children) {
    if (child.type === "image") {
      child.src = resolveImageSource(child.src, origin);
    }
  }
  return {
    type: "container",
    style: { ...surface, justifyContent: "center" },
    children,
  };
}

export async function renderCarouselFrames(
  frames: CarouselFrame[],
  origin: string
): Promise<Uint8Array[]> {
  const renderer = new Renderer();
  const images: Uint8Array[] = [];
  for (const frame of frames) {
    const rendered = await renderer.render(frameNode(frame, origin), {
      width: CAROUSEL_WIDTH,
      height: CAROUSEL_HEIGHT,
      format: "png",
    });
    images.push(new Uint8Array(rendered));
  }
  return images;
}

export function createCarouselZip(
  files: Array<{ name: string; data: Uint8Array }>
): Uint8Array {
  const archive = Object.fromEntries(
    files.map(({ name, data }) => [
      name,
      [data, { level: 0 }] as [Uint8Array, { level: 0 }],
    ])
  );
  return zipSync(archive);
}
