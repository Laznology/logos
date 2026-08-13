import * as v from "valibot";
import { pageService } from "~~/server/services/pages.service";
import { apiCreatePageSchema } from "~~/shared/types/page";

export default defineProtectedHandler(
  ["admin", "editor", "user"],
  async (event) => {
    const userId = event.context.user.id;
    const body = await readValidatedBody(event, (data) =>
      v.parse(apiCreatePageSchema, data)
    );
    return {
      success: true,
      data: await pageService.create(userId, body),
    };
  }
);
