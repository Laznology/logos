import {
  requireValidSession,
  revokeSessionById,
} from "~~/server/utils/session";

export default defineProtectedHandler(async (event) => {
  const { user, sessionId: currentSessionId } =
    await requireValidSession(event);
  const sessionId = getRouterParam(event, "id");
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Session id is required",
    });
  }

  const revoked = await revokeSessionById(user.id, sessionId);
  if (!revoked) {
    throw createError({
      statusCode: 404,
      statusMessage: "Session not found",
    });
  }

  if (sessionId === currentSessionId) {
    await invalidateSession(event);
    await clearUserSession(event);
  }

  return { success: true, message: "Session revoked" };
});
