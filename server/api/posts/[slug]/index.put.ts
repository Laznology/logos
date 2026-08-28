import * as v from "valibot";
import { postService } from "~~/server/services/posts.service";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const slug = getRouterParam(event, "slug");
  const input = await readValidatedBody(event, (data) =>
    v.parse(updatePostSchema, data)
  );
  return {
    success: true,
    data: await postService.update(slug!, user, input),
  };
});
