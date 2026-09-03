export interface SiteSettings {
  graphEnabledByDefault: boolean;
  registrationEnabled: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  graphEnabledByDefault: true,
  registrationEnabled: true,
};
