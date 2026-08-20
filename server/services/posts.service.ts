import { db } from "hub:db";
import { postTable, userTable } from "hub:db:schema";
import type { SQL } from "drizzle-orm";
import { and, desc, eq, sql } from "drizzle-orm";

const POST_NOT_FOUND_MSG = "Post not found";

const getAuthCondition = (user: AuthUser) => {
  if (user.role === "admin" || user.role === "editor") {
    return undefined;
  }
  return eq(postTable.userId, user.id);
};

class PostService {
  private readonly database: typeof db;
  constructor(database: typeof db) {
    this.database = database;
  }
  async list(user: AuthUser) {
    return await this.database
      .select({
        id: postTable.id,
        title: postTable.title,
        slug: postTable.slug,
        content: postTable.content,
        metadata: postTable.metadata,
        createdAt: postTable.createdAt,
        updatedAt: postTable.updatedAt,
        author: {
          id: userTable.id,
          name: userTable.name,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(userTable.id, postTable.userId))
      .where(getAuthCondition(user))
      .orderBy(desc(postTable.createdAt));
  }

  private async _getPostBase(condition: SQL<unknown> | undefined) {
    return await this.database
      .select({
        id: postTable.id,
        title: postTable.title,
        slug: postTable.slug,
        content: postTable.content,
        metadata: postTable.metadata,
        createdAt: postTable.createdAt,
        updatedAt: postTable.updatedAt,
        author: {
          name: userTable.name,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(userTable.id, postTable.userId))
      .where(condition)
      .limit(1);
  }

  async getBySlug(user: AuthUser, slug: string) {
    const condition = and(eq(postTable.slug, slug), getAuthCondition(user));
    const [post] = await this._getPostBase(condition);

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: POST_NOT_FOUND_MSG,
      });
    }

    return post;
  }

  async search(user: AuthUser, query: string) {
    return await this.database
      .select({
        id: postTable.id,
        title: postTable.title,
        slug: postTable.slug,
        metadata: postTable.metadata,
        createdAt: postTable.createdAt,
        author: {
          name: userTable.name,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(userTable.id, postTable.userId))
      .where(
        and(
          getAuthCondition(user),
          sql`${postTable.id} IN (
            SELECT rowid FROM posts_fts
            WHERE posts_fts MATCH ${query}
            ORDER BY rank
          )`
        )
      )
      .limit(20);
  }

  async getById(id: string, user: AuthUser) {
    const condition = and(eq(postTable.id, id), getAuthCondition(user));
    const [post] = await this._getPostBase(condition);

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: POST_NOT_FOUND_MSG,
      });
    }

    return post;
  }

  async create(user: AuthUser, input?: Partial<PostInsertType>) {
    const slug = slugify(input?.title || "untitled");
    const [newPost] = await this.database
      .insert(postTable)
      .values({
        title: input?.title || "Untitled",
        slug,
        content: input?.content || "",
        userId: user.id,
        metadata: input?.metadata || {},
      })
      .returning();

    if (!newPost) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create post",
      });
    }

    return newPost;
  }

  async update(slug: string, user: AuthUser, input: PostUpdateType) {
    const currentPost = await this.getBySlug(user, slug);

    let newSlug = currentPost.slug;
    if (input.title && input.title !== currentPost.title) {
      newSlug = slugify(input.title);
    }

    const [updatedPost] = await this.database
      .update(postTable)
      .set({
        title: input.title ?? currentPost.title,
        content: input.content ?? currentPost.content,
        slug: newSlug,
        metadata: input.metadata ?? currentPost.metadata,
        updatedAt: new Date(),
      })
      .where(and(eq(postTable.slug, slug), getAuthCondition(user)))
      .returning();

    if (!updatedPost) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update post",
      });
    }

    return updatedPost;
  }

  async delete(slug: string, user: AuthUser) {
    await this.getBySlug(user, slug);
    await this.database
      .delete(postTable)
      .where(and(eq(postTable.slug, slug), getAuthCondition(user)));
    return { success: true, slug };
  }

  async listPublicPosts() {
    return await this.database
      .select({
        id: postTable.id,
        title: postTable.title,
        slug: postTable.slug,
        content: postTable.content,
        metadata: postTable.metadata,
        createdAt: postTable.createdAt,
        updatedAt: postTable.updatedAt,
        author: {
          name: userTable.name,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(userTable.id, postTable.userId))
      .where(sql`json_extract(${postTable.metadata}, '$.status') = 'published'`)
      .orderBy(desc(postTable.createdAt));
  }

  async getPublicPostBySlug(slug: string) {
    const [post] = await this.database
      .select({
        id: postTable.id,
        title: postTable.title,
        slug: postTable.slug,
        content: postTable.content,
        metadata: postTable.metadata,
        createdAt: postTable.createdAt,
        updatedAt: postTable.updatedAt,
        author: {
          name: userTable.name,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(userTable.id, postTable.userId))
      .where(eq(postTable.slug, slug))
      .limit(1);

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: POST_NOT_FOUND_MSG,
      });
    }

    const metadata = (post.metadata as Record<string, unknown>) || {};
    if (metadata.status !== "published") {
      throw createError({
        statusCode: 404,
        statusMessage: "Post is not published",
      });
    }

    return post;
  }
}

export const postService = new PostService(db);
