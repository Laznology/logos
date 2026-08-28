import * as v from "valibot";
import { profileService } from "~~/server/services/profile.service";
import { requireValidSession } from "~~/server/utils/session";

import { updateEmailSchema } from "#shared/types/auth";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const body = await readValidatedBody(event, (data) =>
    v.parse(updateEmailSchema, data)
  );
  return {
    success: true,
    data: await profileService.updateEmail(user.id, body),
  };
});
