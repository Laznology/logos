import * as v from "valibot";

export interface SiteSettings {
  title: string | null;
  logo: string | null;
  graphEnabledByDefault: boolean;
  registrationEnabled: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  title: null,
  logo: null,
  graphEnabledByDefault: true,
  registrationEnabled: true,
};

export const siteSettingsSchema = v.object({
  title: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200))), null),
  logo: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2048))), null),
  graphEnabledByDefault: v.boolean(),
  registrationEnabled: v.boolean(),
});
