import { pageService } from "~~/server/services/pages.service";

export default defineProtectedHandler(
  ["admin", "editor", "user"],
  async (event) => {
    const userId = event.context.user.id;
    const id = getRouterParam(event, "id");
    return {
      success: true,
      data: await pageService.getById(id!, userId),
    };
  }
);
