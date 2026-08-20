import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ROLES = ["admin", "editor", "user"] as const;
export type Role = (typeof ROLES)[number];

export const userTable = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    password: text("password"),
    avatar: text("avatar"),
    role: text("role", { enum: ROLES }).$type<Role>().notNull().default("user"),
    provider: text("provider"),
    provider_id: text("provider_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_user_name").on(table.name),
    index("idx_user_role").on(table.role),
  ]
);

export const postTable = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    metadata: text("metadata", { mode: "json" }),
    content: text("content", { mode: "json" }).default({
      type: "doc",
      content: [],
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_post_title").on(table.title),
    index("idx_post_author").on(table.userId),
    index("idx_post_created_at").on(table.createdAt),
    index("idx_post_updated_at").on(table.updatedAt),
  ]
);
