import { eq } from "drizzle-orm";
import { db } from "hub:db";
import { userTable } from "hub:db:schema";

export default defineNitroPlugin(() => {
  sessionHooks.hook("fetch", async (session) => {
    if (!session.user?.id) {
      return;
    }

    const [user] = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    if (user) {
      session.user.role = user.role;
    }
  });
});
