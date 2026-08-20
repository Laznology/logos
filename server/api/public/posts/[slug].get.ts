import { postService } from "~~/server/services/posts.service";
import { extractHeadingsAndHTML } from "~~/server/utils/tiptap-renderer";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required",
    });
  }

  const post = await postService.getPublicPostBySlug(slug);
  const { html, headings, wordCount, readingTime, markdown } =
    extractHeadingsAndHTML(post.content);

  // If client requests raw markdown (e.g. ?format=raw or /raw)
  const query = getQuery(event);
  if (query.format === "markdown" || query.format === "raw") {
    setHeader(event, "content-type", "text/markdown; charset=utf-8");
    return `# ${post.title}\n\n${markdown}`;
  }

  return {
    success: true,
    data: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: html,
      headings,
      wordCount,
      readingTime,
      markdown,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
    },
  };
});
