import { invalidateSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  await invalidateSession(event);
  await clearUserSession(event);
  return { success: true, message: "Signed out" };
});
