import type { Role } from "@nuxthub/db/schema";

import { requireValidSession } from "./session";

export function defineProtectedHandler<T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
  roles?: Role[]
) {
  return defineEventHandler<T>({
    onRequest: [
      async (event) => {
        const { user } = await requireValidSession(event);
        if (roles && roles.length > 0 && !roles.includes(user.role)) {
          throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }
      },
    ],
    handler,
  });
}
