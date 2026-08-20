<script setup lang="ts">
import type {
  BreadcrumbItem,
  CommandPaletteGroup,
  NavigationMenuItem,
} from "@nuxt/ui";

const FILE_ICON = "i-lucide-file-text";
const ADMIN_POSTS_PATH = "/admin";
const route = useRoute();
const isCommandPaletteOpen = ref(false);

const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
const searchQuery = ref("");
const deboundeQuery = refDebounced(searchQuery, 300);
const {
  data: searchResult,
  error,
  pending: isSearching,
} = useCsrfFetch<PostSearchListType>("/api/posts", {
  key: "admin-global-search-posts",
  query: { q: deboundeQuery },
  immediate: false,
  watch: [deboundeQuery],
});

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const segments = route.path.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Home", icon: "i-lucide-house", to: "/" }];
  }
  return segments.map((segment, index) => {
    const to = `/${segments.slice(0, index + 1).join("/")}`;
    let raw = segment;
    if (index === segments.length - 1 && segments.length > 2) {
      raw = raw.replace(/-[a-z0-9]{4,8}$/i, "");
    }
    const label =
      raw.charAt(0).toUpperCase() + raw.slice(1).replaceAll("-", " ");
    return {
      label,
      to: index === segments.length - 1 ? undefined : to,
      icon: index === 0 ? "i-lucide-layout-dashboard" : undefined,
    };
  });
});

const commandGroups = computed<CommandPaletteGroup[]>(() => [
  {
    id: "posts",
    label: "Posts",
    items: (searchResult.value || []).map((post) => ({
      id: post.id,
      label: post.title,
      suffix: `/${post.slug}`,
      icon: FILE_ICON,
      avatar: post.author.avatar ? { src: post.author.avatar } : undefined,
      onSelect: () => {
        isCommandPaletteOpen.value = false;
        navigateTo(`/admin/posts/${post.slug}`);
      },
    })),
  },
]);
const isCollapsed = useCookie<boolean>("admin_sidebar_collapsed", {
  default: () => false,
});

const { data: sidebarPosts } = useCsrfFetch<PostListType>("/api/posts", {
  key: "admin-sidebar-posts",
  default: () => [],
});

const navItems = computed<NavigationMenuItem[][]>(() => {
  const recentPosts = (sidebarPosts.value || []).slice(0, 10).map((post) => ({
    label: post.title || "Untitled",
    icon: FILE_ICON,
    to: `/admin/posts/${post.slug}`,
  }));

  return [
    [
      { label: "Home", icon: "i-lucide-house", to: ADMIN_POSTS_PATH },
      {
        label: "Search",
        icon: "i-lucide-search",
        slot: "search" as const,
        onSelect: () => {
          isCommandPaletteOpen.value = true;
        },
      },
    ],
    ...(recentPosts.length
      ? [[{ label: "Recents", type: "label" as const }, ...recentPosts]]
      : []),
  ];
});
</script>

<template>
  <UDashboardGroup
    class="bg-default text-default h-screen w-screen overflow-hidden"
  >
    <UDashboardSidebar
      v-model:collapsed="isCollapsed"
      collapsible
      :collapsed-size="0"
      side="left"
      :ui="{
        root: 'transition-[width] duration-300 ease-in-out motion-reduce:transition-none data-[collapsed=true]:!w-0 data-[collapsed=true]:!min-w-0 data-[collapsed=true]:!border-none data-[collapsed=true]:overflow-hidden',
      }"
    >
      <template #header="{ collapsed }">
        <div class="flex w-full items-center justify-between">
          <div class="flex items-center gap-2">
            <UAvatar icon="i-lucide-box" size="sm" color="neutral" />
            <span v-if="!collapsed" class="text-highlighted font-semibold">
              Logos
            </span>
          </div>
          <UButton
            v-if="!collapsed"
            icon="i-lucide-panel-left-close"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Collapse sidebar"
            @click="isCollapsed = true"
          />
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          orientation="vertical"
          :collapsed="collapsed"
          :items="navItems"
        >
          <template #search-trailing>
            <UKbd value="meta" size="sm" />
            <UKbd value="K" size="sm" />
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full items-center justify-between">
          <div
            v-if="!collapsed"
            class="text-muted flex items-center gap-2 text-xs"
          >
            <span>Logos Studio</span>
          </div>
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
      </template>
    </UDashboardSidebar>

    <UDashboardPanel class="relative min-h-0 flex-1 overflow-hidden">
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UButton
              v-if="isCollapsed"
              icon="i-lucide-panel-left"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Expand sidebar"
              @click="isCollapsed = false"
            />
            <UBreadcrumb :items="breadcrumbItems" class="text-sm" />
          </div>
        </template>

        <template #right>
          <div id="navbar-actions" class="flex items-center gap-2" />
        </template>
      </UDashboardNavbar>

      <main class="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <slot />
      </main>
    </UDashboardPanel>

    <UDashboardSearch
      v-model:open="isCommandPaletteOpen"
      v-model:search-term="searchQuery"
      :groups="commandGroups"
      :loading="isSearching"
      placeholder="Search posts..."
    />
  </UDashboardGroup>
</template>
