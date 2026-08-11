import { db } from "@nuxthub/db";
import { pageTable } from "@nuxthub/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

class PageService {
  private readonly database: typeof db;
  constructor(database: typeof db) {
    this.database = database;
  }
  async listByUser(userId: string) {
    return await this.database
      .select({
        id: pageTable.id,
        title: pageTable.title,
        slug: pageTable.slug,
        metadata: pageTable.metadata,
        createdAt: pageTable.createdAt,
      })
      .from(pageTable)
      .where(eq(pageTable.userId, userId))
      .orderBy(desc(pageTable.createdAt));
  }

  async search(userId: string, query: string) {
    const sanitize = query.trim().replaceAll(/['"]/g, "");
    if (!sanitize) {
      return [];
    }
    const result = await this.database.run(
      sql`
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.metadata,
          p.created_at as createdAt,
          p.updated_at as updatedAt,
          snippet(pages_fts, 2, '<mark>', '</mark>', '...', 15) as snippet
        FROM pages_fts fts
        JOIN pages p ON p.id = fts.id
        WHERE pages_fts MATCH ${`${sanitize}*`}
        AND p.user_id = ${userId}
        ORDER BY p.updated_at DESC
        LIMIT 20;
      `
    );
    return result.rows || [];
  }

  async getById(id: string, userId: string) {
    const [page] = await this.database
      .select({
        id: pageTable.id,
        title: pageTable.title,
        slug: pageTable.slug,
        content: pageTable.content,
        metadata: pageTable.metadata,
        createdAt: pageTable.createdAt,
        updatedAt: pageTable.updatedAt,
      })
      .from(pageTable)
      .where(and(eq(pageTable.id, id), eq(pageTable.userId, userId)))
      .limit(1);

    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: "Page not found",
      });
    }
    return page;
  }

  async create(userId: string, input?: Partial<PageInsertType>) {
    const rawTitle = input?.title?.trim() || "Untitled";
    const randomHash = Math.random().toString(36).slice(2, 8);
    const generatedSlug = `${slugify(rawTitle)}-${randomHash}`;

    const [newPage] = await this.database
      .insert(pageTable)
      .values({
        ...input,
        userId,
        title: rawTitle,
        slug: generatedSlug,
        metadata: input?.metadata || { status: "draft" },
        content: input?.content,
      })
      .returning();

    return newPage;
  }

  async update(id: string, userId: string, input: PageUpdateType) {
    await this.getById(id, userId);
    const updateData: Partial<typeof pageTable.$inferInsert> = {
      ...input,
      updatedAt: new Date(),
    };

    const [updatedPage] = await this.database
      .update(pageTable)
      .set(updateData)
      .where(and(eq(pageTable.id, id), eq(pageTable.userId, userId)))
      .returning();
    return updatedPage;
  }

  async delete(id: string, userId: string) {
    await this.getById(id, userId);
    await this.database
      .delete(pageTable)
      .where(and(eq(pageTable.id, id), eq(pageTable.userId, userId)));
    return { success: true, id };
  }
}

export const pageService = new PageService(db);
