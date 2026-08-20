import type { Role } from "../db/schema";

export function defineProtectedHandler<T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
  roles?: Role[]
) {
  return defineEventHandler<T>({
    onRequest: [
      async (event) => {
        const session = await requireUserSession(event);
        if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
          throw createError({
            statusCode: 403,
            statusMessage: "Forbidden",
          });
        }
      },
    ],
    handler,
  });
}
