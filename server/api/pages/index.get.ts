import { pageService } from "~~/server/services/pages.service";

export default defineProtectedHandler(
  ["admin", "editor", "user"],
  async (event) => {
    const userId = event.context.user.id;
    const query = getQuery(event);
    const searchQuery = String(query.q || "").trim();

    if (searchQuery) {
      return await pageService.search(userId, searchQuery);
    }

    return await pageService.listByUser(userId);
  }
);
