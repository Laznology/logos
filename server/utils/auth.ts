import type { Role } from "../db/schema";

export function defineProtectedHandler<T extends EventHandlerRequest, D>(
  roles: Role[],
  handler: EventHandler<T, D>
) {
  return defineEventHandler<T>({
    onRequest: [
      async (event) => {
        const session = await requireUserSession(event);
        if (!roles.includes(session.user.role)) {
          throw createError({
            statusCode: 403,
            statusMessage: "Forbidden",
          });
        }
        event.context.user = session.user;
      },
    ],
    handler,
  });
}
