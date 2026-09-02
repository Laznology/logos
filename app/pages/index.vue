<script setup lang="ts">
interface PublicPostListItem {
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

interface ApiResponse {
  success: boolean;
  data: PublicPostListItem[];
}

const route = useRoute();
const selectedTag = computed(() => (route.query.tag as string) || "");
const commandPaletteOpen = ref(false);
const searchQuery = ref((route.query.q as string) || "");
const debouncedSearch = refDebounced(searchQuery, 300);
watch(debouncedSearch, (newQ) => {
  const currentQ = (route.query.q as string) || "";
  if (newQ !== currentQ) {
    navigateTo(
      {
        query: {
          ...route.query,
          q: newQ.trim() || undefined,
        },
      },
      { replace: true }
    );
  }
});

watch(
  () => route.query.q,
  (newQ) => {
    const val = (newQ as string) || "";
    if (val !== searchQuery.value) {
      searchQuery.value = val;
    }
  }
);

const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const { data: posts, pending } = await useFetch("/api/public/posts", {
  key: "public-blog-posts",
  query: computed(() => {
    const params: Record<string, string> = {};
    if (selectedTag.value) {
      params.tag = selectedTag.value;
    }
    if (debouncedSearch.value.trim()) {
      params.q = debouncedSearch.value.trim();
    }
    return params;
  }),
  transform: (response: ApiResponse) => response.data || [],
});

const filterByTag = (tag: string) => {
  if (selectedTag.value === tag) {
    navigateTo(
      { query: { ...route.query, tag: undefined } },
      { replace: true }
    );
  } else {
    navigateTo({ query: { ...route.query, tag } }, { replace: true });
  }
};

const clearTag = () => {
  navigateTo({ query: { ...route.query, tag: undefined } }, { replace: true });
};

const clearSearch = () => {
  searchQuery.value = "";
  navigateTo({ query: { ...route.query, q: undefined } }, { replace: true });
};

const resetAll = () => {
  searchQuery.value = "";
  navigateTo({ query: {} }, { replace: true });
};

const escapeHtml = (str: string) =>
  str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const highlightMatch = (text: string, query: string) => {
  if (!text) {
    return "";
  }
  const safeText = escapeHtml(text);
  const trimmed = query.trim();
  if (!trimmed) {
    return safeText;
  }
  const escaped = trimmed.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return safeText.replaceAll(
    regex,
    '<mark class="bg-primary/20 text-highlighted rounded px-0.5 font-semibold">$1</mark>'
  );
};

const SITE_NAME = "Logos Publication";
const SITE_DESCRIPTION =
  "A clean, distraction-free space for essays, stories, and ideas.";

useSeoMeta({
  title: `Logos — Minimal Editorial Blog`,
  description: SITE_DESCRIPTION,
  ogTitle: `Logos — Minimal Editorial Blog`,
  ogDescription: SITE_DESCRIPTION,
  ogType: "website",
  twitterCard: "summary_large_image",
});

defineOgImage(
  "Publication",
  {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    author: SITE_NAME,
    publishedAt: "Essays · Stories · Ideas",
  },
  { alt: SITE_NAME }
);
</script>

<template>
  <div
    class="bg-default text-default selection:bg-primary/20 flex min-h-screen flex-col font-sans"
  >
    <header class="bg-default/80 sticky top-0 z-30 backdrop-blur-md">
      <div
        class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6"
      >
        <NuxtLink to="/" class="transition hover:opacity-80">
          <AppLogo />
        </NuxtLink>

        <div class="flex items-center gap-2">
          <UButton
            variant="subtle"
            color="neutral"
            size="sm"
            icon="i-lucide-search"
            class="hidden items-center gap-2 sm:flex"
            @click="commandPaletteOpen = true"
          >
            <span class="text-muted text-xs">Search articles...</span>
            <UKbd size="sm">⌘K</UKbd>
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-search"
            class="sm:hidden"
            aria-label="Search"
            @click="commandPaletteOpen = true"
          />

          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            :icon="
              colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
            "
            aria-label="Toggle theme"
            @click="toggleTheme"
          />
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div class="border-default mb-12 space-y-3 border-b pb-8">
          <h1
            class="text-highlighted text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            Logos Publication
          </h1>
          <p class="text-muted text-base leading-relaxed">
            Distraction-free thoughts, essays, and stories.
          </p>
        </div>

