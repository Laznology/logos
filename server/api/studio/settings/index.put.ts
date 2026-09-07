import * as v from "valibot";
import { siteSettingsService } from "~~/server/services/settings.service";
import { siteSettingsSchema } from "~~/shared/types/settings";

export default defineProtectedHandler(
  async (event) => {
    const settings = await readValidatedBody(event, (data) =>
      v.parse(siteSettingsSchema, data)
    );

    return await siteSettingsService.update(settings);
  },
  ["admin"]
);
