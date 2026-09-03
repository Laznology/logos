import { eq } from "drizzle-orm";
import { db } from "hub:db";
import { siteSettingsTable } from "hub:db:schema";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "~~/shared/types/settings";

const SITE_SETTINGS_ID = 1;

class SiteSettingsService {
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
      graphEnabledByDefault: row.graphEnabledByDefault,
      registrationEnabled: row.registrationEnabled,
    };
  }

  async update(settings: SiteSettings): Promise<SiteSettings> {
    const [row] = await db
      .update(siteSettingsTable)
      .set({
        graphEnabledByDefault: settings.graphEnabledByDefault,
        registrationEnabled: settings.registrationEnabled,
        updatedAt: new Date(),
      })
      .where(eq(siteSettingsTable.id, SITE_SETTINGS_ID))
      .returning();

    if (row) {
      return {
        graphEnabledByDefault: row.graphEnabledByDefault,
        registrationEnabled: row.registrationEnabled,
      };
    }

    await db.insert(siteSettingsTable).values({
      id: SITE_SETTINGS_ID,
      ...settings,
    });

    return settings;
  }
}

export const siteSettingsService = new SiteSettingsService();
