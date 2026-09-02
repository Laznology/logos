<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui";

import { groupPostsByDate } from "~/utils/post-command-palette";

interface PublicPostItem {
  id: string;
  title: string;
  slug: string;
  preview: string;
  wordCount: number;
  readingTime: number;
  tags?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  author: {
    name: string | null;
    avatar: string | null;
  } | null;
}

interface PublicPostDetailResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    wordCount: number;
    readingTime: number;
    tags?: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
    author: {
      name: string | null;
      avatar: string | null;
    } | null;
  };
}

const open = defineModel<boolean>("open", { required: true });
const searchQuery = ref("");
const debouncedQuery = refDebounced(searchQuery, 300);
const selectedTag = ref("all");
const showPreview = ref(true);
const selectedPost = ref<PublicPostItem>();

const {
  data: postsResponse,
  error,
  pending,
} = useFetch<{ success: boolean; data: PublicPostItem[] }>(
  "/api/public/posts",
  {
    key: "public-command-palette-posts",
    query: computed(() => {
      const params: Record<string, string> = {};
      if (debouncedQuery.value.trim()) {
        params.q = debouncedQuery.value.trim();
      }
      if (selectedTag.value !== "all") {
        params.tag = selectedTag.value;
      }
      return params;
    }),
  }
);

const allPosts = computed(() => postsResponse.value?.data || []);

const tagOptions = computed(() => {
  const set = new Set<string>();
  for (const post of allPosts.value) {
    if (Array.isArray(post.tags)) {
      for (const t of post.tags) {
        if (t) {
          set.add(t);
        }
      }
    }
  }
  return [
    { label: "All tags", value: "all" },
    ...Array.from(set, (t) => ({ label: `#${t}`, value: t })),
  ];
});

const groups = computed<CommandPaletteGroup[]>(() =>
  groupPostsByDate(allPosts.value).map((group) => ({
    id: group.id,
    label: group.label,
    ignoreFilter: true,
    items: group.items.map((post) => ({
      id: post.id,
      label: post.title || "Untitled",
      suffix: `/${post.slug}`,
      icon: "i-lucide-file-text",
      avatar: post.author?.avatar ? { src: post.author.avatar } : undefined,
      post,
      onSelect: () => {
        open.value = false;
        navigateTo(`/posts/${post.slug}`);
      },
    })),
  }))
);

const selectedSlug = computed(() => selectedPost.value?.slug || "");

const {
  data: previewResponse,
  pending: previewPending,
  error: previewFetchError,
} = useAsyncData<PublicPostDetailResponse>(
  () => `public-palette-preview-${selectedSlug.value}`,
  () => {
    if (!selectedSlug.value || !showPreview.value || !open.value) {
      return Promise.resolve({ success: true });
    }
    return $fetch<PublicPostDetailResponse>(
      `/api/public/posts/${selectedSlug.value}`
    );
  },
  {
    watch: [selectedSlug, showPreview, open],
    immediate: false,
  }
);

const previewData = computed(() => previewResponse.value?.data);
const previewError = computed(() =>
  previewFetchError.value ? "Preview failed to load." : ""
);

function onHighlight(payload?: { value?: unknown }) {
  const post = (payload?.value as { post?: PublicPostItem } | undefined)?.post;
  if (post) {
    selectedPost.value = post;
  }
}

