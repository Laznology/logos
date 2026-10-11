import type { H3Event } from "h3";

// ponytail: thin shim so the ~19 existing API routes keep their call shape
// after the better-auth migration. Prefer `requireAuth` in new code.
export async function requireValidSession(event: H3Event) {
  const user = event.context.auth ?? (await requireAuth(event));
  event.context.auth = user;
  return { user, organizationId: user.organizationId };
}
