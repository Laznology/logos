import * as v from "valibot";
import { postService } from "~~/server/services/posts.service";
import { bulkPostActionSchema } from "~~/shared/types/post-status";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const body = await readValidatedBody(event, (data) =>
    v.parse(bulkPostActionSchema, data)
  );
  return await postService.bulkAction(body.ids, user, body.action);
});
