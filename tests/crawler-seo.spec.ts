import { expect, test } from "@nuxt/test-utils/playwright";

test("crawler endpoints expose only public pages", async ({ page }) => {
  const [robots, sitemap] = await Promise.all([
    page.request.get("/robots.txt"),
    page.request.get("/sitemap.xml"),
  ]);

  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /admin");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("/admin");
});
