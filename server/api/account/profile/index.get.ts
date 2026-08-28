import { profileService } from "~~/server/services/profile.service";
import { requireValidSession } from "~~/server/utils/session";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  return {
    success: true,
    data: await profileService.getProfile(user.id),
  };
});
