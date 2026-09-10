<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

import type { PostBulkAction, PostStatus } from "#shared/types/post-status";
import {
  POST_STATUS_LABELS,
  POST_STATUS_VALUES,
  postStatus,
} from "#shared/types/post-status";

definePageMeta({
  layout: "studio",
  middleware: "auth",
});

type StatusFilter = "all" | PostStatus;

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $csrfFetch } = useNuxtApp();
const PAGE_SIZE = 20;
const initialPage = Number(route.query.page);
const routeStatus = route.query.status;
const search = ref(typeof route.query.q === "string" ? route.query.q : "");
const status = ref<StatusFilter>(
  POST_STATUS_VALUES.includes(routeStatus as PostStatus)
    ? (routeStatus as PostStatus)
    : "all"
);
const authorId = ref(
  typeof route.query.author === "string" ? route.query.author : "all"
);
const page = ref(
  Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1
);
const selectedIds = ref<string[]>([]);
const isBulkUpdating = ref(false);
const deleteDialogOpen = ref(false);

const {
  data: posts,
  error,
  pending,
  refresh,
} = await useFetch<PostListType>("/api/posts", {
  key: "studio-all-posts",
  default: () => [],
});

const statusOptions = [
  { label: "All statuses", value: "all" },
  ...POST_STATUS_VALUES.map((value) => ({
    label: POST_STATUS_LABELS[value],
    value,
  })),
];
const statusColors: Record<PostStatus, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  published: "success",
  private: "warning",
  archive: "neutral",
};

const authorOptions = computed(() => {
  const authors = new Map<string, string>();
  for (const post of posts.value || []) {
    if (post.author?.id && post.author.name) {
      authors.set(post.author.id, post.author.name);
    }
  }
  return [
    { label: "All authors", value: "all" },
    ...Array.from(authors, ([value, label]) => ({ label, value })),
  ];
});

const filteredPosts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return (posts.value || []).filter((post) => {
    const matchesQuery =
      !query ||
      post.title.toLocaleLowerCase().includes(query) ||
      post.slug.toLocaleLowerCase().includes(query);
    const matchesStatus =
      status.value === "all" || postStatus(post) === status.value;
    const matchesAuthor =
      authorId.value === "all" || post.author?.id === authorId.value;
    return matchesQuery && matchesStatus && matchesAuthor;
  });
});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredPosts.value.length / PAGE_SIZE))
);
const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredPosts.value.slice(start, start + PAGE_SIZE);
});
const resultText = computed(() => {
  const count = filteredPosts.value.length;
  return `${count} ${count === 1 ? "post" : "posts"}`;
});
const selectedPageIds = computed(() =>
  paginatedPosts.value.map((post) => post.id)
);
const selectedOnPageCount = computed(
  () =>
    selectedPageIds.value.filter((id) => selectedIds.value.includes(id)).length
);
const allPageSelected = computed(
  () =>
    selectedPageIds.value.length > 0 &&
    selectedOnPageCount.value === selectedPageIds.value.length
);
const pageSelection = computed<boolean | "indeterminate">(() => {
  if (allPageSelected.value) {
    return true;
  }
  if (selectedOnPageCount.value > 0) {
    return "indeterminate";
  }
  return false;
});

watch([search, status, authorId], () => {
  page.value = 1;
  selectedIds.value = [];
});
watch(pageCount, (count) => {
  if (page.value > count) {
    page.value = count;
  }
});
watch([search, status, authorId, page], () => {
  const query: Record<string, string> = {};
  if (search.value.trim()) {
    query.q = search.value.trim();
  }
  if (status.value !== "all") {
    query.status = status.value;
  }
  if (authorId.value !== "all") {
    query.author = authorId.value;
  }
  if (page.value > 1) {
    query.page = String(page.value);
  }
  router.replace({ query });
});

const togglePostSelection = (id: string, selected: boolean) => {
  selectedIds.value = selected
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter((selectedId) => selectedId !== id);
};
const togglePageSelection = (value: boolean | "indeterminate") => {
  const pageIds = new Set(selectedPageIds.value);
  selectedIds.value =
    value === true
      ? [...new Set([...selectedIds.value, ...pageIds])]
      : selectedIds.value.filter((id) => !pageIds.has(id));
};

const executeBulkAction = async (action: PostBulkAction) => {
  const ids = [...selectedIds.value];
  if (!ids.length) {
    return;
  }
  isBulkUpdating.value = true;
  try {
    const response = await $csrfFetch<{
      success: boolean;
      action: PostBulkAction;
      count: number;
    }>("/api/posts/bulk", {
      method: "POST",
      body: { ids, action },
    });
    selectedIds.value = [];
    await refresh();
    toast.add({
      title:
        action === "delete"
          ? `${response.count} posts deleted`
          : `${response.count} posts moved to ${POST_STATUS_LABELS[action]}`,
      color: action === "delete" ? "neutral" : "success",
      icon: action === "delete" ? "i-lucide-trash-2" : "i-lucide-check",
    });
  } catch {
    toast.add({
      title: "Bulk action failed",
      description: "Refresh the page and try again.",
      color: "error",
    });
  } finally {
    isBulkUpdating.value = false;
  }
};

