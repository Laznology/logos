import { postService } from "~~/server/services/posts.service";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const query = getQuery(event);
  const searchQuery = String(query.q || "").trim();

  if (searchQuery) {
    return await postService.search(user, searchQuery);
  }

  return await postService.list(user);
});
