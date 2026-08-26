<script setup lang="ts">
import type { CommandPaletteGroup } from "@nuxt/ui";
import {
  filterPalettePosts,
  groupPostsByDate,
  postHref,
} from "~/utils/post-command-palette";

type PalettePost = PostListType[number];

interface PaletteCommandItem {
  post: PalettePost;
}

interface PreviewResponse {
  success: boolean;
  data: PostWithAuthorType;
  previewHtml?: string;
}

const open = defineModel<boolean>("open", { required: true });
const searchQuery = ref("");
const debouncedQuery = refDebounced(searchQuery, 300);
const titleOnly = ref(false);
const status = ref<"all" | "draft" | "published">("all");
const authorId = ref("all");
const showPreview = ref(true);
const selectedPost = ref<PalettePost>();
const previewHtml = ref("");
const previewError = ref("");
const previewPending = ref(false);
let previewController: AbortController | undefined;
const statusSelect = useTemplateRef<{ triggerRef?: HTMLElement }>("statusSelect");
const authorSelect = useTemplateRef<{ triggerRef?: HTMLElement }>("authorSelect");

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }
  await nextTick();
  // ponytail: Nuxt UI 4.10 overwrites trigger aria-label with "Show popup".
  statusSelect.value?.triggerRef?.setAttribute("aria-label", "Filter by status");
  authorSelect.value?.triggerRef?.setAttribute("aria-label", "Filter by author");
});

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const {
  data: allPosts,
  error: listError,
  pending: listPending,
} = useFetch<PostListType>("/api/posts", {
  key: "admin-command-palette-posts",
  default: () => [],
});

const searchParams = computed(() => ({
  q: debouncedQuery.value,
  status: status.value === "all" ? undefined : status.value,
  author: authorId.value === "all" ? undefined : authorId.value,
}));
const searchEnabled = computed(
  () => !titleOnly.value && Boolean(debouncedQuery.value.trim())
);
const {
  data: searchResults,
  error: searchError,
  pending: searchPending,
  refresh: search,
} = useFetch<PostSearchListType>("/api/posts", {
  key: "admin-command-palette-search",
  query: searchParams,
  immediate: false,
});

watch(searchParams, () => {
  if (searchEnabled.value) {
    search();
  }
});

const authorOptions = computed(() => {
  const authors = new Map<string, string>();
  for (const post of allPosts.value || []) {
    if (post.author.id) {
      authors.set(post.author.id, post.author.name || "Unknown author");
    }
  }
  return [
    { label: "All authors", value: "all" },
    ...Array.from(authors, ([value, label]) => ({ label, value })),
  ];
});

const visiblePosts = computed(() =>
  filterPalettePosts(
    searchEnabled.value ? searchResults.value || [] : allPosts.value || [],
    {
      query: searchQuery.value,
      titleOnly: titleOnly.value,
      status: status.value,
      authorId: authorId.value === "all" ? "" : authorId.value,
    }
  )
);

const groups = computed<CommandPaletteGroup[]>(() =>
  groupPostsByDate(visiblePosts.value).map((group) => ({
    id: group.id,
    label: group.label,
    ignoreFilter: true,
    items: group.items.map((post) => ({
      id: post.id,
      label: post.title || "Untitled",
      suffix: `/${post.slug}`,
      icon: "i-lucide-file-text",
      avatar: post.author.avatar ? { src: post.author.avatar } : undefined,
      post,
      onSelect: () => {
        open.value = false;
        navigateTo(`/admin/posts/${post.slug}`);
      },
    })),
  }))
);