const bulkActions = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Publish",
      icon: "i-lucide-globe",
      onSelect: () => executeBulkAction("published"),
    },
    {
      label: "Private",
      icon: "i-lucide-lock",
      onSelect: () => executeBulkAction("private"),
    },
    {
      label: "Archive",
      icon: "i-lucide-archive",
      onSelect: () => executeBulkAction("archive"),
    },
  ],
  [
    {
      label: "Delete",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => {
        deleteDialogOpen.value = true;
      },
    },
  ],
]);

const confirmDelete = async () => {
  deleteDialogOpen.value = false;
  await executeBulkAction("delete");
};
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col p-6 md:p-8">
    <div class="mx-auto w-full max-w-5xl space-y-6">
      <header class="flex items-end justify-between gap-4">
        <div>
          <p class="text-muted text-sm">Your writing space</p>
          <h1 class="text-highlighted text-2xl font-bold tracking-tight">
            All posts
          </h1>
          <p class="text-muted mt-1 text-sm">{{ resultText }}</p>
        </div>
        <UButton
          icon="i-lucide-plus"
          class="shrink-0"
          @click="navigateTo('/studio/posts/untitled')"
        >
          New post
        </UButton>
      </header>

      <div class="flex flex-col gap-3 sm:flex-row">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search posts or slugs..."
          aria-label="Search posts"
          class="min-w-0 flex-1"
        />
        <USelectMenu
          v-model="status"
          :items="statusOptions"
          value-key="value"
          :search-input="false"
          aria-label="Filter by status"
          class="sm:w-40"
        />
        <USelectMenu
          v-model="authorId"
          :items="authorOptions"
          value-key="value"
          :search-input="false"
          aria-label="Filter by author"
          class="sm:w-44"
        />
      </div>

      <div
        v-if="selectedIds.length"
        class="border-default bg-elevated/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
      >
        <span class="text-highlighted text-sm font-medium">
          {{ selectedIds.length }} selected
        </span>
        <UDropdownMenu :items="bulkActions">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-list-checks"
            label="Bulk actions"
            :loading="isBulkUpdating"
          />
        </UDropdownMenu>
      </div>

      <div v-if="pending" class="space-y-3">
        <USkeleton
          v-for="item in 6"
          :key="item"
          class="bg-muted h-16 w-full rounded-lg"
        />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Could not load posts"
        description="Refresh the page and try again."
      >
        <template #actions>
          <UButton
            color="error"
            variant="outline"
            size="sm"
            icon="i-lucide-refresh-cw"
            @click="refresh()"
          >
            Refresh
          </UButton>
        </template>
      </UAlert>

      <UEmpty
        v-else-if="paginatedPosts.length === 0"
        icon="i-lucide-file-search"
        title="No matching posts"
        description="Try another search or filter."
      />

      <section v-else aria-labelledby="all-posts-heading">
        <h2 id="all-posts-heading" class="sr-only">All posts</h2>
        <div class="border-default overflow-hidden rounded-xl border">
          <div
            class="border-default bg-elevated/20 flex items-center gap-3 border-b px-4 py-3"
          >
            <UCheckbox
              :model-value="pageSelection"
              aria-label="Select posts on this page"
              @update:model-value="togglePageSelection"
            />
            <span class="text-muted text-xs">Select page</span>
            <span v-if="selectedOnPageCount" class="text-muted ml-auto text-xs">
              {{ selectedOnPageCount }} selected on page
            </span>
          </div>
          <div class="divide-default divide-y">
            <div
              v-for="post in paginatedPosts"
              :key="post.id"
              class="group hover:bg-muted/40 flex items-center gap-3 px-4 py-4 transition"
            >
              <UCheckbox
                :model-value="selectedIds.includes(post.id)"
                :aria-label="`Select ${post.title || 'Untitled'}`"
                @click.stop
                @update:model-value="
                  togglePostSelection(post.id, $event === true)
                "
              />
              <NuxtLink
                :to="`/studio/posts/${post.slug}`"
                class="min-w-0 flex-1"
              >
                <span
                  class="text-highlighted group-hover:text-primary block truncate font-semibold transition"
                >
                  {{ post.title || "Untitled" }}
                </span>
                <span class="text-muted block truncate text-xs">
                  /{{ post.slug }}
                </span>
              </NuxtLink>
              <span class="flex shrink-0 items-center gap-3">
                <UBadge
                  :color="statusColors[postStatus(post)]"
                  variant="subtle"
                  :label="POST_STATUS_LABELS[postStatus(post)]"
                  class="hidden sm:inline-flex"
                />
                <NuxtTime
                  :datetime="post.updatedAt"
                  locale="en-US"
                  month="short"
                  day="numeric"
                  year="numeric"
                  class="text-muted hidden text-xs md:inline"
                />
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="text-muted group-hover:text-primary size-4 transition"
                />
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="pageCount > 1"
          class="border-default mt-5 flex items-center justify-between gap-4 border-t pt-5"
        >
          <span class="text-muted text-sm">
            Page {{ page }} of {{ pageCount }}
          </span>
          <UPagination
            v-model:page="page"
            :total="filteredPosts.length"
            :items-per-page="PAGE_SIZE"
            show-edges
          />
        </div>
      </section>
    </div>
  </div>

  <UModal
    v-model:open="deleteDialogOpen"
    title="Delete selected posts?"
    :description="`This permanently deletes ${selectedIds.length} ${selectedIds.length === 1 ? 'post' : 'posts'}.`"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="deleteDialogOpen = false"
        />
        <UButton
          color="error"
          icon="i-lucide-trash-2"
          label="Delete posts"
          :loading="isBulkUpdating"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
