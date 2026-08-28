import * as v from "valibot";
import { profileService } from "~~/server/services/profile.service";
import { requireValidSession } from "~~/server/utils/session";

import { updateProfileSchema } from "#shared/types/auth";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const body = await readValidatedBody(event, (data) =>
    v.parse(updateProfileSchema, data)
  );
  return {
    success: true,
    data: await profileService.updateName(user.id, body.name),
  };
});
