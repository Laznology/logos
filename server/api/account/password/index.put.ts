import * as v from "valibot";
import { profileService } from "~~/server/services/profile.service";
import {
  revokeOtherSessions,
  requireValidSession,
} from "~~/server/utils/session";

import { changePasswordSchema } from "#shared/types/auth";

export default defineProtectedHandler(async (event) => {
  const { user, sessionId } = await requireValidSession(event);
  const body = await readValidatedBody(event, (data) =>
    v.parse(changePasswordSchema, data)
  );

  await profileService.changePassword(user.id, body);
  await revokeOtherSessions(user.id, sessionId);

  return { success: true, message: "Password updated" };
});
