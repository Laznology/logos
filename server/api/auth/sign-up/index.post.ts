import { userTable } from "hub:db:schema";
import { or, eq } from "drizzle-orm";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (data) =>
    v.parse(signUpSchema, data)
  );

  const [existingUser] = await db
    .select()
    .from(userTable)
    .where(
      or(eq(userTable.username, body.username), eq(userTable.name, body.email))
    )
    .limit(1);

  if (existingUser) {
    const isEmailTaken = existingUser.email === body.email;
    throw createError({
      statusCode: 400,
      statusMessage: isEmailTaken
        ? "Email already registered, user another email"
        : "Username already used",
    });
  }

  const passwordHash = await hashPassword(body.password);
  const [newUser] = await db
    .insert(userTable)
    .values({
      email: body.email,
      username: body.username,
      name: body.name,
      password: passwordHash,
    })
    .returning();

  if (!newUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create user",
    });
  }

  await setUserSession(event, {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    },
    loggedInAt: Date.now(),
  });
  return { success: true, message: "Sign-up successfull" };
});
