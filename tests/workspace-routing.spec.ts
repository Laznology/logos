import { expect, test } from "@nuxt/test-utils/playwright";

test("public workspace routes return 404 for unknown workspaces", async ({
  page,
}) => {
  const home = await page.request.get("/unknown-workspace");
  const post = await page.request.get("/unknown-workspace/unknown-post");

  expect(home.status()).toBe(404);
  expect(post.status()).toBe(404);
});
