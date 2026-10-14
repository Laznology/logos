import { siteSettingsService } from "~~/server/services/settings.service";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  return siteSettingsService.get(user.organizationId);
});