const pending = computed(() =>
  searchEnabled.value ? searchPending.value : listPending.value
);
const error = computed(() =>
  searchEnabled.value ? searchError.value : listError.value
);
const selectedHref = computed(() =>
  selectedPost.value ? postHref(selectedPost.value) : ""
);
const colorMode = useColorMode();
const previewDocument = computed(
  () => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap">
  <style>
    :root { color-scheme: ${colorMode.value}; }
    html, body { background: transparent; color: CanvasText; font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; line-height: 1.5; }
    a { color: #14b8a6; text-decoration: none; }
    h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-top: 1em; margin-bottom: 1em; }
  </style>
  <div style="padding: 0 4px;">${previewHtml.value}</div>`
);
const toast = useToast();
const { copy, isSupported } = useClipboard();

async function copySelectedLink() {
  if (!selectedHref.value || !isSupported.value) {
    toast.add({
      title: "Clipboard unavailable",
      color: "error",
      icon: "i-lucide-circle-alert",
    });
    return;
  }
  try {
    await copy(new URL(selectedHref.value, window.location.origin).href);
    toast.add({
      title: "Link copied",
      color: "success",
      icon: "i-lucide-check",
    });
  } catch {
    toast.add({
      title: "Could not copy link",
      color: "error",
      icon: "i-lucide-circle-alert",
    });
  }
}

async function loadPreview(post: PalettePost) {
  if (
    !showPreview.value ||
    (selectedPost.value?.id === post.id && previewHtml.value)
  ) {
    return;
  }

  selectedPost.value = post;
  previewHtml.value = "";
  previewError.value = "";
  previewPending.value = true;
  previewController?.abort();
  const controller = new AbortController();
  previewController = controller;

  try {
    const response = await $fetch<PreviewResponse>(
      `/api/posts/${post.slug}`,
      { query: { preview: 1 }, signal: controller.signal }
    );
    if (previewController === controller) {
      previewHtml.value = response.previewHtml || "";
    }
  } catch {
    if (!controller.signal.aborted) {
      previewError.value = "Preview failed to load.";
    }
  } finally {
    if (previewController === controller) {
      previewPending.value = false;
    }
  }
}

function onHighlight(payload?: { value?: unknown }) {
  const post = (payload?.value as PaletteCommandItem | undefined)?.post;
  if (post) {
    loadPreview(post);
  }
}

watch([visiblePosts, showPreview, open], ([posts, preview, isOpen]) => {
  if (!preview || !isOpen) {
    previewController?.abort();
    return;
  }
  const selected = posts.find((post) => post.id === selectedPost.value?.id);
  const firstPost = selected || posts[0];
  if (firstPost) {
    loadPreview(firstPost);
  }
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
  <UModal v-model:open="open" title="Search posts" description="Find and open a post"
    :ui="{ content: showPreview ? 'sm:max-w-5xl' : 'sm:max-w-2xl' }">
    <template #content>
      <div class="flex h-[min(78vh,44rem)] min-h-0 flex-col overflow-hidden">
        <h2 class="sr-only">Search posts</h2>
        <div class="border-muted flex flex-wrap gap-2 border-b p-2">
          <UButton :label="titleOnly ? 'Title only' : 'All text'" icon="i-lucide-type" color="neutral" size="sm"
            :variant="titleOnly ? 'soft' : 'ghost'" @click="titleOnly = !titleOnly" />
          <USelectMenu ref="statusSelect" v-model="status" :items="statusOptions" value-key="value"
            :search-input="false" size="sm" class="w-36" />
          <USelectMenu ref="authorSelect" v-model="authorId" :items="authorOptions" value-key="value"
            placeholder="All authors" size="sm" class="w-40" />
          <UButton :icon="showPreview ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right'
            " color="neutral" variant="ghost" size="sm" class="ml-auto hidden md:inline-flex"
            :aria-label="showPreview ? 'Hide preview' : 'Show preview'" @click="showPreview = !showPreview" />
        </div>

        <div class="grid min-h-0 flex-1" :class="showPreview
            ? 'md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]'
            : 'grid-cols-1'
          ">
          <UCommandPalette v-model:search-term="searchQuery" :groups="groups" :loading="pending" close
            placeholder="Search posts..." class="min-h-0" :ui="{
              root: 'h-full',
              viewport: 'max-h-none',
              item: 'data-highlighted:before:!bg-primary/15',
              itemLeadingIcon: 'group-data-highlighted:text-primary',
              itemLabel: 'group-data-highlighted:text-primary',
              itemLabelBase: '[&>mark]:bg-primary/20 [&>mark]:text-primary',
            }" @update:open="open = $event" @highlight="onHighlight">
            <template v-if="error" #empty>
              <div class="text-error p-6 text-center text-sm">
                Search failed. Try again.
              </div>
            </template>
          </UCommandPalette>

          <aside v-if="showPreview" class="border-muted bg-elevated hidden min-h-0 flex-col border-l md:flex">
            <div v-if="previewPending" class="space-y-4 p-6">
              <USkeleton class="h-7 w-2/3" />
              <USkeleton class="h-4 w-1/3" />
              <USkeleton class="h-32 w-full" />
            </div>
            <UEmpty v-else-if="previewError" icon="i-lucide-circle-alert" title="Preview unavailable"
              :description="previewError" class="m-auto" />
            <article v-else-if="selectedPost" class="flex min-h-0 flex-1 flex-col p-6">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-highlighted truncate text-xl font-semibold">
                    {{ selectedPost.title || "Untitled" }}
                  </h3>
                  <p class="text-muted mt-1 text-sm">
                    {{ selectedPost.author.name || "Unknown author" }}
                  </p>
                </div>
                <div class="flex shrink-0 gap-1">
                  <UButton label="Copy link" icon="i-lucide-link" color="neutral" variant="ghost" size="xs"
                    @click="copySelectedLink" />
                  <UButton label="Open" icon="i-lucide-arrow-up-right" color="neutral" variant="ghost" size="xs"
                    :to="selectedHref" target="_blank" rel="noopener noreferrer" />
                </div>
              </div>
              <iframe :srcdoc="previewDocument" sandbox="" title="Post preview"
                class="border-muted bg-elevated mt-6 min-h-0 flex-1 rounded-md border" />
            </article>
            <UEmpty v-else icon="i-lucide-panel-right" title="Select a post"
              description="Use arrow keys or hover to preview." class="m-auto" />
          </aside>
        </div>

        <div class="border-muted text-muted flex items-center gap-4 border-t px-3 py-2 text-xs">
          <span class="flex items-center gap-1">
            <UKbd value="meta" size="sm" />
            <UKbd value="K" size="sm" />
            toggle
          </span>
          <span class="flex items-center gap-1">
            <UKbd value="enter" size="sm" />
            open
          </span>
        </div>
      </div>
    </template>
  </UModal>
</template>
