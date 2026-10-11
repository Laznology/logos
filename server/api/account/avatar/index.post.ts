import { blob } from "hub:blob";
import { auth } from "~~/server/utils/auth";

// ponytail: better-auth's updateUser only takes an image path, so the upload
// itself stays app-side. Old blob is deleted after the new one is stored.
export default defineProtectedHandler(async (event) => {
  const [uploaded] = await blob.handleUpload(event, {
    ensure: { maxSize: "2MB", types: ["image"] },
    formKey: "file",
    multiple: false,
    put: { addRandomSuffix: true },
  });

  if (!uploaded) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  const session = await auth.api.getSession({ headers: event.headers });
  const previous = session?.user.image;

  const updated = await auth.api.updateUser({
    body: { image: uploaded.pathname },
    headers: event.headers,
  });

  if (previous) {
    try {
      await blob.del(previous);
    } catch {
      // ponytail: a stale blob is harmless; never fail the request over it.
    }
  }

  return { success: true, data: updated };
});
