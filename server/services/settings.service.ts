import { and, eq, sql } from "drizzle-orm";
import { db } from "hub:db";
import { memberTable, organizationTable } from "hub:db:schema";
import type { SiteSettings } from "~~/shared/types/settings";
import { DEFAULT_SITE_SETTINGS } from "~~/shared/types/settings";

type WorkspaceFlags = Pick<
  SiteSettings,
  "graphEnabledByDefault" | "registrationEnabled"
>;

const DEFAULT_FLAGS: WorkspaceFlags = {
  graphEnabledByDefault: DEFAULT_SITE_SETTINGS.graphEnabledByDefault,
  registrationEnabled: DEFAULT_SITE_SETTINGS.registrationEnabled,
};

const MANAGER_ROLES = new Set(["owner", "admin"]);
const RESERVED_WORKSPACE_SLUGS = new Set([
  "login",
  "register",
  "studio",
  "api",
  "posts",
  "images",
]);

function parseFlags(raw: string | null): WorkspaceFlags {
  try {
    return {
      ...DEFAULT_FLAGS,
      ...(JSON.parse(raw ?? "{}") as Partial<WorkspaceFlags>),
    };
  } catch {
    return DEFAULT_FLAGS;
  }
}

function toSettings(org: {
  name: string;
  logo: string | null;
  metadata: string | null;
}): SiteSettings {
  return { title: org.name, logo: org.logo, ...parseFlags(org.metadata) };
}

export const siteSettingsService = {
  async getPublicWorkspace(slug: string) {
    if (RESERVED_WORKSPACE_SLUGS.has(slug)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Workspace not found",
      });
    }

    const [org] = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.slug, slug))
      .limit(1);

    if (org !== undefined) {
      return { id: org.id, slug: org.slug, settings: toSettings(org) };
    }

    const [alias] = await db
      .select()
      .from(organizationTable)
      .where(sql`exists (
        select 1 from json_each(
          case when json_valid(${organizationTable.metadata})
            then ${organizationTable.metadata} else '{}' end,
          '$.previousSlugs'
        ) where json_each.value = ${slug}
      )`)
      .limit(1);

    if (alias !== undefined) {
      return { id: alias.id, slug: alias.slug, settings: toSettings(alias) };
    }

    throw createError({
      statusCode: 404,
      statusMessage: "Workspace not found",
    });
  },

  async get(organizationId: string | null): Promise<SiteSettings> {
    if (!organizationId) {
      return DEFAULT_SITE_SETTINGS;
    }

    const [org] = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, organizationId))
      .limit(1);

    return org ? toSettings(org) : DEFAULT_SITE_SETTINGS;
  },

  async update(
    user: { id: string; organizationId: string | null },
    settings: SiteSettings
  ): Promise<SiteSettings> {
    const { id: userId, organizationId } = user;
    if (!organizationId) {
      throw createError({ statusCode: 400, statusMessage: "No workspace" });
    }

    const [member] = await db
      .select({ role: memberTable.role })
      .from(memberTable)
      .where(
        and(
          eq(memberTable.organizationId, organizationId),
          eq(memberTable.userId, userId)
        )
      )
      .limit(1);
    if (!member || !MANAGER_ROLES.has(member.role)) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    const [current] = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, organizationId))
      .limit(1);
    if (!current) {
      throw createError({ statusCode: 404, statusMessage: "Not found" });
    }

    const title = settings.title?.trim() ?? "";
    const logo = settings.logo?.trim() ?? "";
    const metadata = {
      ...parseFlags(current.metadata),
      graphEnabledByDefault: settings.graphEnabledByDefault,
      registrationEnabled: settings.registrationEnabled,
    };

    const [row] = await db
      .update(organizationTable)
      .set({
        name: title.length > 0 ? title : current.name,
        logo: logo.length > 0 ? logo : null,
        metadata: JSON.stringify(metadata),
      })
      .where(eq(organizationTable.id, organizationId))
      .returning();

    return toSettings(row ?? current);
  },
};
