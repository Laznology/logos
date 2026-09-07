import { siteSettingsService } from "~~/server/services/settings.service";

export default defineProtectedHandler(
  () => siteSettingsService.get(),
  ["admin"]
);
