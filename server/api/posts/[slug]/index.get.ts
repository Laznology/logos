import { postService } from "~~/server/services/posts.service";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required",
    });
  }
  const post = await postService.getBySlug(user, slug);
  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: "Post not found",
    });
  }
  return { success: true, data: post };
});