        <div
          v-if="selectedTag || debouncedSearch.trim()"
          class="mb-8 flex flex-wrap items-center gap-2"
        >
          <span class="text-muted text-xs font-medium">Filtered by:</span>
          <span
            v-if="selectedTag"
            class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          >
            #{{ selectedTag }}
            <button
              type="button"
              class="hover:text-highlighted ml-0.5 inline-flex cursor-pointer items-center transition"
              aria-label="Clear tag"
              @click="clearTag"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </span>

          <span
            v-if="debouncedSearch.trim()"
            class="border-default bg-elevated text-highlighted inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          >
            <UIcon name="i-lucide-search" class="size-3 opacity-60" />
            "{{ debouncedSearch.trim() }}"
            <button
              type="button"
              class="text-muted hover:text-highlighted ml-0.5 inline-flex cursor-pointer items-center transition"
              aria-label="Clear search"
              @click="clearSearch"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </span>

          <button
            type="button"
            class="text-muted hover:text-highlighted text-xs underline underline-offset-2 transition"
            @click="resetAll"
          >
            Reset all
          </button>
        </div>

        <div v-if="pending" class="space-y-8">
          <div v-for="i in 3" :key="i" class="space-y-3 pb-8">
            <USkeleton class="bg-muted h-7 w-3/4 rounded-md" />
            <USkeleton class="bg-muted h-4 w-full rounded-md" />
            <USkeleton class="bg-muted h-4 w-1/2 rounded-md" />
          </div>
        </div>

        <div
          v-else-if="!posts || posts.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <UEmpty
            icon="i-lucide-book-open"
            :title="
              selectedTag || debouncedSearch.trim()
                ? 'No matching articles'
                : 'No published posts yet'
            "
            :description="
              selectedTag || debouncedSearch.trim()
                ? 'Try checking your spelling or clearing filters.'
                : 'Check back later for new essays and stories.'
            "
          >
            <template #actions>
              <UButton
                v-if="selectedTag || debouncedSearch.trim()"
                variant="outline"
                color="neutral"
                icon="i-lucide-rotate-ccw"
                label="Reset filters"
                @click="resetAll"
              />
              <UButton
                v-else
                to="/"
                icon="i-lucide-house"
                label="Back to Home"
              />
            </template>
          </UEmpty>
        </div>

        <div v-else class="divide-default divide-y">
          <article
            v-for="post in posts"
            :key="post.id"
            class="group py-8 first:pt-0 last:pb-0"
          >
            <NuxtLink :to="`/posts/${post.slug}`" class="block space-y-3">
              <h2
                class="text-highlighted group-hover:text-primary text-xl font-bold tracking-tight transition sm:text-2xl"
                v-html="
                  highlightMatch(post.title || 'Untitled', debouncedSearch)
                "
              />

              <p
                v-if="post.preview"
                class="text-muted line-clamp-2 text-sm leading-relaxed"
                v-html="highlightMatch(post.preview, debouncedSearch)"
              />

              <div
                class="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
              >
                <div class="flex items-center gap-1.5">
                  <UAvatar
                    v-if="post.author?.avatar"
                    :src="post.author.avatar"
                    :alt="post.author.name || 'Author'"
                    size="xs"
                  />
                  <span class="text-highlighted font-medium">
                    {{ post.author?.name || "Author" }}
                  </span>
                </div>

                <span class="opacity-40">•</span>
                <NuxtTime
                  :datetime="post.createdAt"
                  locale="en-US"
                  month="long"
                  day="numeric"
                  year="numeric"
                />

                <span class="opacity-40">•</span>
                <span>{{ post.wordCount }} words</span>

                <span class="opacity-40">•</span>
                <span>{{ post.readingTime }} min read</span>
              </div>

              <div
                v-if="post.tags && post.tags.length > 0"
                class="flex flex-wrap items-center gap-1.5 pt-1"
              >
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  class="border-default bg-elevated/40 text-muted hover:border-primary/40 hover:text-primary inline-flex cursor-pointer items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium transition"
                  @click.stop.prevent="filterByTag(tag)"
                >
                  <span class="text-primary/70 font-semibold">#</span>{{ tag }}
                </span>
              </div>
            </NuxtLink>
          </article>
        </div>
      </div>
    </main>

    <AppFooter />
    <PublicCommandPalette v-model:open="commandPaletteOpen" />
  </div>
</template>
