# Carousel export design

## Purpose

Add a carousel mode to the existing post editor. Authors write rich content and media in the existing WYSIWYG editor, insert `/slide` boundaries, preview the fixed Logos carousel layout, and download a ZIP containing one PNG per carousel frame.

This is an editor mode, not a new document type. Existing article posts and the current article editor remain unchanged.

## Decisions

### Mode and persistence

Store the mode in the existing post metadata JSON:

```json
{ "editorMode": "carousel" }
```

Posts without this value remain articles. Switching back to Article does not delete content or carousel separators.

The post content remains Tiptap JSON. No database migration or second content column is required.

### Slide separator

Add a custom Tiptap block node named `carouselSeparator` and expose it through the slash menu as `/slide`.

The separator is an editor-only boundary. It renders as a clear page-break marker while editing and is not included in exported slide content. Consecutive separators produce no empty PNG.

### Fixed visual template

Use one carousel template source for the editor preview and export rendering. The visual direction follows the existing Logos brand: editorial typography, neutral surfaces, restrained primary accent, and no user-configurable theme controls in the first version.

Every frame is 1080×1440 px (3:4). The export always contains:

- `cover.png`: generated from the post title;
- `slide-01.png`, `slide-02.png`, and so on: generated from the post body.

An empty title uses `Untitled`. The cover is derived metadata, not an editable content block.

Supported visual content matches the existing editor contract: headings, paragraphs, bold, italic, text color, highlights, lists, links, and uploaded images. Unsupported nodes fail clearly during export instead of being silently omitted.

### Overflow

Explicit `/slide` separators are the primary boundaries. Content that exceeds one frame is split into continuation frames.

Splitting prefers complete block boundaries: paragraphs, headings, list items, and images. A paragraph that cannot fit as one block is split at a text boundary while preserving inline marks where possible. Text is never reduced below the template's readable minimum merely to keep it on one frame.

Empty groups are skipped. If the body has content but no separator, it produces one body slide. If the body is empty, export is rejected with a user-facing error.

## Components and data flow

### Editor

The existing `PostEditorPage.client.vue` gains:

- an Article/Carousel mode toggle;
- carousel-specific editor presentation;
- the `carouselSeparator` extension;
- `/slide` in the existing suggestion menu;
- an `Export Carousel` action visible only in carousel mode.

The current auto-save path continues to persist `metadata` and `content`. The toggle saves `editorMode` through that same path.

The carousel template component is the single layout definition used to show each frame in the WYSIWYG editor and to supply the render surface for export. The editor displays each grouped frame as a fixed-ratio canvas, with the separator marker between canvases. Uploaded images render in place.

### Export endpoint

Add an authenticated admin/editor endpoint following existing post API conventions:

```text
GET /api/admin/posts/:slug/carousel-export
```

The handler:

1. authenticates the request and verifies access to the post;
2. verifies `metadata.editorMode === "carousel"`;
3. validates title and Tiptap JSON;
4. generates the cover model and body slide models;
5. renders every model through the fixed carousel template at 1080×1440;
6. packages all PNG buffers into a ZIP;
7. returns the ZIP with an attachment filename based on the slug.

The ZIP writer uses a small established archive dependency when the runtime has no portable native ZIP API. Do not maintain an ad-hoc ZIP implementation.

### Rendering

Reuse the already-installed Takumi rendering stack. The exported template must use deterministic dimensions, styles, and asset URLs. Image loading errors abort the whole export; no partial ZIP is returned.

The server returns a binary response only after every frame is rendered successfully. The client converts the response into a download and releases the object URL afterward.

## Error and state behavior

- Export button is disabled outside carousel mode.
- Export shows a pending state and prevents duplicate requests.
- Empty body: reject with a clear “add content before exporting” message.
- Invalid or unsupported content: reject with a clear export error.
- Missing post: existing not-found behavior.
- Unauthorized request: existing `401/403` behavior.
- Failed image load or render: return an error and no partial archive.
- Export failure preserves editor content and shows a toast.
- Successful export downloads `<slug>-carousel.zip` immediately.

## Testing

Tests defend observable contracts rather than implementation details.

### Unit tests

- separator node serializes and parses in Tiptap JSON;
- `/slide` inserts one separator at the current cursor;
- content groups split at separators;
- consecutive and leading/trailing separators do not create empty slides;
- oversized content becomes ordered continuation slides;
- inline marks survive text splitting where supported;
- generated filenames are ordered and stable;
- cover uses title and falls back to `Untitled`;
- article-mode metadata remains unchanged when carousel mode is absent.

### Server tests

- authorized carousel export returns a ZIP response;
- ZIP contains `cover.png` and every expected slide PNG;
- post content order is preserved in archive order;
- article-mode posts are rejected;
- empty body is rejected;
- missing post and unauthorized users receive the existing error status;
- failed rendering does not return a partial ZIP.

### UI/E2E smoke test

Create or open a carousel post, switch to Carousel mode, enter rich text and an image, insert `/slide`, trigger export, and verify that the browser downloads the ZIP. Keep this as one end-to-end path; lower-level rules stay in unit/server tests.

## Scope exclusions

Not included in the first version:

- multiple templates;
- custom dimensions, fonts, colors, or branding controls;
- editable cover content;
- carousel publishing as a separate public content type;
- PDF, video, or one-long-image export;
- background export jobs or persistent generated assets.
