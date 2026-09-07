<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

import type { CarouselFrame } from "#shared/types/carousel";
import ImageUpload from "~/components/editor/ImageUploadExtension";

interface Props {
  frame: CarouselFrame;
  editable?: boolean;
}

const props = defineProps<Props>();

const extensions = [
  StarterKit,
  Image,
  ImageUpload,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
];

const bodyHtml = computed(() => {
  if (props.frame.kind === "cover") {
    return "";
  }

  return generateHTML(
    { type: "doc", content: props.frame.content } satisfies JSONContent,
    extensions
  );
});
</script>

<template>
  <article
    class="carousel-frame"
    :class="{ 'carousel-frame--editable': editable }"
    :data-carousel-frame="frame.kind"
    :data-carousel-index="frame.kind === 'slide' ? frame.index : undefined"
  >
    <div v-if="frame.kind === 'cover'" class="carousel-cover">
      <p class="carousel-eyebrow">LOGOS</p>
      <h1 class="carousel-cover-title">{{ frame.title }}</h1>
      <p class="carousel-cover-footer">Carousel</p>
    </div>

    <div v-else class="carousel-body">
      <div class="carousel-content" v-html="bodyHtml" />
      <span class="carousel-slide-number">{{
        String(frame.index).padStart(2, "0")
      }}</span>
    </div>
  </article>
</template>

<style scoped>
.carousel-frame {
  aspect-ratio: 3 / 4;
  background: #f7f5f0;
  color: #191a1c;
  container-type: inline-size;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.carousel-frame--editable {
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 1rem;
  box-shadow: 0 10px 30px color-mix(in srgb, #191a1c 10%, transparent);
}

.carousel-cover,
.carousel-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 11cqw;
}

.carousel-cover {
  justify-content: space-between;
}

.carousel-eyebrow,
.carousel-slide-number,
.carousel-cover-footer {
  color: #6f716f;
  font-size: clamp(0.6rem, 1.2cqw, 0.9rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.carousel-cover-title {
  font-size: clamp(2.5rem, 8cqw, 7rem);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.98;
  max-width: 90%;
  overflow-wrap: anywhere;
}

.carousel-body {
  justify-content: center;
}

.carousel-content {
  font-size: clamp(1rem, 2.7cqw, 2.25rem);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.carousel-content :deep(h1),
.carousel-content :deep(h2),
.carousel-content :deep(h3) {
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0 0 0.7em;
}

.carousel-content :deep(p),
.carousel-content :deep(ul),
.carousel-content :deep(ol),
.carousel-content :deep(blockquote) {
  margin: 0 0 0.75em;
}

.carousel-content :deep(ul),
.carousel-content :deep(ol) {
  padding-left: 1.2em;
}

.carousel-content :deep(blockquote) {
  border-left: 0.15em solid #9b6c46;
  padding-left: 0.7em;
}

.carousel-content :deep(img) {
  border-radius: 0.5em;
  display: block;
  height: auto;
  margin: 0.8em 0;
  max-height: 48cqw;
  max-width: 100%;
  object-fit: contain;
}

.carousel-slide-number {
  bottom: 7cqw;
  position: absolute;
  right: 11cqw;
}
</style>