watch([allPosts, showPreview, open], ([posts, preview, isOpen]) => {
  if (!preview || !isOpen || posts.length === 0) {
    return;
  }
  const selected = posts.find((post) => post.id === selectedPost.value?.id);
  selectedPost.value = selected || posts[0];
});

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      open.value = !open.value;
    },
  },
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Search articles"
    description="Find essays, thoughts, and stories"
    :ui="{ content: showPreview ? 'sm:max-w-5xl' : 'sm:max-w-2xl' }"
  >
    <template #content>
      <div class="flex h-[min(78vh,44rem)] min-h-0 flex-col overflow-hidden">
        <h2 class="sr-only">Search articles</h2>
        <div
          class="border-default flex flex-wrap items-center gap-2 border-b p-2"
        >
          <USelectMenu
            v-model="selectedTag"
            :items="tagOptions"
            value-key="value"
            placeholder="All tags"
            size="sm"
            class="w-36"
          />

          <UButton
            :icon="
              showPreview
                ? 'i-lucide-panel-right-close'
                : 'i-lucide-panel-right'
            "
            color="neutral"
            variant="ghost"
            size="sm"
            class="ml-auto hidden md:inline-flex"
            :aria-label="showPreview ? 'Hide preview' : 'Show preview'"
            @click="showPreview = !showPreview"
          />
        </div>

        <div
          class="grid min-h-0 flex-1"
          :class="
            showPreview
              ? 'md:grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)]'
              : 'grid-cols-1'
          "
        >
          <UCommandPalette
            v-model:search-term="searchQuery"
            :groups="groups"
            :loading="pending"
            close
            placeholder="Search essays, thoughts, stories..."
            class="min-h-0"
            :ui="{
              root: 'h-full',
              viewport: 'max-h-none',
              item: 'data-highlighted:before:!bg-primary/15',
              itemLeadingIcon: 'group-data-highlighted:text-primary',
              itemLabel: 'group-data-highlighted:text-primary',
              itemLabelBase: '[&>mark]:bg-primary/20 [&>mark]:text-primary',
            }"
            @update:open="open = $event"
            @highlight="onHighlight"
          >
            <template v-if="error" #empty>
              <div class="text-error p-6 text-center text-sm">
                Search failed. Try again.
              </div>
            </template>
          </UCommandPalette>

          <aside
            v-if="showPreview"
            class="border-default bg-elevated hidden min-h-0 flex-col border-l md:flex"
          >
            <div v-if="previewPending" class="space-y-4 p-6">
              <USkeleton class="h-7 w-2/3" />
              <USkeleton class="h-4 w-1/3" />
              <USkeleton class="h-48 w-full" />
            </div>

            <UEmpty
              v-else-if="previewError"
              icon="i-lucide-circle-alert"
              title="Preview unavailable"
              :description="previewError"
              class="m-auto"
            />

            <article
              v-else-if="previewData"
              class="flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
            >
              <div class="border-default space-y-3 border-b pb-4">
                <div class="flex items-start justify-between gap-3">
                  <h3
                    class="text-highlighted line-clamp-2 text-xl font-bold tracking-tight"
                  >
                    {{ previewData.title || "Untitled" }}
                  </h3>
                  <UButton
                    label="Open"
                    icon="i-lucide-arrow-up-right"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :to="`/posts/${previewData.slug}`"
                    class="shrink-0"
                    @click="open = false"
                  />
                </div>

                <div
                  class="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                >
                  <span
                    v-if="previewData.author?.name"
                    class="text-highlighted font-medium"
                  >
                    {{ previewData.author.name }}
                  </span>
                  <span v-if="previewData.author?.name" class="opacity-40"
                    >•</span
                  >
                  <NuxtTime
                    :datetime="previewData.createdAt"
                    locale="en-US"
                    month="short"
                    day="numeric"
                    year="numeric"
                  />
                  <span class="opacity-40">•</span>
                  <span>{{ previewData.readingTime }} min read</span>
                </div>

                <div
                  v-if="previewData.tags && previewData.tags.length > 0"
                  class="flex flex-wrap items-center gap-1"
                >
                  <span
                    v-for="tag in previewData.tags"
                    :key="tag"
                    class="border-default bg-default text-muted py-0.2 inline-flex items-center gap-0.5 rounded-full border px-2 text-[11px] font-medium"
                  >
                    <span class="text-primary/70 font-semibold">#</span
                    >{{ tag }}
                  </span>
                </div>
              </div>

              <!-- Content Body Preview -->
              <div
                class="prose prose-sm dark:prose-invert max-w-none pt-4 text-xs leading-relaxed"
                v-html="previewData.content"
              />
            </article>

            <div v-else class="text-muted m-auto p-6 text-center text-sm">
              Select an article to preview
            </div>
          </aside>
        </div>
      </div>
    </template>
  </UModal>
</template>
