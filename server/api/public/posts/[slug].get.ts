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

  const query = getQuery(event);
  if (query.format === "markdown" || query.format === "raw") {
    setHeader(event, "content-type", "text/markdown; charset=utf-8");
    return `# ${post.title}\n\n${markdown}`;
  }

  const metadata = (post.metadata as Record<string, unknown>) || {};
  const tags = Array.isArray(metadata.tags)
    ? (metadata.tags as string[]).filter(Boolean)
    : [];

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
      tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
    },
  };
});
