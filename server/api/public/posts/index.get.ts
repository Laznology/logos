import { postService } from "~~/server/services/posts.service";
import { extractHeadingsAndHTML } from "~~/server/utils/tiptap-renderer";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const tag =
    typeof query.tag === "string" && query.tag.trim()
      ? query.tag.trim()
      : undefined;
  const search =
    typeof query.q === "string" && query.q.trim() ? query.q.trim() : undefined;

  const posts = await postService.listPublicPosts(tag, search);

  return {
    success: true,
    data: posts.map((p) => {
      const { wordCount, readingTime, markdown } = extractHeadingsAndHTML(
        p.content
      );
      const preview = markdown
        .replaceAll(/[#*`_~[\]()]/g, " ")
        .replaceAll(/\s+/g, " ")
        .trim()
        .slice(0, 200);

      const metadata = (p.metadata as Record<string, unknown>) || {};
      const tags = Array.isArray(metadata.tags)
        ? (metadata.tags as string[]).filter(Boolean)
        : [];

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        preview,
        wordCount,
        readingTime,
        tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        author: p.author,
      };
    }),
  };
});
