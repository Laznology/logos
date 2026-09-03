import { siteSettingsService } from "~~/server/services/settings.service";

export default defineEventHandler(() => siteSettingsService.get());
