import type { Renderer as TakumiRenderer } from "@takumi-rs/wasm";
import type { JSONContent } from "@tiptap/core";
import { zipSync } from "fflate";

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
const CAROUSEL_LOGO_PATH = "/noctarian-logo.png";
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 32_768;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCodePoint(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function loadLogoSource(origin: string): Promise<string | null> {
  if (!origin) {
    return null;
  }

  const response = await fetch(resolveImageSource(CAROUSEL_LOGO_PATH, origin));
  if (!response.ok) {
    throw new Error(`Failed to load carousel logo: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const bytes = new Uint8Array(await response.arrayBuffer());
  return `data:${contentType};base64,${bytesToBase64(bytes)}`;
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
  // ponytail: platform-specific rendering module — @takumi-rs/wasm in Cloudflare Workers, @takumi-rs/wasm/node in Node.js/tests
  let createRenderer: () => TakumiRenderer;
  try {
    const wasmNode = await import("@takumi-rs/wasm/node");
    createRenderer = () => new wasmNode.Renderer();
  } catch {
    const wasm = await import("@takumi-rs/wasm");
    createRenderer = () => new wasm.Renderer();
  }
  const logoSrc = frames.length > 0 ? await loadLogoSource(origin) : null;
  const images: Uint8Array[] = [];
  // Takumi can return another frame's buffer when a renderer is reused.
  for (const frame of frames) {
    // oxlint-disable-next-line no-await-in-loop -- isolated renderers preserve frame order.
    const rendered = await createRenderer().render(
      frameNode(frame, origin, logoSrc),
      {
        width: CAROUSEL_WIDTH,
        height: CAROUSEL_HEIGHT,
        format: "png",
      }
    );
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
