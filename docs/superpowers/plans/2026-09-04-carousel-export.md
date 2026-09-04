# Carousel Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent carousel mode to the existing post editor that previews rich text and media in a fixed 1080×1440 Logos template and downloads a ZIP of `cover.png` plus ordered slide PNGs.

**Architecture:** Keep the existing post row and Tiptap JSON. Store only `metadata.editorMode = "carousel"`; represent `/slide` as a custom block node. A shared carousel model/paginator feeds the WYSIWYG template and the server export route. The server renders each frame with the installed Takumi stack and packages the PNG buffers with `fflate`.

**Tech Stack:** Nuxt 4, Vue 3, Nuxt UI v4 `UEditor`, Tiptap 3, `@takumi-rs/core`/existing Takumi integration, `fflate`, Vitest, Nuxt test utils, Playwright.

## Global Constraints

- One fixed template only; no custom dimensions, colors, fonts, or branding controls.
- Every frame is exactly 1080×1440 px (3:4).
- `cover.png` is generated from the title; an empty title displays `Untitled`.
- `/slide` is the explicit separator and never appears in exported content.
- Consecutive, leading, and trailing separators do not create empty PNGs.
- Oversized content becomes ordered continuation slides; prefer block boundaries and split paragraph text when required.
- Article mode remains the existing editor behavior.
- Export is authenticated and must not return a partial ZIP after a render failure.
- Do not add a database migration or a second content column.
- Add focused tests for every observable transformation and one browser download smoke path.

---

### Task 1: Add shared carousel models and pagination

**Files:**

- Create: `shared/types/carousel.ts`
- Test: `test/unit/carousel.test.ts`

**Interfaces:**

- Produces `CAROUSEL_WIDTH`, `CAROUSEL_HEIGHT`, `CAROUSEL_EDITOR_MODE`, `CarouselFrame`, `CarouselSlide`, `splitCarouselContent()`, and `buildCarouselFrames()` for editor and server consumers.
- `buildCarouselFrames(title: string, doc: JSONContent): CarouselFrame[]` returns the cover frame followed by non-empty body frames.
- `splitCarouselContent(doc: JSONContent): JSONContent[][]` returns body node groups without separator nodes.

- [ ] **Step 1: Write failing unit tests**

```ts
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
    const groups = splitCarouselContent({
      type: "doc",
      content: [
        paragraph(longText),
        { type: "carouselSeparator" },
        paragraph("Last"),
      ],
    });

    expect(groups).toHaveLength(2);
    const frames = buildCarouselFrames("Title", {
      type: "doc",
      content: [
        paragraph(longText),
        { type: "carouselSeparator" },
        paragraph("Last"),
      ],
    });
    expect(frames.length).toBeGreaterThan(3);
    expect(frames.at(-1)).toMatchObject({ kind: "slide" });
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm vitest run test/unit/carousel.test.ts`

Expected: FAIL because the shared carousel module and separator-aware pagination do not exist.

- [ ] **Step 3: Implement the smallest shared paginator**

In `shared/types/carousel.ts`:

