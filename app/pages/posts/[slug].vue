<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

import TableOfContentsView from "~/components/editor/TableOfContents.vue";

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

interface PublicPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  headings: HeadingItem[];
  wordCount: number;
  readingTime: number;
  markdown: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: {
    name: string | null;
    avatar: string | null;
  } | null;
}

interface ApiResponse {
  success: boolean;
  data: PublicPostData;
}

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const colorMode = useColorMode();
const toast = useToast();
const { copy, isSupported } = useClipboard();

const activeHeadingId = ref<string>("");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const {
  data: post,
  error,
  pending,
} = await useFetch(() => `/api/public/posts/${slug.value}`, {
  key: `public-post-${slug.value}`,
  transform: (response: ApiResponse) => response.data,
  watch: [slug],
});

const formattedDate = computed(() => {
  if (!post.value?.createdAt) {
    return "";
  }
  return new Date(post.value.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
});

const wordCountText = computed(() => {
  const count = post.value?.wordCount || 0;
  return `${count} ${count === 1 ? "word" : "words"}`;
});

const breadcrumbItems = computed(() => [
  { label: "Logos", icon: "i-lucide-box", to: "/" },
  { label: post.value?.title || "Untitled" },
]);

const readingTimeText = computed(() => {
  const time = post.value?.readingTime || 1;
  return `${time} min read`;
});

const copyPageAsMarkdown = async () => {
  if (!isSupported.value || !post.value) {
    return;
  }
  const title = post.value.title || "Untitled";
  const body = post.value.markdown || "";
  const fullMarkdown = `# ${title}\n\n${body}`;
  await copy(fullMarkdown);
  toast.add({
    title: "Page copied as Markdown",
    icon: "i-lucide-check-circle",
    color: "success",
  });
};

const copyMarkdownLink = async () => {
  if (!isSupported.value || !post.value) {
    return;
  }
  const title = post.value.title || "Untitled";
  const url = typeof window === "undefined" ? "" : window.location.href;
  const markdownLink = `[${title}](${url})`;
  await copy(markdownLink);
  toast.add({
    title: "Markdown link copied to clipboard",
    icon: "i-lucide-check-circle",
    color: "neutral",
  });
};

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Copy page",
      icon: "i-lucide-clipboard",
      onSelect: () => copyPageAsMarkdown(),
    },
    {
      label: "Copy Markdown link",
      icon: "i-lucide-link",
      onSelect: () => copyMarkdownLink(),
    },
    {
      label: "View as Markdown",
      icon: "i-lucide-file-text",
      trailingIcon: "i-lucide-arrow-up-right",
      to: `/api/public/posts/${slug.value}?format=markdown`,
      target: "_blank",
    },
  ],
]);

