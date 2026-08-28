import { postService } from "~~/server/services/posts.service";
import { extractHeadingsAndHTML } from "~~/server/utils/tiptap-renderer";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
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
  const previewHtml =
    getQuery(event).preview === "1"
      ? extractHeadingsAndHTML(post.content).html
      : undefined;
  return { success: true, data: post, previewHtml };
});
