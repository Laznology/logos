<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { TextStyle } from "@tiptap/extension-text-style";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

import type { CarouselFrame } from "#shared/types/carousel";
import { CAROUSEL_HEIGHT, CAROUSEL_WIDTH } from "#shared/types/carousel";
import type { SiteSettings } from "#shared/types/settings";
import ImageUpload from "~/components/editor/ImageUploadExtension";

// ponytail: sama dengan AppLogo — satu sumber logo workspace, fallback file statis
const { data: siteSettings } = useNuxtData<SiteSettings>(
  "public-site-settings"
);
const logoSrc = computed(() => siteSettings.value?.logo || "/AppLogo.png");
const logoAlt = computed(() =>
  siteSettings.value?.logo ? "Workspace logo" : "Logos logo"
);

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
  Table,
  TableRow,
  TableHeader,
  TableCell,
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

const frameStyle = {
  aspectRatio: `${CAROUSEL_WIDTH} / ${CAROUSEL_HEIGHT}`,
};
</script>

<template>
  <div class="carousel-container">
    <article
      class="carousel-frame"
      :class="{ 'carousel-frame--editable': editable }"
      :data-carousel-frame="frame.kind"
      :data-carousel-index="frame.kind === 'slide' ? frame.index : undefined"
      :style="frameStyle"
    >
      <img :src="logoSrc" :alt="logoAlt" class="carousel-logo" />
      <h1 v-if="frame.kind === 'cover'" class="carousel-cover-title">
        {{ frame.title }}
      </h1>
      <div v-else class="carousel-content" v-html="bodyHtml" />
      <footer class="carousel-footer">
        <span class="carousel-brand">
          <UIcon name="i-lucide-globe" aria-hidden="true" /> pisah.in
        </span>
        <span class="carousel-page"
          >{{
            String(frame.kind === "cover" ? 1 : frame.index + 1).padStart(
              2,
              "0"
            )
          }}_</span
        >
      </footer>
    </article>
  </div>
</template>

<style scoped>
.carousel-container {
  container-type: inline-size;
  width: 100%;
}

.carousel-frame {
  --carousel-accent: #d83a32;
  --carousel-background: #ffffff;
  --carousel-border: rgba(21, 21, 21, 0.16);
  --carousel-foreground: #151515;
  --carousel-muted: rgba(21, 21, 21, 0.7);
  background-color: var(--carousel-background);
  box-sizing: border-box;
  color: var(--carousel-foreground);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5cqw 8cqw 4cqw;
  position: relative;
  width: 100%;
}

.carousel-frame--editable {
  border: 1px solid var(--carousel-border);
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%);
}

.carousel-logo {
  display: block;
  height: auto;
  margin-left: -2.5cqw;
  width: 8cqw;
}

.carousel-cover-title {
  font-family: "Space Grotesk", sans-serif;
  font-size: 6.2cqw;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: auto 0;
  max-width: 92%;
  overflow-wrap: anywhere;
}

.carousel-content {
  color: var(--carousel-foreground);
  font-family: "Space Mono", monospace;
  font-size: 3.3cqw;
  line-height: 1.55;
  margin: auto 0;
  overflow-wrap: anywhere;
}

.carousel-content :deep(h1),
.carousel-content :deep(h2),
.carousel-content :deep(h3),
.carousel-content :deep(h4) {
  color: var(--carousel-foreground);
  font-family: "Space Grotesk", sans-serif;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0 0 0.7em;
}

.carousel-content :deep(h1) {
  font-size: 5.9cqw;
}

.carousel-content :deep(h2) {
  font-size: 5.2cqw;
}

.carousel-content :deep(h3) {
  font-size: 4.5cqw;
}

.carousel-content :deep(h4) {
  font-size: 3.8cqw;
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

.carousel-content :deep(li) {
  margin-bottom: 0.25em;
}

.carousel-content :deep(li > p) {
  margin: 0;
}

.carousel-content :deep(blockquote) {
  border-left: 0.12em solid var(--carousel-accent);
  color: var(--carousel-muted);
  font-style: italic;
  padding-left: 0.7em;
}

.carousel-content :deep(strong) {
  font-weight: 700;
}

.carousel-content :deep(a) {
  color: var(--carousel-accent);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.carousel-content :deep(mark) {
  background-color: #fef08a;
  color: inherit;
  padding: 0 0.08em;
}

.carousel-content :deep(code) {
  background-color: #f5f5f4;
  border-radius: 0.2em;
  font-family: "Space Mono", monospace;
  font-size: 0.9em;
  padding: 0.1em 0.3em;
}

.carousel-content :deep(pre) {
  background-color: #f5f5f4;
  border: 1px solid var(--carousel-border);
  border-radius: 0.35em;
  font-size: 0.78em;
  line-height: 1.45;
  margin: 0 0 0.75em;
  overflow: hidden;
  overflow-wrap: anywhere;
  padding: 0.55em 0.65em;
  white-space: pre-wrap;
}

.carousel-content :deep(pre code) {
  background: none;
  border-radius: 0;
  font-size: inherit;
  padding: 0;
}

.carousel-content :deep(hr) {
  border: 0;
  border-top: 1px solid var(--carousel-border);
  margin: 0.9em 0;
}

.carousel-content :deep(table) {
  border-collapse: collapse;
  font-size: 0.85em;
  margin: 0 0 0.75em;
  table-layout: fixed;
  width: 100%;
}

.carousel-content :deep(th),
.carousel-content :deep(td) {
  border: 1px solid var(--carousel-border);
  overflow-wrap: anywhere;
  padding: 0.35em 0.45em;
  text-align: left;
  vertical-align: top;
}

.carousel-content :deep(th) {
  background-color: #f5f5f4;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 700;
}

.carousel-content :deep(img) {
  border-radius: 0.5em;
  display: block;
  height: auto;
  margin: 0.8em 0;
  max-height: 46cqw;
  max-width: 100%;
  object-fit: contain;
}

.carousel-footer {
  align-items: center;
  color: var(--carousel-muted);
  display: flex;
  font-family: "Space Mono", monospace;
  font-size: 2.2cqw;
  justify-content: space-between;
  margin-left: -2.5cqw;
}

.carousel-brand {
  align-items: center;
  display: inline-flex;
  gap: 0.6em;
  letter-spacing: 0.02em;
}

.carousel-brand svg {
  height: 2.8cqw;
  width: 2.8cqw;
}

.carousel-page {
  letter-spacing: 0.04em;
}
</style>
