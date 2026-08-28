import {
  invalidateSession,
  requireValidSession,
  revokeAllSessions,
} from "~~/server/utils/session";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  await revokeAllSessions(user.id);
  await invalidateSession(event);
  await clearUserSession(event);
  return { success: true, message: "All sessions revoked" };
});
