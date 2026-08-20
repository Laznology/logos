# Nuxt best-practices refactor

## Goal

Align date rendering and NuxtHub database imports with current Nuxt 4 and NuxtHub conventions. Remove non-JSDoc source comments without changing runtime behavior.

## Scope

- Replace manual date formatting in `app/pages/index.vue` and `app/pages/posts/[slug].vue` with `NuxtTime`.
- Render the footer copyright year through `NuxtTime`.
- Normalize server database imports to `hub:db` and `hub:db:schema`.
- Remove non-JSDoc comments from application, server, configuration, and component source files.
- Preserve `CompletionOptions` JSDoc and Drizzle migration `--> statement-breakpoint` markers.

## Date rendering

Use `NuxtTime` with the existing `en-US` locale and `month="long"`, `day="numeric"`, and `year="numeric"` options for post dates. This preserves current visible formatting while producing semantic `<time>` markup with SSR/client consistency. Use `NuxtTime` with `year="numeric"` for the copyright year.

Remove `formatDate` and `formattedDate`, which become redundant.

## NuxtHub imports

Use NuxtHub virtual imports consistently:

- `hub:db` for `db`.
- `hub:db:schema` for table definitions.

Migrate the current `@nuxthub/db` and `@nuxthub/db/schema` call sites. Do not change queries, schema, API responses, or storage behavior.

## Comment policy

Delete line, block, and Vue template comments that are not JSDoc. Keep JSDoc documentation in `CompletionExtension.ts`. Do not edit generated SQL migration markers because the markers delimit Drizzle statements.

## Share popover preview

Prevent Reka UI's open autofocus through the `UPopover` content configuration so opening the published-link popover does not focus or select the read-only URL input.

Replace the synthetic title card with a constrained live preview:

- Published posts render the public `/posts/:slug` page in an iframe.
- Draft posts render the current Markdown content with the existing `marked` dependency inside a constrained, scrollable prose container.

The draft preview follows `post.content`; it does not add a second TipTap editor, an API call, or publishing state changes.

## Verification

Run type checking and linting. Start the Nuxt application and inspect public post-list and post-detail pages to confirm dates retain their existing format and render without hydration warnings. Open the share popover for a draft and a published post: confirm neither selects the URL, the draft preview follows current Markdown, and the published preview loads the public page.
