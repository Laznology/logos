import { postService } from "~~/server/services/posts.service";
import { buildPostGraph } from "~~/shared/types/graph";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const posts = await postService.list(user);
  return { success: true, data: buildPostGraph(posts) };
});
