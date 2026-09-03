import * as v from "valibot";

export interface SiteSettings {
  graphEnabledByDefault: boolean;
  registrationEnabled: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  graphEnabledByDefault: true,
  registrationEnabled: true,
};

export const siteSettingsSchema = v.object({
  graphEnabledByDefault: v.boolean(),
  registrationEnabled: v.boolean(),
});
