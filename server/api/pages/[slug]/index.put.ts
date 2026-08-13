import { pageService } from "~~/server/services/pages.service";

export default defineProtectedHandler(
  ["admin", "editor", "user"],
  async (event) => {
    const userId = event.context.user?.id;
    const slug = getRouterParam(event, "slug");

    return {
      success: true,
      data: await pageService.delete(slug!, userId),
    };
  }
);
