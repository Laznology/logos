import type { Extensions, JSONContent } from "@tiptap/core";
import { Node, mergeAttributes } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Marked } from "marked";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface RenderResult {
  html: string;
  headings: HeadingItem[];
  wordCount: number;
  readingTime: number;
  markdown: string;
}

const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element: {
          getAttribute: (name: string) => string | null;
        }) => element.getAttribute("id"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.id) {
            return {};
          }
          return { id: String(attributes.id) };
        },
      },
    };
  },
});

const ImageUploadExtension = Node.create({
  name: "imageUpload",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="imageUpload"]' }, { tag: "img" }];
  },
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.src) {
      return [
        "img",
        mergeAttributes(HTMLAttributes, {
          class: "rounded-lg max-w-full h-auto my-4",
        }),
      ];
    }
    return ["div", { "data-type": "imageUpload" }];
  },
});

const rendererExtensions: Extensions = [
  StarterKit.configure({
    heading: false,
  }) as unknown as Extensions[number],
  CustomHeading.configure({
    levels: [1, 2, 3, 4],
  }) as unknown as Extensions[number],
  TableKit as unknown as Extensions[number],
  TaskList as unknown as Extensions[number],
  TaskItem.configure({
    nested: true,
  }) as unknown as Extensions[number],
  Image.configure({
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto my-4",
    },
  }) as unknown as Extensions[number],
  ImageUploadExtension as unknown as Extensions[number],
];

function getNodeText(node: JSONContent): string {
  if (node.text) {
    return node.text;
  }
  if (node.content) {
    return node.content.map(getNodeText).join(" ");
  }
  return "";
}

function processJsonHeadings(doc: JSONContent): HeadingItem[] {
  const headings: HeadingItem[] = [];
  let index = 0;

  function traverse(node: JSONContent) {
    if (node.type === "heading") {
      index += 1;
      const rawText = getNodeText(node).trim();
      const cleanText = rawText
        .replaceAll(/<[^>]*>/g, "")
        .replaceAll(/[*_~`#]/g, "")
        .trim();
      const level = (node.attrs?.level as number) || 1;
      const slugId =
        cleanText
          .toLowerCase()
          .replaceAll(/[^\w\s-]/g, "")
          .replaceAll(/[\s_-]+/g, "-")
          .replaceAll(/^-+|-+$/g, "") || `section-${index}`;
      const id = `${slugId}-${index}`;

      node.attrs = {
        ...node.attrs,
        id,
      };

      if (cleanText) {
        headings.push({ id, text: cleanText, level });
      }
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(doc);
  return headings;
}

function computeMetrics(text: string): {
  wordCount: number;
  readingTime: number;
} {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTime };
}

function isWrappedJson(str: string): boolean {
  if (str.startsWith('"') && str.endsWith('"')) {
    return true;
  }
  if (str.startsWith("{") && str.endsWith("}")) {
    return true;
  }
  return str.startsWith("[") && str.endsWith("]");
}

function normalizeContent(content: unknown): unknown {
  if (typeof content === "string") {
    let curr = content.trim();
    while (isWrappedJson(curr)) {
      try {
        const parsed = JSON.parse(curr);
        if (typeof parsed === "string") {
          curr = parsed.trim();
        } else {
          return parsed;
        }
      } catch {
        break;
      }
    }
    return curr;
  }
  return content;
}

export function extractHeadingsAndHTML(rawContent: unknown): RenderResult {
  const content = normalizeContent(rawContent);

  if (!content) {
    return {
      html: "",
      headings: [],
      wordCount: 0,
      readingTime: 1,
      markdown: "",
    };
  }

  if (
    typeof content === "object" &&
    content !== null &&
    (content as JSONContent).type === "doc"
  ) {
    const doc = structuredClone(content) as JSONContent;
    const rawText = getNodeText(doc);
    const { wordCount, readingTime } = computeMetrics(rawText);
    const headings = processJsonHeadings(doc);

    try {
      const html = generateHTML(doc, rendererExtensions);
      return {
        html,
        headings,
        wordCount,
        readingTime,
        markdown: rawText,
      };
    } catch (error) {
      console.error("Failed to generate HTML from TipTap JSON", error);
      return {
        html: `<div data-type="unknown">${String(rawContent)}</div>`,
        headings: [],
        wordCount,
        readingTime,
        markdown: rawText,
      };
    }
  }

  const markdownString =
    typeof content === "string" ? content : String(content);
  const headings: HeadingItem[] = [];
  let headingIndex = 0;

  const marked = new Marked({
    gfm: true,
    breaks: true,
  });

  marked.use({
    renderer: {
      heading({ depth, text }) {
        headingIndex += 1;
        const cleanText = text
          .replaceAll(/<[^>]*>/g, "")
          .replaceAll(/[*_~`#]/g, "")
          .trim();
        const slug =
          cleanText
            .toLowerCase()
            .replaceAll(/[^\w\s-]/g, "")
            .replaceAll(/[\s_-]+/g, "-")
            .replaceAll(/^-+|-+$/g, "") || `section-${headingIndex}`;
        const id = `${slug}-${headingIndex}`;

        headings.push({ id, text: cleanText, level: depth });
        const inlineHtml = marked.parseInline(text);
        return `<h${depth} id="${id}">${inlineHtml}</h${depth}>\n`;
      },
    },
  });

  try {
    const html = marked.parse(markdownString) as string;
    const plainText = markdownString
      .replaceAll(/[#*`_~[\]()]/g, " ")
      .replaceAll(/<[^>]*>/g, " ");
    const { wordCount, readingTime } = computeMetrics(plainText);

    return {
      html,
      headings,
      wordCount,
      readingTime,
      markdown: markdownString,
    };
  } catch (error) {
    console.error("Failed to parse Markdown with marked", error);
    const { wordCount, readingTime } = computeMetrics(markdownString);
    return {
      html: `<p>${markdownString}</p>`,
      headings: [],
      wordCount,
      readingTime,
      markdown: markdownString,
    };
  }
}

export function renderPostContent(content: unknown): string {
  return extractHeadingsAndHTML(content).html;
}
