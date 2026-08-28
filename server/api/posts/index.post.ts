import * as v from "valibot";
import { postService } from "~~/server/services/posts.service";
import { apiCreatePostSchema } from "~~/shared/types/post";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const body = await readValidatedBody(event, (data) =>
    v.parse(apiCreatePostSchema, data)
  );
  return {
    success: true,
    data: await postService.create(user, body),
  };
});
