import assert from "node:assert/strict";
import test from "node:test";

import { extractHeadingsAndHTML } from "../server/utils/tiptap-renderer.ts";

test("renders an internal post reference as a public post link", () => {
  const { html } = extractHeadingsAndHTML("See [[published-note]].");

  assert.match(html, /href="\/posts\/published-note"/);
  assert.match(html, />published-note<\/a>/);
});

test("preserves TipTap external links in public HTML", () => {
  const { html } = extractHeadingsAndHTML({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Fraktal",
            marks: [
              {
                type: "link",
                attrs: { href: "https://example.com/fractal" },
              },
            ],
          },
        ],
      },
    ],
  });

  assert.match(html, /href="https:\/\/example\.com\/fractal"/);
});
