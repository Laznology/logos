import { postService } from "~~/server/services/posts.service";
import { extractHeadingsAndHTML } from "~~/server/utils/tiptap-renderer";

export default defineEventHandler(async () => {
  const posts = await postService.listPublicPosts();

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

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        preview,
        wordCount,
        readingTime,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        author: p.author,
      };
    }),
  };
});
