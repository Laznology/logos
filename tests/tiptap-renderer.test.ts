import assert from "node:assert/strict";
import test from "node:test";

import { extractHeadingsAndHTML } from "../server/utils/tiptap-renderer.ts";

test("renders an internal post reference as a public post link", () => {
  const { html } = extractHeadingsAndHTML("See [[published-note]].");

  assert.match(html, /href="\/posts\/published-note"/);
  assert.match(html, />published-note<\/a>/);
});
