import { postService } from "~~/server/services/posts.service";
import { siteSettingsService } from "~~/server/services/settings.service";
import { buildPostGraph } from "~~/shared/types/graph";

export default defineEventHandler(async (event) => {
  const slug = getQuery(event).workspace;
  const workspace =
    typeof slug === "string"
      ? await siteSettingsService.getPublicWorkspace(slug)
      : null;
  const posts = await postService.listPublicPosts(workspace?.id ?? null);
  return { success: true, data: buildPostGraph(posts) };
});
