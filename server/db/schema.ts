import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ROLES = ["admin", "editor", "user"] as const;
export type Role = (typeof ROLES)[number];

// ponytail: property names mirror Better Auth's model fields (the drizzle adapter
// matches on them), SQL column names stay snake_case.
export const userTable = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    // ponytail: better-auth's `image` field is remapped to this `avatar`
    // column (see lib/auth.ts), so app code and stored avatars are unchanged.
    avatar: text("avatar"),
    // ponytail: nullable — the admin plugin creates users without a username.
    username: text("username").unique(),
    displayUsername: text("display_username"),
    role: text("role", { enum: ROLES }).$type<Role>().notNull().default("user"),
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp" }),
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

export const sessionTable = sqliteTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_session_user_id").on(table.userId),
    index("idx_session_expires_at").on(table.expiresAt),
  ]
);

export const accountTable = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_account_user_id").on(table.userId)]
);

export const verificationTable = sqliteTable(
  "verifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_verification_identifier").on(table.identifier)]
);

export const organizationTable = sqliteTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_organization_slug").on(table.slug)]
);

export const memberTable = sqliteTable(
  "members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_member_organization_id").on(table.organizationId),
    index("idx_member_user_id").on(table.userId),
  ]
);

export const invitationTable = sqliteTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_invitation_organization_id").on(table.organizationId),
    index("idx_invitation_email").on(table.email),
  ]
);

export const apiKeyTable = sqliteTable(
  "apikeys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    configId: text("config_id").notNull().default("default"),
    name: text("name"),
    start: text("start"),
    referenceId: text("reference_id").notNull(),
    prefix: text("prefix"),
    key: text("key").notNull(),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: integer("last_refill_at", { mode: "timestamp" }),
    enabled: integer("enabled", { mode: "boolean" }).default(true),
    rateLimitEnabled: integer("rate_limit_enabled", {
      mode: "boolean",
    }).default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(3_600_000),
    rateLimitMax: integer("rate_limit_max").default(100),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: integer("last_request", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_apikey_reference_id").on(table.referenceId),
    index("idx_apikey_key").on(table.key),
  ]
);

export const siteSettingsTable = sqliteTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  title: text("title"),
  logo: text("logo"),
  graphEnabledByDefault: integer("graph_enabled_by_default", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  registrationEnabled: integer("registration_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const postTable = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
    }),
    organizationId: text("organization_id").references(
      () => organizationTable.id,
      { onDelete: "cascade" }
    ),
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
    index("idx_post_organization").on(table.organizationId),
    index("idx_post_created_at").on(table.createdAt),
    index("idx_post_updated_at").on(table.updatedAt),
  ]
);
