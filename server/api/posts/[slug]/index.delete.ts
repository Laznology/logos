import { postService } from "~~/server/services/posts.service";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required",
    });
  }
  return await postService.delete(slug, user);
});
