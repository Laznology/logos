import { postService } from "~~/server/services/posts.service";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const query = getQuery(event);
  const searchQuery = String(query.q || "").trim();
  const status = String(query.status || "");
  const authorId = String(query.author || "").trim();
  if (status && status !== "draft" && status !== "published") {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid post status",
    });
  }
  const filters = {
    status: status as "draft" | "published" | undefined,
    authorId: authorId || undefined,
  };

  if (searchQuery) {
    return await postService.search(user, searchQuery, filters);
  }

  return await postService.list(user, filters);
});
