import { blob } from "hub:blob";
import { auth } from "~~/server/utils/auth";

export default defineProtectedHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  const previous = session?.user.image;

  const updated = await auth.api.updateUser({
    body: { image: null },
    headers: event.headers,
  });

  if (previous) {
    try {
      await blob.del(previous);
    } catch {
      // ponytail: stale blob is harmless.
    }
  }

  return { success: true, data: updated };
});
