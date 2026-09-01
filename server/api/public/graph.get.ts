import { postService } from "~~/server/services/posts.service";
import { buildPostGraph } from "~~/shared/types/graph";

export default defineEventHandler(async () => {
  const posts = await postService.listPublicPosts();
  return { success: true, data: buildPostGraph(posts) };
});
