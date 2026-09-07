# Site settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-controlled global defaults for public post graph visibility and account registration.

**Architecture:** Store both flags in one SQLite singleton row. Expose a narrow public read endpoint and admin-only read/write endpoints. Reuse the existing Preferences tab, public post detail page, login page, registration page, and sign-up handler; no new dependency or generic settings framework.

**Tech Stack:** Nuxt 4, Vue 3, Nuxt UI 4, Nitro handlers, Drizzle SQLite, Vitest/Nuxt Test Utils.

## Global Constraints

- Graph disabled by default means hidden initially but still manually openable through the existing Graph action.
- Registration disabled must be enforced by the server, not only by hidden links or form UI.
- Defaults preserve current behavior: graph enabled and registration enabled.
- Only the `admin` role may update global settings.
- No per-user settings, new dependency, or graph endpoint redesign.

---

### Task 1: Add singleton settings persistence

**Files:**

- Modify: `server/db/schema.ts`
- Create: generated SQLite migration under `server/db/migrations/sqlite/`
- Create: `shared/types/settings.ts`
- Create: `server/services/settings.service.ts`
- Test: `test/unit/site-settings.test.ts`

**Interfaces:**

- Produces `SiteSettings`, `DEFAULT_SITE_SETTINGS`, `siteSettingsService.get()`, and `siteSettingsService.update(input)` for later API handlers.

- [ ] **Step 1: Write the failing test**

Add a unit test for the public settings shape and defaults:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_SETTINGS } from "../../shared/types/settings";

