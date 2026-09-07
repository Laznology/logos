import { expect, test } from "@nuxt/test-utils/playwright";

test("exports a carousel ZIP from the editor", async ({ page, goto }) => {
  const stamp = Date.now();
  const username = `author_${stamp}`;
  const email = `author_${stamp}@example.com`;
  const password = "Password123!";

  await goto("/register", { waitUntil: "hydration" });
  await page.getByLabel(/full name/i).fill("Author");
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/email address/i).fill(email);
  await page.getByRole("textbox", { name: /^password/i }).fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL("/");
  await goto("/admin/posts/untitled", { waitUntil: "hydration" });

  await page.getByRole("button", { name: /^carousel$/i }).click();

  const titleInput = page.getByRole("textbox", { name: /post title/i });
  await titleInput.fill("Carousel smoke");

  const editor = page.locator(".tiptap.ProseMirror");
  await editor.click();
  await editor.fill("First slide content");
  await editor.press("Enter");
  await editor.press("/");
  await page.getByText("Slide", { exact: true }).click();
  await editor.type("Second slide content");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export carousel/i }).click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("carousel-smoke-carousel.zip");
});
