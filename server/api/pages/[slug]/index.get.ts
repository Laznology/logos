import { pageService } from "~~/server/services/pages.service";

export default defineProtectedHandler(
  ["admin", "editor", "user"],
  async (event) => {
    const slug = getRouterParam(event, "slug");
    const userId = event.context.user.id;

    return {
      success: true,
      data: await pageService.getBySlug(userId, slug!),
    };
  }
);