- Define the fixed dimensions and `editorMode` literal.
- Define `CarouselFrame` as a discriminated union: cover frames carry `title`; slide frames carry `content: JSONContent[]` and `index`.
- Group top-level document nodes at `carouselSeparator` boundaries and discard empty groups.
- Treat top-level blocks as the first pagination unit. Use a fixed, documented text budget for this first version so the same result is deterministic in editor and server; split oversized paragraph text at word boundaries while retaining its `marks` on generated text nodes.
- Keep images atomic and move them to the next continuation frame if the current frame has no remaining image budget.
- Put a `ponytail:` comment beside the fixed budget: it is a deterministic first version; replace with measured layout only if real exports show clipping.
- Build the cover first, then numbered body frames in source order.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run test/unit/carousel.test.ts`

Expected: PASS with cover fallback, separator grouping, and continuation ordering covered.

- [ ] **Step 5: Commit the shared contract**

```bash
git add shared/types/carousel.ts test/unit/carousel.test.ts
git commit -m "feat: add carousel pagination model"
```

---

### Task 2: Add the Tiptap separator extension and slash command

**Files:**

- Create: `app/components/editor/CarouselSeparatorExtension.ts`
- Modify: `app/utils/editor.ts:78-150`
- Test: `test/unit/carousel-separator.test.ts`

**Interfaces:**

- Produces `CarouselSeparator` as a Tiptap `Node.create` extension with name `carouselSeparator`, `group: "block"`, `atom: true`, `parseHTML()`, `renderHTML()`, and `addCommands().insertCarouselSeparator()`.
- The command has the type `insertCarouselSeparator: () => ({ commands }: { commands: { insertContent: (content: { type: string }) => boolean }}) => boolean` through Tiptap command inference; call it from `editor.chain().focus().insertCarouselSeparator().run()`.
- Produces a slash menu item with `kind: "carouselSeparator"`, label `Slide`, icon `i-lucide-panel-top`, and search aliases including `slide` and `separator`.

- [ ] **Step 1: Write failing extension tests**

```ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import CarouselSeparator from "../../app/components/editor/CarouselSeparatorExtension";

