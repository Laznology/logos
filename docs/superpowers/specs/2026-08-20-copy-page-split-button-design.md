# Copy page split button

## Goal

Make the `Copy page` control copy the current page as Markdown when its main area is clicked. Reserve the chevron for opening the existing menu.

## Scope

Change `app/pages/posts/[slug].vue` only.

## Interaction

- Render one visual control group with a shared outer border and rounded corners.
- The left `Copy page` button calls the existing `copyPageAsMarkdown()` function.
- The right chevron button is the sole `UDropdownMenu` trigger.
- Keep all existing dropdown items, including `Copy page`, `Copy Markdown link`, and `View as Markdown`.

## Data and errors

Reuse existing clipboard capability checks, Markdown construction, and toast feedback. No API, state, or menu-item changes.

## Verification

Open a public post page. Confirm the main button copies page Markdown and shows its existing success toast. Confirm only the chevron opens the dropdown, and every menu item retains its current behavior.
