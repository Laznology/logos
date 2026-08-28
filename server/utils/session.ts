import { sessionTable, userTable } from "@nuxthub/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import type { H3Event } from "h3";

const SESION_TTL_SECONDS = 30 * 24 * 60 * 60;
const ACTIVITY_UPDATE_INTERVAL_SECONDS = 60;
const SESSION_COOKIE_NAME = "logos.session";

export const SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESION_TTL_SECONDS,
  },
};
async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    Buffer.from(token, "base64url")
  );
  return Buffer.from(digest).toString("hex");
}

function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export async function createSession(event: H3Event, userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESION_TTL_SECONDS * 1000);
  await db.insert(sessionTable).values({
    userId,
    tokenHash: await hashToken(token),
    userAgent: getHeader(event, "user-agent") ?? null,
    ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null,
    expiresAt,
  });
  setCookie(event, SESSION_COOKIE.name, token, SESSION_COOKIE.options);
}

export async function invalidateSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE.name);
  if (token) {
    await db
      .delete(sessionTable)
      .where(eq(sessionTable.tokenHash, await hashToken(token)));
  }
  deleteCookie(event, SESSION_COOKIE.name, { path: "/" });
}

interface ValidSession {
  sessionId: string;
  user: AuthUser;
}

const sessionCache = new WeakMap<H3Event, ValidSession>();

export async function requireValidSession(
  event: H3Event
): Promise<ValidSession> {
  const cached = sessionCache.get(event);
  if (cached) {
    return cached;
  }
  const token = getCookie(event, SESSION_COOKIE.name);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const tokenHash = await hashToken(token);
  const [row] = await db
    .select({
      sessionId: sessionTable.id,
      userId: sessionTable.userId,
      lastActivity: sessionTable.lastActivity,
      expiresAt: sessionTable.expiresAt,
    })
    .from(sessionTable)
    .where(eq(sessionTable.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await db.delete(sessionTable).where(eq(sessionTable.id, row.sessionId));
    }
    deleteCookie(event, SESSION_COOKIE.name, { path: "/" });
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const now = new Date();
  if (
    now.getTime() - row?.lastActivity.getTime() >
    ACTIVITY_UPDATE_INTERVAL_SECONDS * 1000
  ) {
    await db
      .update(sessionTable)
      .set({ lastActivity: now })
      .where(eq(sessionTable.id, row.sessionId));
  }
  const [user] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      username: userTable.username,
      role: userTable.role,
      avatar: userTable.avatar,
    })
    .from(userTable)
    .where(eq(userTable.id, row.userId))
    .limit(1);
  if (!user) {
    await db.delete(sessionTable).where(eq(sessionTable.id, row.sessionId));
    deleteCookie(event, SESSION_COOKIE.name, { path: "/" });
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const result: ValidSession = { sessionId: row.sessionId, user };
  sessionCache.set(event, result);
  return result;
}

export async function listSessions(userId: string, currentSessionId: string) {
  const rows = await db
    .select({
      id: sessionTable.id,
      userAgent: sessionTable.userAgent,
      ipAddress: sessionTable.ipAddress,
      createdAt: sessionTable.createdAt,
      lastActivity: sessionTable.lastActivity,
      expiresAt: sessionTable.expiresAt,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, userId))
    .orderBy(desc(sessionTable.lastActivity));

  return rows.map((row) => ({
    ...row,
    isCurrent: row.id === currentSessionId,
  }));
}

export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string
) {
  await db
    .delete(sessionTable)
    .where(
      and(
        ne(sessionTable.id, currentSessionId),
        eq(sessionTable.userId, userId)
      )
    );
}

export async function revokeAllSessions(userId: string) {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

export async function revokeSessionById(userId: string, sessionId: string) {
  const result = await db
    .delete(sessionTable)
    .where(and(eq(sessionTable.id, sessionId), eq(sessionTable.userId, userId)))
    .returning({ id: sessionTable.id });
  return result.length > 0;
}
