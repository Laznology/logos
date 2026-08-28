import { userTable } from "@nuxthub/db/schema";
import { and, eq, ne } from "drizzle-orm";

const USER_NOT_FOUND_MSG = "User not found";

const withAvatarUrl = <T extends AvatarColumns>(user: T) => ({
  ...user,
  avatarUrl: user.avatar ? `/images/${user.avatar}` : null,
});

const deleteBlob = async (pathname: string | null) => {
  if (pathname) {
    try {
      await blob.del(pathname);
    } catch {
      // ignore
    }
  }
};
const avatarColumns = {
  id: userTable.id,
  name: userTable.name,
  email: userTable.email,
  username: userTable.username,
  avatar: userTable.avatar,
};

interface AvatarColumns {
  avatar: string | null;
}

class ProfileService {
  private readonly database: typeof db;
  constructor(database: typeof db) {
    this.database = database;
  }

  async getProfile(userId: string) {
    const [user] = await this.database
      .select(avatarColumns)
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }
    return withAvatarUrl(user);
  }

  async updateName(userId: string, name: string) {
    const [updated] = await this.database
      .update(userTable)
      .set({ name, updatedAt: new Date() })
      .where(eq(userTable.id, userId))
      .returning(avatarColumns);

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }
    return withAvatarUrl(updated);
  }

  async setAvatar(userId: string, pathname: string) {
    const current = await this.database
      .select({ avatar: userTable.avatar })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    const [updated] = await this.database
      .update(userTable)
      .set({ avatar: pathname, updatedAt: new Date() })
      .where(eq(userTable.id, userId))
      .returning(avatarColumns);

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }

    await deleteBlob(current[0]?.avatar ?? null);
    return withAvatarUrl(updated);
  }

  async removeAvatar(userId: string) {
    const [updated] = await this.database
      .update(userTable)
      .set({ avatar: null, updatedAt: new Date() })
      .where(eq(userTable.id, userId))
      .returning(avatarColumns);

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }

    await deleteBlob(updated.avatar);
    return withAvatarUrl(updated);
  }

  async updateEmail(
    userId: string,
    input: { email: string; currentPassword: string }
  ) {
    const [user] = await this.database
      .select({ email: userTable.email, password: userTable.password })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }

    if (
      !user.password ||
      !(await verifyPassword(user.password, input.currentPassword))
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid password",
      });
    }

    const [existing] = await this.database
      .select({ id: userTable.id })
      .from(userTable)
      .where(and(eq(userTable.email, input.email), ne(userTable.id, userId)))
      .limit(1);

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: "Email already registered",
      });
    }

    const [updated] = await this.database
      .update(userTable)
      .set({ email: input.email, updatedAt: new Date() })
      .where(eq(userTable.id, userId))
      .returning(avatarColumns);

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }

    return withAvatarUrl(updated);
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string }
  ) {
    const [user] = await this.database
      .select({ id: userTable.id, password: userTable.password })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: USER_NOT_FOUND_MSG,
      });
    }

    if (
      !user.password ||
      !(await verifyPassword(user.password, input.currentPassword))
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid password",
      });
    }

    await this.database
      .update(userTable)
      .set({
        password: await hashPassword(input.newPassword),
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId));
  }
}

export const profileService = new ProfileService(db);