describe("CarouselSeparator", () => {
  it("inserts and serializes one block separator", () => {
    const editor = new Editor({ extensions: [StarterKit, CarouselSeparator] });
    editor.commands.setContent({
      type: "doc",
      content: [{ type: "paragraph" }],
    });

    expect(editor.chain().focus().insertCarouselSeparator().run()).toBe(true);
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual([
      "paragraph",
      "carouselSeparator",
    ]);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm vitest run test/unit/carousel-separator.test.ts`

Expected: FAIL because the extension is missing.

- [ ] **Step 3: Implement the extension and menu item**

Use Tiptap's custom-node API. Render the node as a `div[data-type="carousel-separator"]` with an accessible `aria-label="Slide separator"`; parse the same attribute. Add the slash item to the existing Insert group without replacing current items. The item executes through the new chain command.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run test/unit/carousel-separator.test.ts`

Expected: PASS, including JSON round-trip and command insertion.

- [ ] **Step 5: Commit the extension**

```bash
git add app/components/editor/CarouselSeparatorExtension.ts app/utils/editor.ts test/unit/carousel-separator.test.ts
git commit -m "feat: add carousel slide separator"
```

---

### Task 3: Build the single WYSIWYG carousel template

**Files:**

- Create: `app/components/editor/CarouselTemplate.vue`
- Modify: `app/components/admin/PostEditorPage.client.vue:1-502`
- Test: `test/nuxt/carousel-template.test.ts`

**Interfaces:**

- `CarouselTemplate.vue` accepts `frame: CarouselFrame` and optional `editable?: boolean`; it renders the same 3:4 frame structure for cover and body slides.
- `PostEditorPage.client.vue` imports `CarouselSeparator`, adds it to `editorExtensions`, reads/writes `metadata.editorMode`, and exposes `exportCarousel()` to the template.

- [ ] **Step 1: Write failing component tests**

```ts
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import CarouselTemplate from "~/components/editor/CarouselTemplate.vue";

describe("CarouselTemplate", () => {
  it("renders the title cover at the fixed ratio", async () => {
    const wrapper = await mountSuspended(CarouselTemplate, {
      props: {
        frame: { kind: "cover", title: "A useful idea" },
      },
    });

    expect(wrapper.text()).toContain("A useful idea");
    expect(wrapper.find('[data-carousel-frame="cover"]').exists()).toBe(true);
  });

  it("renders rich body content and media", async () => {
    const wrapper = await mountSuspended(CarouselTemplate, {
      props: {
        frame: {
          kind: "slide",
          index: 1,
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Heading" }],
            },
            {
              type: "image",
              attrs: { src: "/images/example.png", alt: "Example" },
            },
          ],
        },
      },
    });

    expect(wrapper.text()).toContain("Heading");
    expect(wrapper.find('img[src="/images/example.png"]').exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused component test and verify it fails**

Run: `pnpm vitest run test/nuxt/carousel-template.test.ts`

Expected: FAIL because the template does not exist.

- [ ] **Step 3: Implement the template and editor mode behavior**

Create one fixed template file with the Logos visual tokens already used by the app. Use a fixed aspect-ratio wrapper, explicit overflow behavior, readable typography, and image containment. Render the cover title and body JSON through the existing Tiptap HTML/rendering conventions instead of adding a second rich-text parser.

In `PostEditorPage.client.vue`:

- add `CarouselSeparator` to the editor extension list;
- add a computed `isCarousel` from `(post.metadata as Record<string, unknown>).editorMode`;
- add a mode toggle that updates metadata and calls `performAutoSave()`;
- keep the existing article editor path intact;
- when carousel mode is active, show carousel frame surfaces and the separator markers;
- show `Export Carousel` only when `isCarousel` is true;
- disable the button while its request is pending;
- create a Blob download from the binary endpoint response, then revoke its object URL.

- [ ] **Step 4: Run the component test and the existing editor tests**

Run: `pnpm vitest run test/nuxt/carousel-template.test.ts test/nuxt/component.test.ts`

Expected: PASS; existing editor behavior must remain green.

- [ ] **Step 5: Commit the WYSIWYG surface**

```bash
git add app/components/editor/CarouselTemplate.vue app/components/admin/PostEditorPage.client.vue test/nuxt/carousel-template.test.ts
git commit -m "feat: add carousel editor mode"
```

---

### Task 4: Add server rendering and ZIP export

**Files:**

- Modify: `package.json` and `pnpm-lock.yaml` via `pnpm add fflate`
- Create: `server/utils/carousel-export.ts`
- Create: `server/api/admin/posts/[slug]/carousel-export.get.ts`
- Test: `test/unit/carousel-export.test.ts`
- Test: `test/nuxt/carousel-export.test.ts`

**Interfaces:**

- `renderCarouselFrames(frames: CarouselFrame[]): Promise<Uint8Array[]>` renders each frame at `CAROUSEL_WIDTH` × `CAROUSEL_HEIGHT` and throws on any failed frame.
- `createCarouselZip(files: Array<{ name: string; data: Uint8Array }>): Uint8Array` returns the ZIP bytes using `fflate.zipSync` with PNG compression disabled (`level: 0`).
- `GET /api/admin/posts/:slug/carousel-export` returns `application/zip` with `Content-Disposition: attachment; filename="<slug>-carousel.zip"`.

- [ ] **Step 1: Add the archive dependency**

Run: `pnpm add fflate`

Expected: `package.json` and `pnpm-lock.yaml` add `fflate` without changing unrelated dependencies.

- [ ] **Step 2: Write failing ZIP and endpoint tests**

```ts
import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { createCarouselZip } from "../../server/utils/carousel-export";

describe("carousel ZIP export", () => {
  it("keeps stable PNG names and bytes", () => {
    const zip = createCarouselZip([
      { name: "cover.png", data: new Uint8Array([1, 2]) },
      { name: "slide-01.png", data: new Uint8Array([3, 4]) },
    ]);
    const files = unzipSync(zip);

    expect(Object.keys(files)).toEqual(["cover.png", "slide-01.png"]);
    expect([...files["slide-01.png"]]).toEqual([3, 4]);
  });
});
```

The endpoint test must exercise these observable responses with the existing test harness or mocked service boundary: authorized carousel post → binary ZIP headers; article-mode post → 400; empty body → 400; missing post → 404; unauthorized request → existing protected-handler status.

- [ ] **Step 3: Run the focused tests and verify they fail**

Run: `pnpm vitest run test/unit/carousel-export.test.ts test/nuxt/carousel-export.test.ts`

Expected: FAIL because the ZIP utility and endpoint do not exist.

- [ ] **Step 4: Implement the renderer and ZIP utility**

Use the installed Takumi renderer pattern already present in the repository. Render the single carousel template/model with explicit `width: 1080`, `height: 1440`, and PNG output. Ensure the root render surface fills both dimensions. Resolve uploaded image URLs to the same public image route used by the editor and throw if an asset cannot load.

Create the ZIP with:

```ts
zipSync(
  Object.fromEntries(
    files.map(({ name, data }) => [name, [data, { level: 0 }]])
  )
);
```

Do not send an archive until all PNG promises resolve. Set binary response headers and return the ZIP bytes.

In the route, follow `server/api/posts/[slug]/index.get.ts`: require a valid session, resolve the route slug, load through `postService.getBySlug`, validate carousel metadata/content, call `buildCarouselFrames`, render, zip, and throw the existing error shapes for invalid requests.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run: `pnpm vitest run test/unit/carousel-export.test.ts test/nuxt/carousel-export.test.ts`

Expected: PASS; ZIP entry names, content, status codes, and no-partial-output behavior are covered.

- [ ] **Step 6: Commit the server export**

```bash
git add package.json pnpm-lock.yaml server/utils/carousel-export.ts server/api/admin/posts/[slug]/carousel-export.get.ts test/unit/carousel-export.test.ts test/nuxt/carousel-export.test.ts
git commit -m "feat: export carousel PNGs as ZIP"
```

---

### Task 5: Add the browser export smoke path

**Files:**

- Modify: `tests/example.spec.ts` or the existing closest editor E2E file

**Interfaces:**

- The test uses the visible editor flow only: mode toggle → rich content/media → `/slide` → Export Carousel → download.

- [ ] **Step 1: Add the failing smoke scenario**

```ts
import { test, expect } from "@playwright/test";

test("exports a carousel ZIP", async ({ page }) => {
  await page.goto("/admin/posts/untitled");
  await page.getByRole("button", { name: /carousel/i }).click();
  await page.getByRole("textbox", { name: /title/i }).fill("Carousel smoke");
  await page.locator("[contenteditable=true]").fill("First slide");
  await page.locator("[contenteditable=true]").press("/");
  await page.getByText("Slide", { exact: true }).click();
  await page.locator("[contenteditable=true]").type("Second slide");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /export carousel/i }).click();
  expect((await download).suggestedFilename()).toBe(
    "carousel-smoke-carousel.zip"
  );
});
```

The implementation must expose these exact accessible names: mode button `Carousel`, title textbox `Post title`, and export button `Export Carousel`; the test uses those names and does not fall back to CSS or implementation selectors.

- [ ] **Step 2: Run the smoke test and verify it fails before implementation**

Run: `pnpm playwright test tests/example.spec.ts --grep "exports a carousel ZIP"`

Expected: FAIL until the mode, separator, endpoint, and download action exist.

- [ ] **Step 3: Run it after Tasks 1–4**

Run: `pnpm playwright test tests/example.spec.ts --grep "exports a carousel ZIP"`

Expected: PASS with a downloaded ZIP filename matching the slug.

- [ ] **Step 4: Commit the smoke coverage**

```bash
git add tests/example.spec.ts
git commit -m "test: cover carousel ZIP download"
```

---

### Task 6: Run final verification and cleanup

**Files:**

- Modify only files required by failures found in Tasks 1–5.

- [ ] **Step 1: Run focused unit and Nuxt coverage**

Run: `pnpm vitest run test/unit/carousel.test.ts test/unit/carousel-separator.test.ts test/unit/carousel-export.test.ts test/nuxt/carousel-template.test.ts test/nuxt/carousel-export.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the real browser smoke path**

Run: `pnpm playwright test tests/example.spec.ts --grep "exports a carousel ZIP"`

Expected: PASS and one downloaded ZIP.

- [ ] **Step 3: Run project type and lint checks**

Run: `pnpm typecheck && pnpm lint`

Expected: PASS with no new diagnostics.

- [ ] **Step 4: Inspect the final diff for scope and remove dead code**

Run: `git diff HEAD~5 --stat`

Remove unused helpers, stale comments, and duplicate template styles introduced during implementation. Keep the shared paginator and one template as the only carousel-specific abstractions.

- [ ] **Step 5: Commit verified cleanup if needed**

```bash
git add app server shared test tests package.json pnpm-lock.yaml
git commit -m "chore: finalize carousel export"
```
