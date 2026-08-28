import { requireValidSession, listSessions } from "~~/server/utils/session";

export default defineProtectedHandler(async (event) => {
  const { user, sessionId } = await requireValidSession(event);
  return {
    success: true,
    data: await listSessions(user.id, sessionId),
  };
});