describe("site settings defaults", () => {
  it("keeps graph and registration enabled by default", () => {
    expect(DEFAULT_SITE_SETTINGS).toEqual({
      graphEnabledByDefault: true,
      registrationEnabled: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest --project unit test/unit/site-settings.test.ts` Expected: FAIL because `shared/types/settings.ts` does not exist.

- [ ] **Step 3: Add shared settings types and schema**

Add the two-flag interface and defaults. Add `siteSettingsTable` with fixed singleton id `1`, integer booleans defaulting to `1`, and `updatedAt` matching the existing timestamp convention. Add service methods that insert the default row when absent, convert SQLite integers to booleans, and update the singleton row.

- [ ] **Step 4: Generate and apply the migration**

Run: `pnpm db:generate` Expected: one new SQLite migration creating `site_settings`.

Run: `pnpm db:migrate` Expected: migration applies without error.

- [ ] **Step 5: Run the unit test**

Run: `pnpm vitest --project unit test/unit/site-settings.test.ts` Expected: PASS.

- [ ] **Step 6: Commit persistence**

```bash
git add server/db/schema.ts server/db/migrations/sqlite shared/types/settings.ts server/services/settings.service.ts test/unit/site-settings.test.ts
git commit -m "feat: add global site settings storage"
```

### Task 2: Expose public and admin settings APIs

**Files:**

- Create: `server/api/public/settings.get.ts`
- Create: `server/api/admin/settings/index.get.ts`
- Create: `server/api/admin/settings/index.put.ts`
- Create or modify: `shared/types/settings.ts`
- Test: `test/nuxt/site-settings-api.test.ts`

**Interfaces:**

- Consumes `siteSettingsService` from Task 1.
- Produces `GET /api/public/settings`, `GET /api/admin/settings`, and `PUT /api/admin/settings`.

- [ ] **Step 1: Write failing API tests**

Cover these real contracts: public GET returns both booleans, PUT accepts two booleans and returns them, and malformed values are rejected. Cover the authorization rule through the existing protected-handler convention: admin succeeds; non-admin receives 403.

- [ ] **Step 2: Run API tests to verify red**

Run: `pnpm vitest --project nuxt test/nuxt/site-settings-api.test.ts` Expected: FAIL because the handlers do not exist.

- [ ] **Step 3: Implement the handlers**

Return only the two public booleans from the public endpoint. Protect both admin endpoints with `defineProtectedHandler(handler, ["admin"])`. Validate the PUT body with a Valibot schema requiring booleans, then call `siteSettingsService.update`.

- [ ] **Step 4: Run API tests to verify green**

Run: `pnpm vitest --project nuxt test/nuxt/site-settings-api.test.ts` Expected: PASS.

- [ ] **Step 5: Commit API**

```bash
git add server/api/public/settings.get.ts server/api/admin/settings shared/types/settings.ts test/nuxt/site-settings-api.test.ts
git commit -m "feat: expose admin site settings api"
```

### Task 3: Gate graph default and registration flow

**Files:**

- Modify: `app/pages/posts/[slug].vue`
- Modify: `app/pages/register.vue`
- Modify: `app/pages/login.vue`
- Modify: `server/api/auth/sign-up/index.post.ts`
- Test: `test/nuxt/site-settings-ui.test.ts`

**Interfaces:**

- Consumes `GET /api/public/settings` and the existing Graph action/modal.
- Consumes `GET /api/public/settings` and protects the existing sign-up POST.

- [ ] **Step 1: Write failing UI/flow tests**

Assert that a disabled graph default does not render the desktop graph initially while the Graph action remains present. Assert that disabled registration renders the unavailable state, removes the login Sign Up link, and makes the sign-up handler reject with 403.

- [ ] **Step 2: Run tests to verify red**

Run: `pnpm vitest --project nuxt test/nuxt/site-settings-ui.test.ts` Expected: FAIL because post detail always renders the graph and registration is unconditional.

- [ ] **Step 3: Implement graph behavior**

Fetch public settings in the post detail page. Keep the Graph button and modal. Gate only the inline desktop graph with `graphEnabledByDefault`; clicking Graph still opens the modal using the existing graph data.

- [ ] **Step 4: Implement registration enforcement and UI**

Read public settings in login/register. Hide the login Sign Up link and replace the register form with a link back to login when disabled. Check `registrationEnabled` at the start of the sign-up handler and throw HTTP 403 before creating a user.

- [ ] **Step 5: Run flow tests to verify green**

Run: `pnpm vitest --project nuxt test/nuxt/site-settings-ui.test.ts` Expected: PASS.

- [ ] **Step 6: Commit public behavior**

```bash
git add app/pages/posts/[slug].vue app/pages/register.vue app/pages/login.vue server/api/auth/sign-up/index.post.ts test/nuxt/site-settings-ui.test.ts
git commit -m "feat: apply public site settings"
```

### Task 4: Add admin controls in Preferences

**Files:**

- Modify: `app/components/admin/settings/PreferencesTab.vue`
- Test: `test/nuxt/admin-settings.test.ts`

**Interfaces:**

- Consumes `GET /api/admin/settings` and `PUT /api/admin/settings`.
- Produces two labeled switches and one Save action for admin users.

- [ ] **Step 1: Write failing component tests**

Mount the Preferences tab with an admin session and assert both labeled switches load from the API, Save sends both booleans, and a non-admin does not render the Workspace settings section.

- [ ] **Step 2: Run tests to verify red**

Run: `pnpm vitest --project nuxt test/nuxt/admin-settings.test.ts` Expected: FAIL because Workspace settings are not rendered.

- [ ] **Step 3: Implement the controls**

Keep the existing Theme and Sidebar sections. Add an admin-only Workspace settings section with `Show graph by default` and `Allow public registration` switches, disabled while loading, plus one Save button with pending and error feedback. Refresh the local values after a successful save and show a toast.

- [ ] **Step 4: Run component tests to verify green**

Run: `pnpm vitest --project nuxt test/nuxt/admin-settings.test.ts` Expected: PASS.

- [ ] **Step 5: Commit admin controls**

```bash
git add app/components/admin/settings/PreferencesTab.vue test/nuxt/admin-settings.test.ts
git commit -m "feat: add admin workspace settings"
```

### Task 5: Verify the complete feature

**Files:**

- Test: existing unit and Nuxt test projects

- [ ] **Step 1: Run focused tests**

Run: `pnpm vitest --project unit test/unit/site-settings.test.ts`

Run: `pnpm vitest --project nuxt test/nuxt/site-settings-api.test.ts test/nuxt/site-settings-ui.test.ts test/nuxt/admin-settings.test.ts`

Expected: all focused tests pass.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck` Expected: `Type check passed`.

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test` Expected: all configured unit and Nuxt tests pass.

- [ ] **Step 4: Smoke-test the real flows**

Run the app, sign in as admin, open Account settings → Preferences, toggle both settings, save, then verify:

- graph off hides only the initial inline graph and Graph still opens it;
- registration off removes registration entry points and direct signup is rejected;
- toggling both back on restores current behavior.

- [ ] **Step 5: Commit any verification-only fixes**

```bash
git add .
git commit -m "test: verify global site settings flows"
```
