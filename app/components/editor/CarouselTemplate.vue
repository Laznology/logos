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
      <p class="carousel-eyebrow" aria-label="Logos">LOGOS</p>
      <h1 class="carousel-cover-title">{{ frame.title }}</h1>
      <div class="carousel-cover-footer">
        <img src="/noctarian-logo.png" alt="Noctarian logo" />
        <span aria-hidden="true">01</span>
      </div>
    </div>
    <div v-else class="carousel-body">
      <span class="carousel-accent" aria-hidden="true" />
      <div class="carousel-content" v-html="bodyHtml" />
      <div class="carousel-slide-footer">
        <img src="/noctarian-logo.png" alt="Noctarian logo" />
        <span aria-hidden="true">{{
          String(frame.index + 1).padStart(2, "0")
        }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.carousel-frame {
  --carousel-accent: #ff4f00;
  --carousel-background: #0a0a0a;
  --carousel-border: rgba(250, 248, 245, 0.18);
  --carousel-foreground: #faf8f5;
  --carousel-muted: rgba(250, 248, 245, 0.5);
  aspect-ratio: 3 / 4;
  background-color: var(--carousel-background);
  background-image: url("data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.75%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27 opacity=%270.08%27/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 400px 400px;
  color: var(--carousel-foreground);
  container-type: inline-size;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.carousel-frame--editable {
  border: 1px solid var(--carousel-border);
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%);
}

.carousel-cover,
.carousel-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 6.5cqw 11cqw;
  box-sizing: border-box;
}

.carousel-cover {
  justify-content: flex-start;
}

.carousel-eyebrow,
.carousel-accent {
  background: var(--carousel-accent);
  display: block;
  flex: 0 0 auto;
  height: 0.35cqw;
  margin: 0;
  width: 5.5cqw;
}

.carousel-eyebrow {
  font-size: 0;
}

.carousel-cover-footer,
.carousel-slide-footer {
  align-items: center;
  border-top: 1px solid var(--carousel-border);
  display: flex;
  justify-content: space-between;
  padding-top: 2.2cqw;
  width: 100%;
}

.carousel-cover-footer span,
.carousel-slide-footer span {
  color: var(--carousel-muted);
  font-size: clamp(0.6rem, 1.2cqw, 0.9rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.carousel-cover-title {
  font-family: "Lora", Georgia, serif;
  font-size: clamp(2.5rem, 6.2cqw, 4.5rem);
  font-weight: 300;
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 42cqw 0 auto;
  max-width: 88%;
  overflow-wrap: anywhere;
}

.carousel-body {
  justify-content: flex-start;
}

.carousel-body > .carousel-accent {
  margin-bottom: auto;
}

.carousel-content {
  color: rgb(250 248 245 / 80%);
  font-family: "Lora", Georgia, serif;
  font-size: clamp(1rem, 2.7cqw, 2.25rem);
  line-height: 1.8;
  margin: auto 0;
  overflow-wrap: anywhere;
}

.carousel-content :deep(h1),
.carousel-content :deep(h2),
.carousel-content :deep(h3) {
  font-family: "Lora", Georgia, serif;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.05;
  margin: 0 0 0.7em;
}

.carousel-content :deep(h1) {
  font-size: clamp(2.375rem, 5.9cqw, 4rem);
}

.carousel-content :deep(h2) {
  font-size: clamp(2.375rem, 5.2cqw, 3.5rem);
}

.carousel-content :deep(h3) {
  font-size: clamp(2.375rem, 4.5cqw, 3rem);
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
  border-left: 0.15em solid var(--carousel-accent);
  color: rgb(250 248 245 / 70%);
  font-style: italic;
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

.carousel-slide-footer {
  bottom: 7cqw;
  left: 11cqw;
  position: absolute;
  right: 11cqw;
  width: auto;
}

.carousel-cover-footer img,
.carousel-slide-footer img {
  border-radius: 0.5rem;
  height: 2.8cqw;
  object-fit: cover;
  width: 2.8cqw;
}
</style>
