import { siteSettingsService } from "~~/server/services/settings.service";

export default defineEventHandler(async (event) => {
  const slug = getQuery(event).workspace;
  if (typeof slug !== "string" || !slug) {
    return await siteSettingsService.get(null);
  }

  const workspace = await siteSettingsService.getPublicWorkspace(slug);
  return {
    ...workspace.settings,
    workspaceId: workspace.id,
    slug: workspace.slug,
  };
});
