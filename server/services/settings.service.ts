import { eq } from "drizzle-orm";
import { db } from "hub:db";
import { siteSettingsTable } from "hub:db:schema";
import type { SiteSettings } from "~~/shared/types/settings";
import { DEFAULT_SITE_SETTINGS } from "~~/shared/types/settings";

const SITE_SETTINGS_ID = 1;

export const siteSettingsService = {
  async get(): Promise<SiteSettings> {
    await db
      .insert(siteSettingsTable)
      .values({
        id: SITE_SETTINGS_ID,
        ...DEFAULT_SITE_SETTINGS,
      })
      .onConflictDoNothing();

    const [row] = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.id, SITE_SETTINGS_ID))
      .limit(1);

    if (!row) {
      return DEFAULT_SITE_SETTINGS;
    }

    return {
      title: row.title,
      logo: row.logo,
      graphEnabledByDefault: row.graphEnabledByDefault,
      registrationEnabled: row.registrationEnabled,
    };
  },

  async update(settings: SiteSettings): Promise<SiteSettings> {
    const title = settings.title?.trim() || null;
    const logo = settings.logo?.trim() || null;

    const [row] = await db
      .update(siteSettingsTable)
      .set({
        title,
        logo,
        graphEnabledByDefault: settings.graphEnabledByDefault,
        registrationEnabled: settings.registrationEnabled,
        updatedAt: new Date(),
      })
      .where(eq(siteSettingsTable.id, SITE_SETTINGS_ID))
      .returning();

    if (row) {
      return {
        title: row.title,
        logo: row.logo,
        graphEnabledByDefault: row.graphEnabledByDefault,
        registrationEnabled: row.registrationEnabled,
      };
    }

    const saved = { ...settings, title, logo };
    await db.insert(siteSettingsTable).values({
      id: SITE_SETTINGS_ID,
      ...saved,
    });

    return saved;
  },
};
