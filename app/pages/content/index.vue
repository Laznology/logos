<script setup lang="ts">
const { $csrfFetch } = useNuxtApp();
const toast = useToast();
const search = ref("");
const {
  data: pages,
  error,
  pending,
  refresh,
} = useCsrfFetch<PageListType>("/api/pages");
const filteredPages = computed(() => {
  if (!pages.value) {
    return [];
  }
  const q = search.value.trim().toLowerCase();
  if (!q) {
    return pages.value;
  }
  return pages.value.filter(
    (p) =>
      p.title.toLocaleLowerCase().includes(q) ||
      p.slug.toLocaleLowerCase().includes(q)
  );
});
const goToPage = (slug: string) => {
  navigateTo(`/${slug}`);
};

const goToNew = () => {
  navigateTo("/untitled");
};

const handleDelete = async (slug: string) => {
  try {
    await $csrfFetch(`/api/pages/${slug}`, {
      method: "DELETE",
    });
    refresh();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unexpected error occured";
    toast.add({
      title: "Failed to delete pages",
      description: errorMessage,
      color: "error",
    });
  }
};
</script>
<template>
  <div class="bg-default min-h-screen">
    <AppHeader />
    <UContainer class="py-8 md:py-12">
      <div
        class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 class="text-text text-2xl font-bold tracking-tight">Documents</h1>
          <p class="text-muted mt-1 text-sm">Manage and organize your pages</p>
        </div>
        <UButton
          icon="i-lucide-plus"
          lable="New Document"
          color="primary"
          @click="goToNew"
        />
      </div>
      <div class="mb-6">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search by tittle or slug ..."
          size="lg"
          class="max-w-md md:w-full"
        />
      </div>
      <div
        v-if="pending"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <USkeleton v-for="i in 6" :key="i" class="h-36 rounded-sm" />
      </div>
      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        title="Failed to load documents"
        :description="error.statusMessage || 'Something went wrong'"
        class="mb-4"
      >
        <template #actions>
          <UButton size="xs" color="error" variant="outline" @click="refresh()">
            Retry
          </UButton>
        </template>
      </UAlert>

      <UEmpty
        v-else-if="filteredPages.length === 0"
        icon="i-lucide-file-text"
        :title="search ? 'No matches found' : 'No documents yet'"
        :description="
          search
            ? 'Try adjusting your search terms'
            : 'Create your first document to get started'
        "
        class="py-16"
      >
        <template #actions>
          <UButton
            v-if="search"
            label="Clear Search"
            color="neutral"
            variant="ghost"
            @click="search = ''"
          />
          <UButton
            v-else
            label="Create Document"
            icon="i-lucide-plus"
            color="primary"
            @click="goToNew"
          />
        </template>
      </UEmpty>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UCard
          class="group"
          v-for="page in filteredPages"
          :key="page.id"
          @click="goToPage(page.slug)"
        >
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3
                  class="text-default group-hover:text-primary truncate font-semibold transition-colors"
                >
                  {{ page.title }}
                </h3>
                <p class="text-muted mt-1 truncate font-mono text-xs">
                  /{{ page.slug }}
                </p>
              </div>
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: 'Edit',
                      icon: 'i-lucide-pencil',
                      onSelect: () => navigateTo(`/pages/edit/${page.id}`),
                    },
                    {
                      label: 'Delete',
                      icon: 'i-lucide-trash-2',
                      color: 'error',
                      onSelect: () => handleDelete(page.slug),
                    },
                  ],
                ]"
                @click.stop
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </UDropdownMenu>
            </div>
          </template>
          <template #footer>
            <div class="text-dimmed flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <UAvatar
                  v-if="page.author?.avatar"
                  :src="page.author.avatar"
                  size="2xs"
                />
                <span v-else class="i-lucide-user text-[10px]" />
                <span class="max-w-30 truncate">
                  {{ page.author?.name || "You" }}
                </span>
              </div>
              <NuxtTime
                :datetime="page.updatedAt || page.createdAt"
                relative
                class="tabular-nums"
              />
            </div>
          </template>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
