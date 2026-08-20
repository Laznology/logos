<script setup lang="ts">
interface PublicPostListItem {
  id: string;
  title: string;
  slug: string;
  preview: string;
  wordCount: number;
  readingTime: number;
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

const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const { data: posts, pending } = await useFetch("/api/public/posts", {
  key: "public-blog-posts",
  transform: (response: ApiResponse) => response.data || [],
});

const formatDate = (dateString: string | Date) => {
  if (!dateString) {
    return "";
  }
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

useSeoMeta({
  title: "Logos — Minimal Editorial Blog",
  description:
    "A clean, distraction-free space for essays, stories, and ideas.",
});
</script>

<template>
  <div
    class="bg-default text-default selection:bg-primary/20 flex min-h-screen flex-col font-sans"
  >
    <!-- Header -->
    <header class="bg-default/80 sticky top-0 z-30 backdrop-blur-md">
      <div
        class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6"
      >
        <NuxtLink
          to="/"
          class="text-highlighted flex items-center gap-2 font-semibold transition hover:opacity-80"
        >
          <UIcon name="i-lucide-box" class="text-primary size-5" />
          <span class="text-sm tracking-tight">Logos</span>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <UButton
            to="/admin"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-pen-line"
            label="Studio"
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

    <!-- Main Body -->
    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <!-- Hero Section -->
        <div class="border-default mb-12 space-y-3 border-b pb-8">
          <h1
            class="text-highlighted text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            Logos Publication
          </h1>
          <p class="text-muted text-base leading-relaxed">
            Distraction-free thoughts, essays, and technical writings.
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="space-y-8">
          <div v-for="i in 3" :key="i" class="space-y-3 pb-8">
            <USkeleton class="bg-muted h-7 w-3/4 rounded-md" />
            <USkeleton class="bg-muted h-4 w-full rounded-md" />
            <USkeleton class="bg-muted h-4 w-1/2 rounded-md" />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!posts || posts.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <UEmpty
            icon="i-lucide-book-open"
            title="No published posts yet"
            description="Write and publish your first article from the Logos Studio."
          >
            <template #actions>
              <UButton to="/admin" icon="i-lucide-plus" label="Go to Studio" />
            </template>
          </UEmpty>
        </div>

        <!-- Posts List -->
        <div v-else class="divide-default divide-y">
          <article
            v-for="post in posts"
            :key="post.id"
            class="group py-8 first:pt-0 last:pb-0"
          >
            <NuxtLink :to="`/posts/${post.slug}`" class="block space-y-3">
              <h2
                class="text-highlighted group-hover:text-primary text-xl font-bold tracking-tight transition sm:text-2xl"
              >
                {{ post.title || "Untitled" }}
              </h2>

              <p
                v-if="post.preview"
                class="text-muted line-clamp-2 text-sm leading-relaxed"
              >
                {{ post.preview }}
              </p>

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
                <time :datetime="String(post.createdAt)">
                  {{ formatDate(post.createdAt) }}
                </time>

                <span class="opacity-40">•</span>
                <span>{{ post.wordCount }} words</span>

                <span class="opacity-40">•</span>
                <span>{{ post.readingTime }} min read</span>
              </div>
            </NuxtLink>
          </article>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-default text-muted border-t py-8 text-center text-xs">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-6">
        <span>© {{ new Date().getFullYear() }} Logos</span>
        <NuxtLink to="/admin" class="hover:text-highlighted transition">
          Studio →
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
