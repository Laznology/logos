import type { JSONContent } from "@tiptap/core";
import { postService } from "~~/server/services/posts.service";

import { buildCarouselFrames } from "../../../../../shared/types/carousel";
import {
  createCarouselZip,
  renderCarouselFrames,
} from "../../../../utils/carousel-export";

export default defineProtectedHandler(async (event) => {
  const { user } = await requireValidSession(event);
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Slug is required",
    });
  }

  const post = await postService.getBySlug(user, slug);
  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: "Post not found",
    });
  }

  const metadata = (post.metadata as Record<string, unknown>) || {};
  if (metadata.editorMode !== "carousel") {
    throw createError({
      statusCode: 400,
      statusMessage: "Post is not in carousel mode",
    });
  }

  const document = metadata.carouselDocument;
  let carouselDocument: JSONContent | null = null;
  if (
    document &&
    typeof document === "object" &&
    "type" in document &&
    document.type === "doc"
  ) {
    carouselDocument = document as JSONContent;
  }
  if (!carouselDocument) {
    throw createError({
      statusCode: 400,
      statusMessage: "Carousel content is empty",
    });
  }

  const frames = buildCarouselFrames(post.title || "", carouselDocument);
  if (frames.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: "Add content before exporting the carousel",
    });
  }

  try {
    const images = await renderCarouselFrames(
      frames,
      getRequestURL(event).origin
    );
    const files = images.map((data, index) => ({
      name:
        index === 0
          ? "cover.png"
          : `slide-${String(index).padStart(2, "0")}.png`,
      data,
    }));
    const zip = createCarouselZip(files);
    setHeader(event, "content-type", "application/zip");
    setHeader(
      event,
      "content-disposition",
      `attachment; filename="${post.slug}-carousel.zip"`
    );
    return zip;
  } catch (error) {
    console.error("Carousel export render error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to render carousel",
    });
  }
});
