import { postService } from "~~/server/services/posts.service";
import type { PostStatus } from "~~/shared/types/post-status";
import { POST_STATUS_VALUES } from "~~/shared/types/post-status";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const query = getQuery(event);
  const searchQuery = String(query.q || "").trim();
  const status = String(query.status || "");
  const authorId = String(query.author || "").trim();
  if (status && !POST_STATUS_VALUES.includes(status as PostStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid post status",
    });
  }
  const filters = {
    status: status ? (status as PostStatus) : undefined,
    authorId: authorId || undefined,
  };

  if (searchQuery) {
    return await postService.search(user, searchQuery, filters);
  }

  return await postService.list(user, filters);
});