const scrollToHeading = (item: { id: string }) => {
  activeHeadingId.value = item.id;
  const element = document.querySelector(`[id="${item.id}"]`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

onMounted(() => {
  if (process.client && post.value?.headings?.length) {
    activeHeadingId.value = post.value.headings[0]?.id || "";

    post.value.headings.forEach((heading) => {
      const el = document.querySelector(`[id="${heading.id}"]`);
      if (el) {
        useIntersectionObserver(
          el as HTMLElement,
          (entries) => {
            if (entries[0]?.isIntersecting) {
              activeHeadingId.value = heading.id;
            }
          },
          {
            rootMargin: "-80px 0px -60% 0px",
            threshold: 0,
          }
        );
      }
    });
  }
});

useSeoMeta({
  title: computed(() => post.value?.title || "Post"),
  description: computed(() => `${post.value?.title || "Read post"} on Logos`),
});
</script>

<template>
  <div class="bg-default text-default selection:bg-primary/20 flex min-h-screen flex-col">
    <header class="bg-default/80 sticky top-0 z-30 backdrop-blur-md">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <UBreadcrumb :items="breadcrumbItems" class="text-sm" />

        <div class="flex items-center gap-2">
          <UButtonGroup v-if="post" size="sm" orientation="horizontal">
            <UButton variant="outline" color="neutral" icon="i-lucide-clipboard" label="Copy page"
              @click="copyPageAsMarkdown" />
            <UDropdownMenu :items="dropdownItems">
              <UButton variant="outline" color="neutral" icon="i-lucide-chevron-down" />
            </UDropdownMenu>
          </UButtonGroup>

          <UButton variant="ghost" color="neutral" size="sm" :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
            " aria-label="Toggle theme" @click="toggleTheme" />
        </div>
      </div>
    </header>

    <main class="relative flex-1">
      <div v-if="pending" class="mx-auto max-w-3xl space-y-6 px-6 py-16">
        <USkeleton class="bg-muted h-12 w-3/4 rounded-lg" />
        <div class="flex items-center gap-3">
          <USkeleton class="bg-muted size-10 rounded-full" />
          <div class="space-y-2">
            <USkeleton class="bg-muted h-4 w-32" />
            <USkeleton class="bg-muted h-3 w-24" />
          </div>
        </div>
        <USkeleton class="bg-muted mt-8 h-96 w-full rounded-lg" />
      </div>

      <div v-else-if="error || !post"
        class="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
        <UEmpty icon="i-lucide-file-x" title="Post not available"
          description="This post doesn't exist or is currently kept as a private draft.">
          <template #actions>
            <UButton to="/" icon="i-lucide-house"> Go to Home </UButton>
          </template>
        </UEmpty>
      </div>

      <div v-else class="relative">
        <div class="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <!-- Desktop Editorial ToC (Hanging Right) -->
          <aside v-if="post.headings && post.headings.length > 0"
            class="absolute top-16 bottom-0 left-full ml-10 hidden w-56 xl:block">
            <div class="sticky top-24">
              <span class="text-muted mb-4 block text-xs font-bold tracking-widest uppercase">On this page</span>
              <nav class="border-default border-l text-sm">
                <button v-for="item in post.headings" :key="item.id" type="button"
                  class="-ml-px block w-full cursor-pointer border-l-2 py-1 text-left transition-colors duration-200"
                  :class="[
                    activeHeadingId === item.id
                      ? 'border-primary text-primary font-medium'
                      : 'text-muted hover:text-highlighted hover:border-muted border-transparent',
                  ]" :style="{
                    paddingLeft: `${(item.level - 1) * 0.75 + 0.875}rem`,
                  }" @click="scrollToHeading(item)">
                  <span class="line-clamp-2 leading-relaxed">{{
                    item.text
                    }}</span>
                </button>
              </nav>
            </div>
          </aside>

          <!-- Article Content -->
          <article class="w-full">
            <header class="mb-8 space-y-4">
              <h1 class="text-highlighted text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
                {{ post.title || "Untitled" }}
              </h1>

              <div class="border-default text-muted flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-6 text-sm">
                <div class="flex items-center gap-2">
                  <UAvatar v-if="post.author?.avatar" :src="post.author.avatar" :alt="post.author.name || 'Author'"
                    size="sm" />
                  <UAvatar v-else icon="i-lucide-user" size="sm" color="neutral" />
                  <span class="text-highlighted font-medium">{{
                    post.author?.name || "Author"
                    }}</span>
                </div>

                <span class="opacity-40">•</span>
                <time :datetime="String(post.createdAt)">{{
                  formattedDate
                  }}</time>

                <span class="opacity-40">•</span>
                <span>{{ wordCountText }}</span>

                <span class="opacity-40">•</span>
                <span>{{ readingTimeText }}</span>
              </div>
            </header>

            <!-- Mobile ToC (< xl) -->
            <div v-if="post.headings && post.headings.length > 0"
              class="border-default bg-default/80 sticky top-[3.5rem] z-20 -mx-6 mb-10 border-b px-6 py-4 backdrop-blur-md xl:hidden">
              <details class="group">
                <summary
                  class="text-highlighted flex cursor-pointer items-center justify-between text-sm font-semibold">
                  Table of Contents
                  <UIcon name="i-lucide-chevron-down" class="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <nav class="mt-3 space-y-1.5 text-sm">
                  <button v-for="item in post.headings" :key="item.id" type="button"
                    class="block w-full cursor-pointer text-left transition-colors" :class="[
                      activeHeadingId === item.id
                        ? 'text-primary font-medium'
                        : 'text-muted hover:text-highlighted',
                    ]" :style="{ paddingLeft: `${(item.level - 1) * 1}rem` }" @click="scrollToHeading(item)">
                    <span class="line-clamp-2 leading-relaxed">{{
                      item.text
                      }}</span>
                  </button>
                </nav>
              </details>
            </div>

            <div class="prose dark:prose-invert max-w-none" v-html="post.content" />

            <footer class="border-default text-muted mt-16 flex items-center justify-between border-t pt-8 text-xs">
              <span>Published on Logos</span>
              <NuxtLink to="/admin" class="hover:text-highlighted font-medium transition">
                Studio →
              </NuxtLink>
            </footer>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>
