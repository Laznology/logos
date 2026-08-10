import { eq } from "drizzle-orm";
import { userTable } from "hub:db:schema";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (data) =>
    v.parse(signInSchema, data)
  );
  const isEmail = body.identifier.includes("@");
  const [user] = await db
    .select()
    .from(userTable)
    .where(
      isEmail
        ? eq(userTable.email, body.identifier)
        : eq(userTable.username, body.identifier)
    )
    .limit(1);

  if (!user || !user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credential",
    });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    },
    loggedInAt: Date.now(),
  });
  return { success: true, message: "Loggin successful" };
});
