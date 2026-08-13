import { pageService } from "~~/server/services/pages.service";

export default defineProtectedHandler(
  ["admin", "editor", "user"],
  async (event) => {
    const userId = event.context.user.ideas;
    const slug = getRouterParam(event, "slug");
    await pageService.delete(slug!, userId);
  }
);
