<script setup lang="ts">
export interface CommandPalettePreviewPost {
  title: string;
  slug: string;
  content: string;
  readingTime: number;
  tags?: string[];
  createdAt: string | Date;
  author: {
    name: string | null;
    avatar?: string | null;
  } | null;
}

const props = defineProps<{
  post: CommandPalettePreviewPost;
}>();

const colorMode = useColorMode();
const previewDocument = computed(
  () => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap">
  <style>
    :root { color-scheme: ${colorMode.value}; }
    html, body { background: transparent; color: CanvasText; font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
    a { color: #14b8a6; text-decoration: none; }
    h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-top: 1em; margin-bottom: 1em; }
  </style>
  <div style="padding: 0 4px;">${props.post.content}</div>`
);
</script>

<template>
  <article class="flex min-h-0 flex-1 flex-col p-6">
    <div class="border-default space-y-3 border-b pb-4">
      <div class="flex items-start justify-between gap-3">
        <h3
          class="text-highlighted line-clamp-2 text-xl font-bold tracking-tight"
        >
          {{ post.title || "Untitled" }}
        </h3>
        <slot name="actions" />
      </div>

      <div
        class="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
      >
        <span v-if="post.author?.name" class="text-highlighted font-medium">
          {{ post.author.name }}
        </span>
        <span v-if="post.author?.name" class="opacity-40">•</span>
        <NuxtTime
          :datetime="post.createdAt"
          locale="en-US"
          month="short"
          day="numeric"
          year="numeric"
        />
        <span class="opacity-40">•</span>
        <span>{{ post.readingTime }} min read</span>
      </div>

      <div
        v-if="post.tags && post.tags.length > 0"
        class="flex flex-wrap items-center gap-1"
      >
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="border-default bg-default text-muted py-0.2 inline-flex items-center gap-0.5 rounded-full border px-2 text-[11px] font-medium"
        >
          <span class="text-primary/70 font-semibold">#</span>{{ tag }}
        </span>
      </div>
    </div>

    <iframe
      :srcdoc="previewDocument"
      sandbox=""
      title="Post preview"
      class="border-default bg-elevated mt-4 min-h-0 flex-1 rounded-md border"
    />
  </article>
</template>
