import { blob } from "hub:blob";
import { profileService } from "~~/server/services/profile.service";
import { requireValidSession } from "~~/server/utils/session";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);

  const [uploaded] = await blob.handleUpload(event, {
    ensure: {
      maxSize: "2MB",
      types: ["image"],
    },
    formKey: "file",
    multiple: false,
    put: {
      addRandomSuffix: true,
    },
  });

  if (!uploaded) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file uploaded",
    });
  }

  return {
    success: true,
    data: await profileService.setAvatar(user.id, uploaded.pathname),
  };
});
