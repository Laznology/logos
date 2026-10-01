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
const CAROUSEL_BACKGROUND = "#0a0a0a";
const CAROUSEL_TEXT = "#faf8f5";
const CAROUSEL_TEXT_DIM = "rgba(250, 248, 245, 0.5)";
const CAROUSEL_ACCENT = "#ff4f00";
const CAROUSEL_BORDER = "rgba(250, 248, 245, 0.18)";
// ponytail: inline logo avoids a Worker self-fetch to the public asset.
const CAROUSEL_LOGO_SOURCE =
  "data:image/webp;base64,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";
const CAROUSEL_NOISE_BACKGROUND =
  'url("data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.75%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27 opacity=%270.08%27/%3E%3C/svg%3E")';

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

function accentNode(): RenderNode {
  return {
    type: "container",
    style: {
      display: "flex",
      width: 60,
      height: 4,
      backgroundColor: CAROUSEL_ACCENT,
    },
  };
}

function coverFooterNode(logoSrc: string | null): RenderNode {
  const children: RenderNode[] = [
    textNode("01", {
      color: CAROUSEL_TEXT_DIM,
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: 4,
    }),
  ];

  if (logoSrc) {
    children.unshift({
      type: "image",
      src: logoSrc,
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
      },
    });
  }

  return {
    type: "container",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingTop: 24,
      borderTop: `1px solid ${CAROUSEL_BORDER}`,
    },
    children,
  };
}

function slideFooterNode(index: number, logoSrc: string | null): RenderNode {
  const children: RenderNode[] = [
    textNode(String(index).padStart(2, "0"), {
      color: CAROUSEL_TEXT_DIM,
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: 4,
    }),
  ];

  if (logoSrc) {
    children.unshift({
      type: "image",
      src: logoSrc,
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
      },
    });
  }

  return {
    type: "container",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 48,
      paddingTop: 24,
      borderTop: `1px solid ${CAROUSEL_BORDER}`,
    },
    children,
  };
}

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
      if (mark.type === "bold") {
        style.fontWeight = 700;
      }
      if (mark.type === "italic") {
        style.fontStyle = "italic";
      }
      if (mark.type === "strike") {
        style.textDecoration = "line-through";
      }
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

function frameNode(
  frame: CarouselFrame,
  origin: string,
  logoSrc: string | null
): RenderNode {
  const surface: Style = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: CAROUSEL_BACKGROUND,
    backgroundImage: CAROUSEL_NOISE_BACKGROUND,
    backgroundRepeat: "repeat",
    backgroundSize: "400px 400px",
    color: CAROUSEL_TEXT,
    padding: "94px 119px",
    boxSizing: "border-box",
  };

  if (frame.kind === "cover") {
    return {
      type: "container",
      style: { ...surface, justifyContent: "flex-start" },
      children: [
        accentNode(),
        {
          type: "container",
          style: {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          },
          children: [
            textNode(frame.title, {
              display: "flex",
              fontFamily: "Lora",
              fontSize: 82,
              fontWeight: 300,
              color: CAROUSEL_TEXT,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }),
          ],
        },
        coverFooterNode(logoSrc),
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
    style: { ...surface, justifyContent: "flex-start" },
    children: [
      accentNode(),
      {
        type: "container",
        style: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          width: "100%",
          overflow: "hidden",
        },
        children,
      },
      slideFooterNode(frame.index + 1, logoSrc),
    ],
  };
}

export async function renderCarouselFrames(
  frames: CarouselFrame[],
  origin: string
): Promise<Uint8Array[]> {
  const logoSrc = frames.length > 0 ? CAROUSEL_LOGO_SOURCE : null;
  const images: Uint8Array[] = [];
  // Takumi can return another frame's buffer when a renderer is reused.
  for (const frame of frames) {
    // oxlint-disable-next-line no-await-in-loop -- isolated renderers preserve frame order.
    const renderer = await createCarouselRenderer();
    // oxlint-disable-next-line no-await-in-loop -- isolated renderers preserve frame order.
    const rendered = await renderer.render(frameNode(frame, origin, logoSrc), {
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
