import type { SQL } from "drizzle-orm";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "hub:db";
import { postTable, userTable } from "hub:db:schema";

const POST_NOT_FOUND_MSG = "Post not found";

interface PostFilters {
  status?: "draft" | "published";
  authorId?: string;
}

const getAuthCondition = (user: AuthUser) => {
  if (user.role === "admin" || user.role === "editor") {
    return undefined;
  }
  return eq(postTable.userId, user.id);
};

const getFilterCondition = ({ status, authorId }: PostFilters) => {
  let statusCondition: SQL<unknown> | undefined;
  if (status === "published") {
    statusCondition = sql`json_extract(${postTable.metadata}, '$.status') = 'published'`;
  } else if (status === "draft") {
    statusCondition = sql`coalesce(json_extract(${postTable.metadata}, '$.status'), 'draft') != 'published'`;
  }
  return and(
    authorId ? eq(postTable.userId, authorId) : undefined,
    statusCondition
  );
};
const toAvatarUrl = (avatar: string | null) =>
  avatar ? `/images/${avatar}` : null;

const withAuthorAvatarUrl = <
  T extends { author: { avatar: string | null } | null },
>(
  post: T
): T => {
  if (!post.author) {
    return post;
  }
  return {
    ...post,
    author: {
      ...post.author,
      avatar: toAvatarUrl(post.author.avatar),
    },
  } as T;
};

class PostService {
  private readonly database: typeof db;
  constructor(database: typeof db) {
    this.database = database;
  }
  async list(user: AuthUser, filters: PostFilters = {}) {
    const posts = await this.database
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
      .where(and(getAuthCondition(user), getFilterCondition(filters)))
      .orderBy(desc(postTable.createdAt));
    return posts.map(withAuthorAvatarUrl);
  }

  private async _getPostBase(condition: SQL<unknown> | undefined) {
    const posts = await this.database
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
    return posts.map(withAuthorAvatarUrl);
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

  async search(user: AuthUser, query: string, filters: PostFilters = {}) {
    const posts = await this.database
      .select({
        id: postTable.id,
        title: postTable.title,
        slug: postTable.slug,
        metadata: postTable.metadata,
        createdAt: postTable.createdAt,
        author: {
          id: userTable.id,
          name: userTable.name,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(userTable.id, postTable.userId))
      .where(
        and(
          getAuthCondition(user),
          getFilterCondition(filters),
          sql`${postTable.id} IN (
            SELECT id FROM posts_fts
            WHERE posts_fts MATCH ${query}
            ORDER BY rank
          )`
        )
      )
      .limit(20);
    return posts.map(withAuthorAvatarUrl);
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

  async listPublicPosts(tag?: string, search?: string) {
    // ponytail: SQLite json_each for json array tag lookup without junction table
    const conditions = [
      sql`json_extract(${postTable.metadata}, '$.status') = 'published'`,
    ];
    if (tag) {
      conditions.push(
        sql`exists (select 1 from json_each(${postTable.metadata}, '$.tags') where json_each.value = ${tag})`
      );
    }
    if (search) {
      const sanitized = search.replaceAll(/["*]/g, "").trim();
      if (sanitized) {
        const ftsQuery = `"${sanitized}"*`;
        conditions.push(
          sql`${postTable.id} IN (
            SELECT id FROM posts_fts
            WHERE posts_fts MATCH ${ftsQuery}
            ORDER BY rank
          )`
        );
      }
    }

    const posts = await this.database
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
      .where(and(...conditions))
      .orderBy(desc(postTable.createdAt));
    return posts.map(withAuthorAvatarUrl);
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

    return withAuthorAvatarUrl(post);
  }
}

export const postService = new PostService(db);
