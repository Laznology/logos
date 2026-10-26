import { apiKey } from "@better-auth/api-key";
import type { Role } from "@nuxthub/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { verifyPassword as verifyBetterAuthPassword } from "better-auth/crypto";
import { admin, organization, username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { db } from "hub:db";
import {
  accountTable,
  apiKeyTable,
  invitationTable,
  memberTable,
  organizationTable,
  sessionTable,
  userTable,
  verificationTable,
} from "hub:db:schema";
import type { AuthUser } from "~~/shared/types/auth";

import { siteSettingsService } from "../services/settings.service";
import { verifyLegacyPassword } from "./password";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export function workspaceSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/[\s_-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  return `${base || "workspace"}-${userId.slice(0, 6)}`;
}

export const auth = betterAuth({
  // ponytail: in dev, leave baseURL unset so better-auth infers it from the
  // request (otherwise the production URL fails the origin check on localhost).
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (import.meta.dev ? undefined : process.env.NUXT_SITE_URL),
  secret:
    process.env.BETTER_AUTH_SECRET || process.env.NUXT_SESSION_PASSWORD || "",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
    schema: {
      users: userTable,
      sessions: sessionTable,
      accounts: accountTable,
      verifications: verificationTable,
      organizations: organizationTable,
      members: memberTable,
      invitations: invitationTable,
      apikeys: apiKeyTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // ponytail: the migration copies the old Adonis scrypt hashes into
    // `accounts`, so users keep their current passwords. Drop this override
    // once everyone has signed in again or reset their password.
    password: {
      verify: ({ hash, password }) =>
        hash.startsWith("$scrypt$")
          ? verifyLegacyPassword(hash, password)
          : verifyBetterAuthPassword({ hash, password }),
    },
  },
  session: {
    expiresIn: SESSION_TTL_SECONDS,
    updateAge: 60 * 60 * 24,
  },
  user: {
    fields: { image: "avatar" },
    changeEmail: { enabled: true, updateEmailWithoutVerification: true },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      const settings = await siteSettingsService.get(null);
      if (!settings.registrationEnabled) {
        throw new APIError("FORBIDDEN", {
          message: "Registration is disabled",
        });
      }
    }),
  },
  plugins: [username(), admin(), organization(), apiKey()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const organization = await auth.api.createOrganization({
            body: {
              name: `${user.name}'s Workspace`,
              slug: workspaceSlug(
                String(user.username || user.name || "user"),
                user.id
              ),
              userId: user.id,
            },
          });
          await db
            .update(sessionTable)
            .set({ activeOrganizationId: organization.id })
            .where(eq(sessionTable.userId, user.id));
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [membership] = await db
            .select({ organizationId: memberTable.organizationId })
            .from(memberTable)
            .where(eq(memberTable.userId, session.userId))
            .limit(1);
          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
});

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  let organizationId = session.session.activeOrganizationId ?? null;
  if (!organizationId) {
    const [membership] = await db
      .select({ organizationId: memberTable.organizationId })
      .from(memberTable)
      .where(eq(memberTable.userId, session.user.id))
      .limit(1);
    organizationId = membership?.organizationId ?? null;
    if (organizationId) {
      await db
        .update(sessionTable)
        .set({ activeOrganizationId: organizationId })
        .where(eq(sessionTable.id, session.session.id));
    }
  }

  return {
    id: session.user.id,
    role: session.user.role as Role,
    organizationId,
  };
}

export function defineProtectedHandler<T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
  roles?: Role[]
) {
  return defineEventHandler<T>({
    onRequest: [
      async (event) => {
        const user = await requireAuth(event);
        if (roles && roles.length > 0 && !roles.includes(user.role)) {
          throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }
        event.context.auth = user;
      },
    ],
    handler,
  });
}
